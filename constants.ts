import { SimulationParams } from './types';

// Empty board for user setup
export const INITIAL_BOARD = Array(9).fill(null).map(() => Array(9).fill(0));

export const DEFAULT_PARAMS: SimulationParams = {
  infectionRate: 0.2,    // 20% of stress transferred to neighbors
  stressThreshold: 5,    // Agents try to move if stress > 5
  thresholdDecay: 0.5,   // Threshold lowers by 0.5 every tick the agent is stressed
  randomnessFactor: 2.0, // Adds random noise to movement decisions based on stress duration
  crowdingPenalty: 5,    // Low penalty allows agents to "pass through" each other.
  rowPenalty: 20,        // Penalty for breaking Row rules
  colPenalty: 20,        // Penalty for breaking Col rules
  boxPenalty: 20,        // Penalty for breaking Box rules
  stressAccumulation: 0.1, // Stress increases slowly over time if unresolved
  simulationSpeed: 200,   // Slower default to appreciate the smooth movement
  constraintMode: 'none',
};

export const COLORS = [
  '#ef4444', // red (high stress)
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16', // green (low stress)
];