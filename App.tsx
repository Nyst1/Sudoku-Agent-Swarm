import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, SimulationParams, HistoryPoint, ScoreRecord, ConstraintMode } from './types';
import { DEFAULT_PARAMS } from './constants';
import { runSimulationTick } from './utils/simulationLogic';
import GridBoard from './components/GridBoard';
import SimulationControls from './components/SimulationControls';
import NumberPalette from './components/NumberPalette';
import AboutModal from './components/AboutModal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Eraser, Play, Info, Trophy, Settings, Box, Move, Grid3X3, ArrowRightLeft, ArrowUpDown } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  // agents contains BOTH fixed and mobile agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreRecord[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const simulationTimerRef = useRef<number | null>(null);

  // Tooltip State for Scoreboard
  const [hoveredRunConfig, setHoveredRunConfig] = useState<{ params: SimulationParams, x: number, y: number } | null>(null);

  // --- Actions ---

  // Adds or replaces a fixed agent during setup
  const handleCellDrop = (r: number, c: number, val: number) => {
    if (!isSetupMode) return;
    
    // Changing board setup resets the scoreboard comparisons
    setScoreboard([]);

    setAgents(prev => {
      // Remove existing agent at this cell if any
      const filtered = prev.filter(a => !(a.pos.r === r && a.pos.c === c));
      // Add new fixed agent
      return [...filtered, {
        id: `fixed-${r}-${c}-${Date.now()}`,
        val,
        pos: { r, c },
        stress: 0,
        consecutiveStressTicks: 0,
        isFixed: true
      }];
    });
  };

  // Removes a fixed agent during setup
  const handleCellClick = (r: number, c: number) => {
    if (!isSetupMode) return;
    setScoreboard([]); // Reset scoreboard
    setAgents(prev => prev.filter(a => !(a.pos.r === r && a.pos.c === c)));
  };

  const handleClearBoard = () => {
    setScoreboard([]); // Reset scoreboard
    setAgents([]);
  };

  const startSimulation = () => {
    const newAgents: Agent[] = [...agents.filter(a => a.isFixed)];

    // Determine initialization strategy based on mode
    if (params.constraintMode === 'box') {
      // --- BOX MODE INITIALIZATION ---
      // Ensure exactly one of each number (1-9) in each 3x3 box
      
      const getBoxIdx = (r: number, c: number) => Math.floor(r/3)*3 + Math.floor(c/3);
      
      const boxEmptySpots: {r:number, c:number}[][] = Array(9).fill(null).map(() => []);
      const boxFixedValues: number[][] = Array(9).fill(null).map(() => []);

      for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
          const b = getBoxIdx(r, c);
          const fixedAgent = agents.find(a => a.isFixed && a.pos.r === r && a.pos.c === c);
          if (fixedAgent) {
            boxFixedValues[b].push(fixedAgent.val);
          } else {
            boxEmptySpots[b].push({r, c});
          }
        }
      }

      for (let b=0; b<9; b++) {
        const fixed = boxFixedValues[b];
        const empty = boxEmptySpots[b];
        
        let available = [1,2,3,4,5,6,7,8,9];
        for (const fVal of fixed) {
          const idx = available.indexOf(fVal);
          if (idx !== -1) available.splice(idx, 1);
        }
        available.sort(() => Math.random() - 0.5);
        
        for (let i=0; i<empty.length; i++) {
           if (i < available.length) {
             newAgents.push({
                id: `agent-${available[i]}-${b}-${i}-${Date.now()}`,
                val: available[i],
                pos: empty[i],
                stress: 0,
                consecutiveStressTicks: 0,
                isFixed: false
             });
           }
        }
      }
    } 
    else if (params.constraintMode === 'row') {
      // --- ROW MODE INITIALIZATION ---
      // Ensure exactly one of each number (1-9) in each ROW
      
      const rowEmptySpots: {r:number, c:number}[][] = Array(9).fill(null).map(() => []);
      const rowFixedValues: number[][] = Array(9).fill(null).map(() => []);

      for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
          const fixedAgent = agents.find(a => a.isFixed && a.pos.r === r && a.pos.c === c);
          if (fixedAgent) {
            rowFixedValues[r].push(fixedAgent.val);
          } else {
            rowEmptySpots[r].push({r, c});
          }
        }
      }

      for (let r=0; r<9; r++) {
        const fixed = rowFixedValues[r];
        const empty = rowEmptySpots[r];
        
        let available = [1,2,3,4,5,6,7,8,9];
        for (const fVal of fixed) {
          const idx = available.indexOf(fVal);
          if (idx !== -1) available.splice(idx, 1);
        }
        available.sort(() => Math.random() - 0.5);
        
        for (let i=0; i<empty.length; i++) {
           if (i < available.length) {
             newAgents.push({
                id: `agent-${available[i]}-row-${r}-${i}-${Date.now()}`,
                val: available[i],
                pos: empty[i],
                stress: 0,
                consecutiveStressTicks: 0,
                isFixed: false
             });
           }
        }
      }
    }
    else if (params.constraintMode === 'col') {
      // --- COLUMN MODE INITIALIZATION ---
      // Ensure exactly one of each number (1-9) in each COLUMN
      
      const colEmptySpots: {r:number, c:number}[][] = Array(9).fill(null).map(() => []);
      const colFixedValues: number[][] = Array(9).fill(null).map(() => []);

      for (let r=0; r<9; r++) {
        for (let c=0; c<9; c++) {
          const fixedAgent = agents.find(a => a.isFixed && a.pos.r === r && a.pos.c === c);
          if (fixedAgent) {
            colFixedValues[c].push(fixedAgent.val);
          } else {
            colEmptySpots[c].push({r, c});
          }
        }
      }

      for (let c=0; c<9; c++) {
        const fixed = colFixedValues[c];
        const empty = colEmptySpots[c];
        
        let available = [1,2,3,4,5,6,7,8,9];
        for (const fVal of fixed) {
          const idx = available.indexOf(fVal);
          if (idx !== -1) available.splice(idx, 1);
        }
        available.sort(() => Math.random() - 0.5);
        
        for (let i=0; i<empty.length; i++) {
           if (i < available.length) {
             newAgents.push({
                id: `agent-${available[i]}-col-${c}-${i}-${Date.now()}`,
                val: available[i],
                pos: empty[i],
                stress: 0,
                consecutiveStressTicks: 0,
                isFixed: false
             });
           }
        }
      }
    }
    else {
      // --- FREE MODE INITIALIZATION ---
      // Ensure 9 of each number total across the whole board
      
      const counts = Array(10).fill(0);
      const occupiedPositions = new Set<string>();

      agents.forEach(a => {
        if (a.isFixed) {
          counts[a.val]++;
          occupiedPositions.add(`${a.pos.r},${a.pos.c}`);
        }
      });

      const emptySpots: { r: number, c: number }[] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!occupiedPositions.has(`${r},${c}`)) {
            emptySpots.push({ r, c });
          }
        }
      }
      emptySpots.sort(() => Math.random() - 0.5);

      let spotIndex = 0;

      for (let num = 1; num <= 9; num++) {
        const currentCount = counts[num];
        const needed = Math.max(0, 9 - currentCount);

        for (let i = 0; i < needed; i++) {
          if (spotIndex < emptySpots.length) {
            newAgents.push({
              id: `agent-${num}-${i}-${Date.now()}`,
              val: num,
              pos: emptySpots[spotIndex],
              stress: 0,
              consecutiveStressTicks: 0,
              isFixed: false
            });
            spotIndex++;
          }
        }
      }
    }

    setAgents(newAgents);
    setIsSetupMode(false);
    setIsPlaying(true);
    setTickCount(0);
    setHistory([]);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsSetupMode(true);
    // Remove all mobile agents, keep fixed ones
    setAgents(prev => prev.filter(a => a.isFixed));
    setHistory([]);
    setTickCount(0);
    // Do NOT reset scoreboard here, so user can compare runs
  };

  // --- Simulation Loop ---
  const tick = useCallback(() => {
    setAgents(prevAgents => {
      const nextAgents = runSimulationTick(prevAgents, params);
      return nextAgents;
    });
    
    // Increment tick independently
    setTickCount(t => {
        const newTick = t + 1;
        return newTick;
    });
  }, [params]);

  // Handle Intervals
  useEffect(() => {
    if (isPlaying && !isSetupMode) {
      simulationTimerRef.current = window.setInterval(tick, params.simulationSpeed);
    } else if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isPlaying, isSetupMode, params.simulationSpeed, tick]);

  // Handle Stop Condition & Stats Updates
  useEffect(() => {
    if (!isSetupMode && agents.length > 0) {
        const totalStress = agents.reduce((sum, a) => sum + a.stress, 0);

        // Update History
        if (tickCount % 5 === 0 && isPlaying) {
             setHistory(h => {
                 const newHistory = [...h, { tick: tickCount, totalStress, solvedCount: 0 }];
                 return newHistory.slice(-50);
             });
        }

        // Check Success
        // Ensure we have run at least 1 tick (tickCount > 0)
        if (totalStress <= 1 && isPlaying && tickCount > 0) {
            setIsPlaying(false);
            setScoreboard(prev => {
                const newRecord = {
                    runId: Date.now(),
                    ticks: tickCount,
                    params: { ...params },
                    timestamp: new Date().toLocaleTimeString()
                };
                // Add new record and sort by ticks (ascending)
                return [...prev, newRecord].sort((a, b) => a.ticks - b.ticks);
            });
        }
    }
  }, [agents, isPlaying, isSetupMode, tickCount, params]);

  const totalCurrentStress = agents.reduce((sum, a) => sum + a.stress, 0);

  const setConstraintMode = (mode: ConstraintMode) => {
    setParams(p => ({ ...p, constraintMode: mode }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans">
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      
      <header className="mb-6 text-center max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center justify-center gap-3 mb-2">
          <BrainCircuit className="text-indigo-600" size={36} />
          Sudoku Agent Swarm
          <button 
            onClick={() => setShowAbout(true)}
            className="ml-2 p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
            title="About Simulation"
          >
            <Info size={24} />
          </button>
        </h1>
        <p className="text-slate-600 leading-relaxed text-sm md:text-base">
          {isSetupMode 
            ? "Setup Phase: Place fixed numbers and choose a simulation mode." 
            : "Simulation Phase: Watch agents cooperate to solve the puzzle."}
        </p>
      </header>

      <div className="flex flex-col xl:flex-row gap-8 items-start justify-center w-full max-w-7xl">
        
        {/* Left Column: Board */}
        <div className="flex-1 flex flex-col items-center gap-6 w-full xl:w-auto">
          <GridBoard 
            agents={agents} 
            isSetupMode={isSetupMode}
            onCellDrop={handleCellDrop}
            onCellClick={handleCellClick}
            animationSpeed={params.simulationSpeed}
          />
          
          {isSetupMode && (
             <div className="w-full max-w-xl">
                <NumberPalette />
             </div>
          )}
        </div>

        {/* Right Column: Controls & Stats */}
        <div className="w-full xl:w-[500px] flex flex-col gap-6">
          
          {isSetupMode ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
               <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">Swarm Setup</h2>
               
               <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Simulation Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConstraintMode('none')}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${params.constraintMode === 'none' 
                           ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                           : 'border-slate-200 hover:border-slate-300 text-slate-500'}
                      `}
                    >
                      <Move size={24} />
                      <span className="font-bold text-sm">Free Mode</span>
                      <span className="text-xs text-center opacity-75">Agents move anywhere. Random start.</span>
                    </button>

                    <button
                      onClick={() => setConstraintMode('box')}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${params.constraintMode === 'box' 
                           ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                           : 'border-slate-200 hover:border-slate-300 text-slate-500'}
                      `}
                    >
                      <Grid3X3 size={24} />
                      <span className="font-bold text-sm">Box Mode</span>
                      <span className="text-xs text-center opacity-75">Lock to 3x3 box. Start with 1-9 in each.</span>
                    </button>

                    <button
                      onClick={() => setConstraintMode('row')}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${params.constraintMode === 'row' 
                           ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                           : 'border-slate-200 hover:border-slate-300 text-slate-500'}
                      `}
                    >
                      <ArrowRightLeft size={24} />
                      <span className="font-bold text-sm">Row Mode</span>
                      <span className="text-xs text-center opacity-75">Lock to Row. Start with 1-9 in each.</span>
                    </button>

                    <button
                      onClick={() => setConstraintMode('col')}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${params.constraintMode === 'col' 
                           ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                           : 'border-slate-200 hover:border-slate-300 text-slate-500'}
                      `}
                    >
                      <ArrowUpDown size={24} />
                      <span className="font-bold text-sm">Column Mode</span>
                      <span className="text-xs text-center opacity-75">Lock to Col. Start with 1-9 in each.</span>
                    </button>
                  </div>
               </div>

               <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                 <button 
                    onClick={startSimulation}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                 >
                    <Play size={20} /> Start Swarm
                 </button>
                 <button 
                    onClick={handleClearBoard}
                    className="px-4 py-3 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-medium flex items-center gap-2 transition-colors"
                 >
                    <Eraser size={20} /> Clear
                 </button>
               </div>
            </div>
          ) : (
            <SimulationControls 
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onReset={handleReset}
              onRestart={startSimulation}
              params={params}
              setParams={setParams}
              tickCount={tickCount}
              totalStress={totalCurrentStress}
            />
          )}

          {!isSetupMode && (
            <>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">System Stress Level</h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <XAxis dataKey="tick" hide />
                        <YAxis hide />
                        <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        itemStyle={{ color: '#e11d48' }}
                        />
                        <Line 
                        type="monotone" 
                        dataKey="totalStress" 
                        stroke="#e11d48" 
                        strokeWidth={2} 
                        dot={false} 
                        animationDuration={300}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {scoreboard.length > 0 && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-500 relative">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                             <Trophy size={16} className="text-amber-500" />
                             Run History
                        </h3>
                        <div className="overflow-x-auto max-h-60 overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 border-b border-slate-100 sticky top-0 bg-white">
                                    <tr>
                                        <th className="pb-2 font-semibold pl-2">Time</th>
                                        <th className="pb-2 font-semibold">Ticks</th>
                                        <th className="pb-2 font-semibold text-center">Config</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    {scoreboard.map((run) => (
                                        <tr key={run.runId} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-2 pl-2">{run.timestamp}</td>
                                            <td className="py-2 font-bold text-indigo-600">{run.ticks}</td>
                                            <td className="py-2 text-center">
                                                <div 
                                                    className="inline-block p-1 hover:bg-slate-100 rounded-full transition-colors cursor-help"
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredRunConfig({
                                                            params: run.params,
                                                            x: rect.left,
                                                            y: rect.top
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredRunConfig(null)}
                                                >
                                                    <Settings size={16} className="text-slate-400" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-sm text-slate-600 space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Agent Religions (Rules)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Row/Col/Box Religion:</strong> Agents feel stress if another agent of the same number is in their row, column, or 3x3 box.</li>
              <li><strong>Desperation:</strong> The longer an agent remains stressed, the lower their movement threshold becomes, eventually forcing them to move even to suboptimal spots.</li>
              <li><strong>Panic:</strong> Long-term stress introduces randomness, making agents jump erratically to break deadlocks.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Global Fixed Tooltip for Scoreboard */}
      {hoveredRunConfig && (
        <div 
            className="fixed z-[100] w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl pointer-events-none animate-in fade-in duration-150"
            style={{
                // Position to the left of the icon (approx 270px offset), vertically aligned top
                left: `${Math.max(10, hoveredRunConfig.x - 270)}px`, 
                top: `${hoveredRunConfig.y}px` 
            }}
        >
            <div className="font-bold text-slate-300 mb-2 border-b border-slate-600 pb-1">Run Parameters</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-400">Mode:</span>
                <span className="uppercase text-indigo-400">{hoveredRunConfig.params.constraintMode}</span>

                <span className="text-slate-400">Infection:</span>
                <span>{Math.round(hoveredRunConfig.params.infectionRate * 100)}%</span>
                
                <span className="text-slate-400">Threshold:</span>
                <span>{hoveredRunConfig.params.stressThreshold}</span>
                
                <span className="text-slate-400">Decay:</span>
                <span>{hoveredRunConfig.params.thresholdDecay}</span>
                
                <span className="text-slate-400">Randomness:</span>
                <span>{hoveredRunConfig.params.randomnessFactor}</span>
                
                <span className="text-slate-400">Crowding:</span>
                <span>{hoveredRunConfig.params.crowdingPenalty}</span>
                
                <span className="text-slate-400">Row Pen:</span>
                <span>{hoveredRunConfig.params.rowPenalty}</span>
                
                <span className="text-slate-400">Col Pen:</span>
                <span>{hoveredRunConfig.params.colPenalty}</span>
                
                <span className="text-slate-400">Box Pen:</span>
                <span>{hoveredRunConfig.params.boxPenalty}</span>
                
                <span className="text-slate-400">Accumul:</span>
                <span>{hoveredRunConfig.params.stressAccumulation}</span>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;