import React from 'react';
import { SimulationParams } from '../types';
import { Play, Pause, RotateCcw, Activity, Info, RefreshCw, Repeat } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onRestart: () => void;
  params: SimulationParams;
  setParams: (p: SimulationParams) => void;
  tickCount: number;
  totalStress: number;
  batchStatus?: { current: number; total: number } | null;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  displayValue: string;
  description: string;
  colorClass?: string;
  bgClass?: string;
}

const SliderControl: React.FC<SliderProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  displayValue, 
  description, 
  colorClass = "accent-indigo-600",
  bgClass = "bg-slate-200"
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center h-12">
      <div className="flex items-center gap-1.5">
        <label className={`font-medium text-xs sm:text-sm ${colorClass.includes('rose') ? 'text-rose-600' : 'text-slate-600'}`}>{label}</label>
        <div className="group relative flex items-center">
            <Info size={14} className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-relaxed font-normal">
            {description}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
        </div>
      </div>
      <span className={`text-xs sm:text-sm ${colorClass.includes('rose') ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>{displayValue}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${bgClass} ${colorClass}`}
    />
  </div>
);

const SimulationControls: React.FC<Props> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  onRestart,
  params,
  setParams,
  tickCount,
  totalStress,
  batchStatus
}) => {
  const handleChange = (key: Exclude<keyof SimulationParams, 'constraintMode'>, value: number) => {
    setParams({ ...params, [key]: value });
  };

  const isFinished = !isPlaying && totalStress <= 1 && tickCount > 0;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          {isFinished ? (
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm"
            >
              <RefreshCw size={18} /> Restart
            </button>
          ) : (
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play</>}
            </button>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>
        <div className="flex items-center gap-6 text-sm">
          {batchStatus && (
            <div className="flex items-center gap-2 hidden sm:flex animate-in fade-in">
                <Repeat size={16} className="text-indigo-500" />
                <span className="text-slate-400">Batch:</span>
                <span className="font-mono font-bold text-indigo-600">{batchStatus.current} / {batchStatus.total}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tick:</span>
            <span className="font-mono font-bold text-slate-700">{tickCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-rose-500" />
            <span className="text-slate-400">Stress:</span>
            <span className="font-mono font-bold text-rose-600">{Math.round(totalStress)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
        
        {/* System Parameters */}
        <SliderControl
          label="Infection Rate"
          value={params.infectionRate}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleChange('infectionRate', v)}
          displayValue={`${(params.infectionRate * 100).toFixed(0)}%`}
          description="Percentage of stress transferred to neighboring agents. High infection causes chain reactions of panic."
        />

        <SliderControl
          label="Sim Speed (ms)"
          value={params.simulationSpeed}
          min={10}
          max={1000}
          step={10}
          onChange={(v) => handleChange('simulationSpeed', v)}
          displayValue={`${params.simulationSpeed}ms`}
          description="Time duration of each simulation tick. Lower values make the simulation run faster."
        />

        <SliderControl
          label="Stress Threshold"
          value={params.stressThreshold}
          min={0}
          max={20}
          step={1}
          onChange={(v) => handleChange('stressThreshold', v)}
          displayValue={params.stressThreshold.toString()}
          description="The base stress level an agent tolerates before attempting to move."
        />

        {/* New Advanced Behavior Sliders */}
        <SliderControl
          label="Panic Randomness"
          value={params.randomnessFactor}
          min={0}
          max={10}
          step={0.5}
          onChange={(v) => handleChange('randomnessFactor', v)}
          displayValue={`${params.randomnessFactor.toFixed(1)}x`}
          colorClass="accent-purple-500"
          description="Adds random noise to decision making when an agent stays stressed. Helps agents break out of infinite loops."
        />

        <SliderControl
          label="Desperation (Decay)"
          value={params.thresholdDecay}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => handleChange('thresholdDecay', v)}
          displayValue={`${params.thresholdDecay.toFixed(1)}/tick`}
          colorClass="accent-purple-500"
          description="How quickly the movement threshold drops when stressed. High decay forces agents to move to suboptimal spots to escape stress."
        />

        <SliderControl
          label="Crowding Penalty"
          value={params.crowdingPenalty}
          min={0}
          max={50}
          step={1}
          onChange={(v) => handleChange('crowdingPenalty', v)}
          displayValue={params.crowdingPenalty.toString()}
          colorClass="accent-rose-500"
          bgClass="bg-rose-100"
          description="Stress added per extra agent in the same cell. Keep low to allow agents to pass through each other."
        />

        {/* Religion/Rule Penalties */}
        <div className="col-span-full border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Religion Penalties (Stress Rules)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SliderControl
                  label="Row Penalty"
                  value={params.rowPenalty}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => handleChange('rowPenalty', v)}
                  displayValue={params.rowPenalty.toString()}
                  description="Stress penalty applied if another agent with the same number is in the same row."
                />

                <SliderControl
                  label="Column Penalty"
                  value={params.colPenalty}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => handleChange('colPenalty', v)}
                  displayValue={params.colPenalty.toString()}
                  description="Stress penalty applied if another agent with the same number is in the same column."
                />

                <SliderControl
                  label="Box Penalty"
                  value={params.boxPenalty}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => handleChange('boxPenalty', v)}
                  displayValue={params.boxPenalty.toString()}
                  description="Stress penalty applied if another agent with the same number is in the same 3x3 box."
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationControls;