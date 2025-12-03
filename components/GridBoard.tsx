import React, { useMemo } from 'react';
import { Agent } from '../types';

interface Props {
  agents: Agent[];
  isSetupMode?: boolean;
  onCellDrop?: (r: number, c: number, val: number) => void;
  onCellClick?: (r: number, c: number) => void;
  animationSpeed?: number;
}

const GridBoard: React.FC<Props> = ({ 
  agents, 
  isSetupMode = false, 
  onCellDrop, 
  onCellClick,
  animationSpeed = 200 // Default fallback match to default sim speed
}) => {
  
  // Prepare background grid cells (static)
  const gridCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const isThickRight = (c + 1) % 3 === 0 && c !== 8;
        const isThickBottom = (r + 1) % 3 === 0 && r !== 8;
        cells.push(
          <div
            key={`cell-${r}-${c}`}
            onDragOver={(e) => {
              if (isSetupMode) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }
            }}
            onDrop={(e) => {
              if (isSetupMode && onCellDrop) {
                e.preventDefault();
                const data = e.dataTransfer.getData("text/plain");
                const val = parseInt(data, 10);
                if (!isNaN(val) && val >= 1 && val <= 9) {
                  onCellDrop(r, c, val);
                }
              }
            }}
            onClick={() => isSetupMode && onCellClick && onCellClick(r, c)}
            className={`
              relative w-full h-full bg-white
              ${isThickRight ? 'border-r-2 border-r-black' : 'border-r border-slate-200'}
              ${isThickBottom ? 'border-b-2 border-b-black' : 'border-b border-slate-200'}
              ${isSetupMode ? 'cursor-pointer hover:bg-slate-50' : ''}
              flex items-center justify-center
            `}
          />
        );
      }
    }
    return cells;
  }, [isSetupMode, onCellDrop, onCellClick]);

  return (
    <div className="relative p-1 bg-black rounded-sm shadow-2xl inline-block select-none border-2 border-black">
      {/* 1. Background Grid Layer */}
      <div className="grid grid-cols-9 w-[360px] h-[360px] sm:w-[450px] sm:h-[450px] bg-slate-900 border-l border-t border-slate-200">
        {gridCells}
      </div>

      {/* 2. Agent Layer (Absolute Positioned) */}
      <div className="absolute top-1 left-1 right-1 bottom-1 pointer-events-none overflow-hidden">
        {agents.map((agent) => {
          // Calculate percentages for position
          const topPct = (agent.pos.r / 9) * 100;
          const leftPct = (agent.pos.c / 9) * 100;
          
          const isStressed = agent.stress > 5;
          const colorStyle = isStressed ? '#dc2626' : 'black';
          
          // Check for stacking to add slight offset if multiple agents in same cell
          // We can't easily check all agents in this map efficiently without pre-processing, 
          // so we'll use a deterministic random offset based on ID for stacked look if they collide
          // Note: Ideally, we'd pre-process collision, but with CSS transitions, simple ID-based jitter is usually enough to see overlap
          
          return (
             <div
                key={agent.id}
                className={`
                   absolute flex items-center justify-center
                   w-[11.11%] h-[11.11%]
                   ${agent.isFixed ? 'z-10' : 'z-20'}
                   transition-all ease-in-out
                `}
                style={{
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  transitionDuration: `${animationSpeed}ms`, 
                }}
             >
                <div 
                  className={`
                    flex items-center justify-center
                    ${agent.isFixed ? 'font-black text-2xl' : 'text-xl font-medium'}
                  `}
                  style={{
                     color: agent.isFixed ? 'black' : colorStyle,
                     textShadow: isStressed ? '0 0 2px rgba(220,38,38,0.3)' : 'none',
                     // Add simple visual jitter if not fixed to imply swarming/vibration when stressed
                     transform: isStressed && !agent.isFixed ? `translate(${Math.random()*2 - 1}px, ${Math.random()*2 - 1}px)` : 'none'
                  }}
                >
                   {agent.val}
                </div>
             </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridBoard;