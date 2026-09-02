import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Delivery, Match } from '../../types';

interface EditBallDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  match: Match;
  onSaveEdit: (deliveryId: string, payload: Partial<Delivery>) => void;
}

export const EditBallDrawer: React.FC<EditBallDrawerProps> = ({
  isOpen,
  onClose,
  delivery,
  onSaveEdit
}) => {
  const [runsOffBat, setRunsOffBat] = useState<number>(0);
  const [extraType, setExtraType] = useState<'None' | 'Wide' | 'NoBall' | 'Bye' | 'LegBye'>('None');
  const [penaltyExtraRuns, setPenaltyExtraRuns] = useState<number>(0);
  const [runningExtraRuns, setRunningExtraRuns] = useState<number>(0);
  const [isWicket, setIsWicket] = useState<boolean>(false);

  useEffect(() => {
    if (delivery) {
      setRunsOffBat(delivery.runsOffBat || 0);
      setExtraType(delivery.extraType || 'None');
      setPenaltyExtraRuns(delivery.penaltyExtraRuns || 0);
      setRunningExtraRuns(delivery.runningExtraRuns || 0);
      setIsWicket(delivery.isWicket || false);
    }
  }, [delivery]);

  if (!delivery) return null;

  const handleSave = () => {
    onSaveEdit(delivery._id, {
      runsOffBat,
      extraType,
      penaltyExtraRuns,
      runningExtraRuns,
      isWicket
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`✏️ Edit Ball: Over ${delivery.overNumber}.${delivery.ballNumber}`}
      subtitle="Replays entire innings deterministically with historical update"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-slate-200">
        
        {/* Runs off Bat */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Runs Off Bat
          </label>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunsOffBat(r)}
                className={`py-2 rounded-xl font-mono font-bold text-sm border transition-all ${
                  runsOffBat === r
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Extra Type */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Delivery Extra Type
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {(['None', 'Wide', 'NoBall', 'Bye', 'LegBye'] as const).map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => {
                  setExtraType(ext);
                  if (ext === 'Wide' || ext === 'NoBall') {
                    setPenaltyExtraRuns(1);
                  } else {
                    setPenaltyExtraRuns(0);
                  }
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all truncate ${
                  extraType === ext
                    ? 'bg-amber-600/30 text-amber-200 border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {ext}
              </button>
            ))}
          </div>
        </div>

        {/* Penalty & Running Extra Runs (if applicable) */}
        {extraType !== 'None' && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/40 border border-white/5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Penalty Runs
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={penaltyExtraRuns}
                onChange={(e) => setPenaltyExtraRuns(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Running Extra Runs
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={runningExtraRuns}
                onChange={(e) => setRunningExtraRuns(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
        )}

        {/* Wicket Flag */}
        <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isWicket}
            onChange={(e) => setIsWicket(e.target.checked)}
            className="rounded border-rose-500 text-rose-600 focus:ring-rose-500 w-4 h-4 bg-slate-900"
          />
          <span className="text-sm font-bold text-rose-300">
            Wicket occurred on this ball
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all"
          >
            Save & Replay
          </button>
        </div>

      </div>
    </Modal>
  );
};
