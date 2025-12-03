import React from 'react';
import { X, BrainCircuit, Activity, Users, ShieldAlert, Move } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">About Sudoku Agent Swarm</h2>
              <p className="text-xs text-slate-500 font-medium">Visualization of Emergent Behavior</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-slate-600">
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900">
            <p className="font-semibold mb-1">Created by Per Nystedt using Google AI Studio</p>
            <p className="opacity-80">A demonstration of how simple local rules can lead to complex global solutions.</p>
          </div>

          <section>
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
              <Users className="text-emerald-500" size={20} />
              The Agents
            </h3>
            <p className="leading-relaxed">
              In this simulation, every number on the board is an autonomous agent. There is no central computer solving the Sudoku puzzle. Instead, each number (1-9) has its own agency and makes its own decisions based on what it sees in its immediate environment.
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
              <ShieldAlert className="text-amber-500" size={20} />
              Religions (The Rules)
            </h3>
            <p className="leading-relaxed mb-3">
              Every agent follows a set of strict "Religions" (Rules). If an agent violates a religion, it feels <strong>Stress</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Row, Column, & Box Religion:</strong> "Thou shalt be the only one of thy kind in this row/column/box."</li>
              <li><strong>Superreligion (Crowding):</strong> "Thou shalt not occupy the same space as another." (This rule can be bent with high crowding tolerance, allowing agents to pass through each other).</li>
            </ul>
          </section>

          <section>
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
              <Activity className="text-rose-500" size={20} />
              Stress, Infection & Panic
            </h3>
            <p className="leading-relaxed mb-3">
              Stress is the driving force of the system.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Accumulation:</strong> If an agent breaks a rule, its stress rises. If it stays stressed, stress accumulates over time.</li>
              <li><strong>Infection:</strong> A highly stressed agent "infects" its neighbors, causing them to become agitated and potentially move, even if they were happy. This creates chain reactions that can unclog deadlock.</li>
              <li><strong>Desperation:</strong> As time passes without relief, an agent's threshold for movement drops. It becomes willing to move to suboptimal positions just to escape its current spot.</li>
              <li><strong>Panic (Randomness):</strong> If stress persists, the agent starts moving erratically (Randomness Factor), helping it jump out of local minima loops.</li>
            </ul>
          </section>

          <section>
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-lg">
              <Move className="text-indigo-500" size={20} />
              Senses
            </h3>
            <p className="leading-relaxed">
              Agents can "sense" the entire row, column, and 3x3 box they currently reside in. They calculate which potential move would result in the lowest immediate stress (Local Optimization). They cannot see the future or the entire board state at once.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AboutModal;