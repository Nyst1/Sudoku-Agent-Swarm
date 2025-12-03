import React from 'react';

const NumberPalette: React.FC = () => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleDragStart = (e: React.DragEvent, num: number) => {
    e.dataTransfer.setData("text/plain", num.toString());
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      <p className="w-full text-center text-sm text-slate-500 mb-2 font-medium uppercase tracking-wide">
        Drag numbers to board
      </p>
      {numbers.map((num) => (
        <div
          key={num}
          draggable
          onDragStart={(e) => handleDragStart(e, num)}
          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white border-2 border-slate-200 rounded-lg text-xl font-bold text-slate-700 shadow-sm hover:border-indigo-500 hover:text-indigo-600 hover:scale-110 cursor-grab active:cursor-grabbing transition-all"
        >
          {num}
        </div>
      ))}
    </div>
  );
};

export default NumberPalette;