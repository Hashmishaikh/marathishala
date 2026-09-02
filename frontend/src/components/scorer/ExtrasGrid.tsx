import React, { useState } from 'react';
import { Undo2, ArrowLeftRight, Flame } from 'lucide-react';

interface ExtrasGridProps {
  onScoreExtra: (extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye', runningRuns?: number, runsOffBat?: number) => void;
  onOpenWicketModal: () => void;
  onUndo: () => void;
  onSwapStrike: () => void;
  disabled?: boolean;
}

export const ExtrasGrid: React.FC<ExtrasGridProps> = ({
  onScoreExtra,
  onOpenWicketModal,
  onUndo,
  onSwapStrike,
  disabled = false
}) => {
  const [activeExtraModal, setActiveExtraModal] = useState<'Wide' | 'NoBall' | 'Bye' | 'LegBye' | null>(null);

  const handleExtraClick = (type: 'Wide' | 'NoBall' | 'Bye' | 'LegBye') => {
    setActiveExtraModal(type);
  };

  const handleSelectRuns = (runs: number) => {
    if (!activeExtraModal) return;
    if (activeExtraModal === 'Wide') {
      onScoreExtra('Wide', runs);
    } else if (activeExtraModal === 'NoBall') {
      // For NoBall, runs could be runs off bat
      onScoreExtra('NoBall', 0, runs);
    } else if (activeExtraModal === 'Bye') {
      onScoreExtra('Bye', runs);
    } else if (activeExtraModal === 'LegBye') {
      onScoreExtra('LegBye', runs);
    }
    setActiveExtraModal(null);
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      {/* Extras Row */}
      <div className="grid grid-cols-4 gap-2">
        <button
          disabled={disabled}
          onClick={() => handleExtraClick('Wide')}
          className="keypad-btn py-3 px-2 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-700/50 text-xs sm:text-sm font-bold disabled:opacity-40"
        >
          <span className="font-mono text-base sm:text-lg font-black">WD</span>
          <span className="text-[10px] opacity-75">WIDE</span>
        </button>

        <button
          disabled={disabled}
          onClick={() => handleExtraClick('NoBall')}
          className="keypad-btn py-3 px-2 bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 border-yellow-700/50 text-xs sm:text-sm font-bold disabled:opacity-40"
        >
          <span className="font-mono text-base sm:text-lg font-black">NB</span>
          <span className="text-[10px] opacity-75">NO BALL</span>
        </button>

        <button
          disabled={disabled}
          onClick={() => handleExtraClick('Bye')}
          className="keypad-btn py-3 px-2 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border-blue-700/50 text-xs sm:text-sm font-bold disabled:opacity-40"
        >
          <span className="font-mono text-base sm:text-lg font-black">B</span>
          <span className="text-[10px] opacity-75">BYE</span>
        </button>

        <button
          disabled={disabled}
          onClick={() => handleExtraClick('LegBye')}
          className="keypad-btn py-3 px-2 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border-indigo-700/50 text-xs sm:text-sm font-bold disabled:opacity-40"
        >
          <span className="font-mono text-base sm:text-lg font-black">LB</span>
          <span className="text-[10px] opacity-75">LEG BYE</span>
        </button>
      </div>

      {/* High-Action Controls Row: WICKET (Big Crimson Button) + UNDO + SWAP STRIKE */}
      <div className="grid grid-cols-4 gap-2">
        <button
          disabled={disabled}
          onClick={onOpenWicketModal}
          className="col-span-2 keypad-btn py-3.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black border-red-500 shadow-lg shadow-red-950/50 disabled:opacity-40 flex-row space-x-2"
        >
          <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
          <span className="text-base sm:text-lg tracking-wider">WICKET!</span>
        </button>

        <button
          disabled={disabled}
          onClick={onSwapStrike}
          title="Swap batsman on strike"
          className="keypad-btn py-3 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 disabled:opacity-40"
        >
          <ArrowLeftRight className="w-4 h-4 mb-0.5 text-sky-400" />
          <span className="text-[10px] font-bold">SWAP STRIKE</span>
        </button>

        <button
          disabled={disabled}
          onClick={onUndo}
          title="Undo last ball"
          className="keypad-btn py-3 px-2 bg-slate-800 hover:bg-rose-950/80 text-rose-300 border-slate-700 hover:border-rose-700 disabled:opacity-40"
        >
          <Undo2 className="w-4 h-4 mb-0.5 text-rose-400" />
          <span className="text-[10px] font-bold">UNDO</span>
        </button>
      </div>

      {/* Extra Runs Quick Selector Modal/Overlay */}
      {activeExtraModal && (
        <div className="p-3 bg-slate-900/95 border border-white/15 rounded-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
            <span className="text-xs font-bold text-amber-300">
              {activeExtraModal === 'Wide' && 'Wide Delivery + Additional Runs Run'}
              {activeExtraModal === 'NoBall' && 'No-Ball Delivery + Runs Off Bat'}
              {activeExtraModal === 'Bye' && 'Byes Conceded'}
              {activeExtraModal === 'LegBye' && 'Leg-Byes Conceded'}
            </span>
            <button
              onClick={() => setActiveExtraModal(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
            >
              ✕ Cancel
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                onClick={() => handleSelectRuns(r)}
                className="py-2.5 rounded-lg font-mono font-bold text-sm bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-200 border border-slate-700 transition-colors"
              >
                +{r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
