import React, { useState } from 'react';
import { Modal } from '../common/Modal';

import type { Match, CustomRules } from '../../types';

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSaveRules: (updatedRules: CustomRules, totalOvers?: number) => void;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({
  isOpen,
  onClose,
  match,
  onSaveRules
}) => {
  const [totalOvers, setTotalOvers] = useState<number>(match.totalOvers || 8);
  const [rules, setRules] = useState<CustomRules>({
    widePenaltyRuns: match.customRules?.widePenaltyRuns ?? 1,
    noBallPenaltyRuns: match.customRules?.noBallPenaltyRuns ?? 1,
    allOutThresholdType: match.customRules?.allOutThresholdType ?? 'AllPlayersOut',
    allowDoubleBatting: match.customRules?.allowDoubleBatting ?? true,
    oppositeHandRule: match.customRules?.oppositeHandRule ?? true,
    lastManStandsAlone: match.customRules?.lastManStandsAlone ?? true,
  });

  const handleSave = () => {
    onSaveRules(rules, totalOvers);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚙️ MSCA Match Overs & Gully Rules"
      subtitle="Customize match overs per innings, penalty extras, and all-out thresholds"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-slate-200">
        
        {/* Total Overs Customization */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-sky-400">
              Match Overs Per Innings
            </label>
            <span className="text-xs font-mono font-bold text-white bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30">
              {totalOvers} Overs
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="50"
              value={totalOvers}
              onChange={(e) => setTotalOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-sky-400"
            />
            <div className="flex flex-wrap gap-1 flex-1">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((ov) => (
                <button
                  key={ov}
                  type="button"
                  onClick={() => setTotalOvers(ov)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    totalOvers === ov
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {ov} Ov
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Wide Penalty Runs */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
            Wide Penalty Runs
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRules({ ...rules, widePenaltyRuns: val })}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  rules.widePenaltyRuns === val
                    ? 'bg-amber-600/30 text-amber-200 border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {val === 0 ? '+0 (Re-bowl only)' : val === 1 ? '+1 (Standard)' : '+2 Runs'}
              </button>
            ))}
          </div>
        </div>

        {/* No-Ball Penalty Runs */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-yellow-400">
            No-Ball Penalty Runs
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRules({ ...rules, noBallPenaltyRuns: val })}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  rules.noBallPenaltyRuns === val
                    ? 'bg-yellow-600/30 text-yellow-200 border-yellow-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {val === 0 ? '+0 (Free Hit/Ball)' : val === 1 ? '+1 (Standard)' : '+2 Runs'}
              </button>
            ))}
          </div>
        </div>

        {/* All-Out Threshold Mode */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-sky-400">
            All-Out Threshold Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRules({ ...rules, allOutThresholdType: 'AllPlayersOut' })}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                rules.allOutThresholdType === 'AllPlayersOut'
                  ? 'bg-sky-600/30 text-sky-200 border-sky-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <span className="font-bold text-xs block text-white">True Total All-Out</span>
              <span className="text-[10px] opacity-75">All 5 or 6 players must be out</span>
            </button>

            <button
              type="button"
              onClick={() => setRules({ ...rules, allOutThresholdType: 'StandardPartnership' })}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                rules.allOutThresholdType === 'StandardPartnership'
                  ? 'bg-sky-600/30 text-sky-200 border-sky-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <span className="font-bold text-xs block text-white">Standard (N-1)</span>
              <span className="text-[10px] opacity-75">Ends when last partnership falls</span>
            </button>
          </div>
        </div>

        {/* Toggles for Gully Special Rules */}
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white block">Allow Double-Batting (Uneven Squads)</span>
              <span className="text-[11px] text-slate-400">Unlock a second turn for dismissed player in smaller squad</span>
            </div>
            <input
              type="checkbox"
              checked={rules.allowDoubleBatting}
              onChange={(e) => setRules({ ...rules, allowDoubleBatting: e.target.checked })}
              className="rounded border-sky-500 text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-900"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white block">Opposite Hand Mandate</span>
              <span className="text-[11px] text-slate-400">Double-batting batsman must switch stance (RHB $\rightarrow$ LHB)</span>
            </div>
            <input
              type="checkbox"
              checked={rules.oppositeHandRule}
              onChange={(e) => setRules({ ...rules, oppositeHandRule: e.target.checked })}
              className="rounded border-purple-500 text-purple-500 focus:ring-purple-500 w-4 h-4 bg-slate-900"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white block">Last Man Stands Alone</span>
              <span className="text-[11px] text-slate-400">Final remaining batsman bats without a non-striker</span>
            </div>
            <input
              type="checkbox"
              checked={rules.lastManStandsAlone}
              onChange={(e) => setRules({ ...rules, lastManStandsAlone: e.target.checked })}
              className="rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-900"
            />
          </label>
        </div>

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
            Save Rules
          </button>
        </div>

      </div>
    </Modal>
  );
};
