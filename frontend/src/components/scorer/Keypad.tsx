import React from 'react';

interface KeypadProps {
  onScoreRuns: (runs: number) => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ onScoreRuns, disabled = false }) => {
  const buttons = [
    { label: '0', sub: 'DOT', runs: 0, bg: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700' },
    { label: '1', sub: 'SINGLE', runs: 1, bg: 'bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border-sky-800/50' },
    { label: '2', sub: 'DOUBLE', runs: 2, bg: 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-800/50' },
    { label: '3', sub: 'THREE', runs: 3, bg: 'bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border-teal-800/50' },
    { label: '4', sub: 'FOUR', runs: 4, bg: 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/60 shadow-lg shadow-emerald-900/20' },
    { label: '6', sub: 'SIX', runs: 6, bg: 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border-purple-600/60 shadow-lg shadow-purple-900/20' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {buttons.map((btn) => (
        <button
          key={btn.runs}
          disabled={disabled}
          onClick={() => onScoreRuns(btn.runs)}
          className={`keypad-btn py-4 sm:py-5 px-3 ${btn.bg} active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
            {btn.label}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase opacity-80 mt-0.5">
            {btn.sub}
          </span>
        </button>
      ))}
    </div>
  );
};
