export type ConstraintMode = 'none' | 'box' | 'row' | 'col';

export interface Position {
  r: number;
  c: number;
}

export interface Agent {
  id: string;
  val: number; // 1-9
  pos: Position;
  stress: number;
  consecutiveStressTicks: number; // Tracks how long agent has been stressed
  isFixed: boolean; // Fixed numbers are not agents, but occupy space
}

export interface SimulationParams {
  infectionRate: number; // 0.0 to 1.0
  stressThreshold: number; // Stress level that triggers movement
  thresholdDecay: number; // How much threshold lowers per tick of stress
  randomnessFactor: number; // How much random noise influences movement when stressed
  crowdingPenalty: number; // Stress added per extra agent in cell
  rowPenalty: number; // Stress for breaking Row rule
  colPenalty: number; // Stress for breaking Col rule
  boxPenalty: number; // Stress for breaking Box rule
  stressAccumulation: number; // Passive stress increase if already stressed
  simulationSpeed: number; // ms per tick
  constraintMode: ConstraintMode; // 'none', 'box', 'row', or 'col'
}

export interface HistoryPoint {
  tick: number;
  totalStress: number;
  solvedCount: number;
}

export interface ScoreRecord {
  runId: number;
  ticks: number;
  params: SimulationParams;
  timestamp: string;
}