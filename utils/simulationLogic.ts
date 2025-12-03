import { Agent, Position, SimulationParams } from '../types';

// Helper to check standard Sudoku constraints
const countInRegion = (
  agents: Agent[],
  val: number,
  pos: Position,
  regionType: 'row' | 'col' | 'box'
): number => {
  return agents.filter(a => {
    if (a.val !== val) return false;
    
    if (regionType === 'row') return a.pos.r === pos.r;
    if (regionType === 'col') return a.pos.c === pos.c;
    if (regionType === 'box') {
      const boxR = Math.floor(pos.r / 3);
      const boxC = Math.floor(pos.c / 3);
      const aBoxR = Math.floor(a.pos.r / 3);
      const aBoxC = Math.floor(a.pos.c / 3);
      return boxR === aBoxR && boxC === aBoxC;
    }
    return false;
  }).length;
};

// Calculate stress for a single agent at a specific position
export const calculatePotentialStress = (
  agent: Agent,
  targetPos: Position,
  allAgents: Agent[],
  params: SimulationParams
): number => {
  let stress = 0;

  // 1. Superreligion: Crowding (One agent per cell)
  // Check how many OTHER agents are in the target position
  const othersInCell = allAgents.filter(a => 
    a.id !== agent.id && a.pos.r === targetPos.r && a.pos.c === targetPos.c
  );
  
  // Crowding penalty
  if (othersInCell.length > 0) {
    stress += othersInCell.length * params.crowdingPenalty;
  }

  // 2. Row Religion: Unique in Row
  const rowCount = countInRegion(allAgents.filter(a => a.id !== agent.id), agent.val, targetPos, 'row');
  if (rowCount > 0) stress += rowCount * params.rowPenalty;

  // 3. Col Religion: Unique in Col
  const colCount = countInRegion(allAgents.filter(a => a.id !== agent.id), agent.val, targetPos, 'col');
  if (colCount > 0) stress += colCount * params.colPenalty;

  // 4. Box Religion: Unique in Box
  const boxCount = countInRegion(allAgents.filter(a => a.id !== agent.id), agent.val, targetPos, 'box');
  if (boxCount > 0) stress += boxCount * params.boxPenalty;

  return stress;
};

// Helper to check if a move is valid based on constraint mode
const isValidMove = (current: Position, target: Position, mode: SimulationParams['constraintMode']): boolean => {
  // Basic boundary check
  if (target.r < 0 || target.r > 8 || target.c < 0 || target.c > 8) return false;

  if (mode === 'box') {
    const currentBox = Math.floor(current.r / 3) * 3 + Math.floor(current.c / 3);
    const targetBox = Math.floor(target.r / 3) * 3 + Math.floor(target.c / 3);
    return currentBox === targetBox;
  }

  if (mode === 'row') {
    return current.r === target.r;
  }

  if (mode === 'col') {
    return current.c === target.c;
  }
  
  return true;
};

export const runSimulationTick = (
  currentAgents: Agent[],
  params: SimulationParams
): Agent[] => {
  // Deep copy to avoid mutation
  let nextAgents = currentAgents.map(a => ({ ...a }));

  // 1. Calculate base stress for everyone based on CURRENT positions
  nextAgents.forEach(agent => {
    // Determine base stress from rules
    const ruleStress = calculatePotentialStress(agent, agent.pos, currentAgents, params);
    
    // Update logic for stress accumulation and memory
    if (agent.stress > 0) {
        agent.stress += params.stressAccumulation;
    }
    
    // Blend new stress with old stress
    agent.stress = ruleStress + (agent.stress * 0.1);

    // Track Consecutive Stress for "Desperation" logic
    // CRITICAL UPDATE: If ruleStress is 0 (agent is happy with rules), reset panic immediately.
    // This overrides infection stress or accumulated stress memory regarding panic behavior.
    if (ruleStress === 0) {
      agent.consecutiveStressTicks = 0;
    } else if (agent.stress > params.stressThreshold) {
      agent.consecutiveStressTicks = (agent.consecutiveStressTicks || 0) + 1;
    } else {
      agent.consecutiveStressTicks = 0;
    }
  });

  // 2. Infection Phase (Propagate stress to spatial neighbors)
  const infectionMap = new Map<string, number>(); 
  
  nextAgents.forEach(source => {
    if (source.stress > params.stressThreshold) {
      nextAgents.forEach(target => {
        if (source.id !== target.id) {
          const dr = Math.abs(source.pos.r - target.pos.r);
          const dc = Math.abs(source.pos.c - target.pos.c);
          // If adjacent (including diagonals)
          if (dr <= 1 && dc <= 1) {
            const added = source.stress * params.infectionRate;
            const currentAdded = infectionMap.get(target.id) || 0;
            infectionMap.set(target.id, currentAdded + added);
          }
        }
      });
    }
  });

  nextAgents.forEach(agent => {
    const infection = infectionMap.get(agent.id) || 0;
    agent.stress += infection;
  });

  // 3. Movement Phase
  const shuffledIndices = Array.from({ length: nextAgents.length }, (_, i) => i)
    .sort(() => Math.random() - 0.5);

  for (const idx of shuffledIndices) {
    const agent = nextAgents[idx];
    
    if (agent.isFixed) continue;

    // Calculate Dynamic Threshold (Desperation)
    // As consecutive stress increases, the threshold to move decreases (can go negative, forcing moves even if slightly bad)
    const effectiveThreshold = Math.max(0, params.stressThreshold - (agent.consecutiveStressTicks * params.thresholdDecay));

    // Only move if stress exceeds dynamic threshold
    if (agent.stress > effectiveThreshold) {
      const currentPos = agent.pos;
      const candidates: Position[] = [
        { r: currentPos.r - 1, c: currentPos.c }, // Up
        { r: currentPos.r + 1, c: currentPos.c }, // Down
        { r: currentPos.r, c: currentPos.c - 1 }, // Left
        { r: currentPos.r, c: currentPos.c + 1 }, // Right
      ];

      // Filter valid candidates based on board limits AND constraint mode
      const validCandidates = candidates.filter(p => isValidMove(currentPos, p, params.constraintMode));

      // --- Movement Decision Logic ---
      
      // 1. Calculate RAW scores for all options (current + neighbors)
      const currentScore = calculatePotentialStress(agent, currentPos, nextAgents, params);
      const candidateScores = validCandidates.map(pos => ({
        pos,
        score: calculatePotentialStress(agent, pos, nextAgents, params)
      }));

      // 2. Check for PERFECT spots (Score 0)
      // If any spot (current or neighbor) has 0 stress, we prioritize it absolutely.
      // We do NOT apply random noise to perfect spots, preventing panic from ruining a solution.
      const perfectSpots = candidateScores.filter(c => c.score === 0);
      const isCurrentPerfect = currentScore === 0;

      if (perfectSpots.length > 0 || isCurrentPerfect) {
        // If current is perfect, stay (unless a neighbor is also perfect? No, lazy agents stay).
        if (isCurrentPerfect) {
          agent.pos = currentPos;
        } else {
          // Pick a random perfect neighbor
          const winner = perfectSpots[Math.floor(Math.random() * perfectSpots.length)];
          agent.pos = winner.pos;
        }
      } 
      else {
        // 3. No perfect spots found - Apply Panic/Noise Logic
        // This logic helps escape local minima (e.g., stuck in a "5 stress" spot surrounded by "10 stress" spots)
        
        let bestPos = currentPos;
        let bestScoreWithNoise = currentScore; 
        
        // Apply noise to current position too (maybe the agent is "restless")
        if (agent.consecutiveStressTicks > 5) {
             const noise = Math.random() * agent.consecutiveStressTicks * params.randomnessFactor;
             bestScoreWithNoise = currentScore - noise;
        }

        for (const cand of candidateScores) {
          let scoreWithNoise = cand.score;

          // Apply Randomness/Noise Injection if panicking
          if (agent.consecutiveStressTicks > 5) {
              const noise = Math.random() * agent.consecutiveStressTicks * params.randomnessFactor;
              // Subtracting noise makes a high-stress spot look artificially "lower stress"
              scoreWithNoise = cand.score - noise;
          }

          if (scoreWithNoise < bestScoreWithNoise) {
            bestScoreWithNoise = scoreWithNoise;
            bestPos = cand.pos;
          }
        }
        
        // Execute Move
        agent.pos = bestPos;
      }
    }
  }

  return nextAgents;
};