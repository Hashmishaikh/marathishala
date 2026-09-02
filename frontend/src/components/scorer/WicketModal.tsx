import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Player, Match } from '../../types';
import { getId, getTeamBattingAndBowling } from '../../utils/helpers';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onConfirmWicket: (wicketPayload: any) => void;
}

const DISMISSAL_TYPES = [
  'Bowled',
  'Caught',
  'Caught Behind',
  'Caught & Bowled',
  'LBW',
  'Stumped',
  'Run Out',
  'Hit Wicket',
  'Retired'
] as const;

export const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  onClose,
  match,
  onConfirmWicket
}) => {
  const currentInnings = match.innings.find(i => i.inningsNumber === match.currentInningsNumber);
  const { fieldingSquad: fieldingPlayers } = getTeamBattingAndBowling(match);

  const striker = typeof currentInnings?.striker === 'object' ? currentInnings.striker as Player : null;
  const nonStriker = typeof currentInnings?.nonStriker === 'object' ? currentInnings.nonStriker as Player : null;
  const bowler = typeof currentInnings?.currentBowler === 'object' ? currentInnings.currentBowler as Player : null;

  const [dismissalType, setDismissalType] = useState<typeof DISMISSAL_TYPES[number]>('Bowled');
  const [playerOutId, setPlayerOutId] = useState<string>('');
  const [primaryFielderId, setPrimaryFielderId] = useState<string>('');
  const [assistedById, setAssistedById] = useState<string>('');
  const [runsCompleted, setRunsCompleted] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setPlayerOutId(getId(currentInnings?.striker));
      setDismissalType('Bowled');
      setPrimaryFielderId('');
      setAssistedById('');
      setRunsCompleted(0);
    }
  }, [isOpen, currentInnings?.striker]);

  const needsFielder = ['Caught', 'Caught Behind', 'Stumped', 'Run Out'].includes(dismissalType);
  const needsAssistantFielder = dismissalType === 'Run Out';
  const bowlerGetsCredit = !['Run Out', 'Retired'].includes(dismissalType);

  const handleConfirm = () => {
    const finalPlayerOut = playerOutId || getId(currentInnings?.striker);

    onConfirmWicket({
      runsOffBat: runsCompleted,
      extraType: 'None',
      runningExtraRuns: 0,
      isWicket: true,
      wicket: {
        dismissalType,
        playerOut: finalPlayerOut,
        bowlerCredit: bowlerGetsCredit,
        primaryFielder: (needsFielder && primaryFielderId) ? primaryFielderId : null,
        assistedBy: (needsAssistantFielder && assistedById) ? assistedById : null
      }
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚨 Record Wicket & Dismissal"
      subtitle={`Innings #${match.currentInningsNumber} • Total Wickets: ${currentInnings?.wickets || 0}/${currentInnings?.maxWicketsForInnings || 10}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-slate-200">
        
        {/* Dismissal Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Dismissal Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DISMISSAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setDismissalType(type);
                  if (type === 'Caught & Bowled' && bowler) {
                    setPrimaryFielderId(getId(bowler));
                  }
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  dismissalType === type
                    ? 'bg-rose-600/30 text-rose-200 border-rose-500 shadow-md shadow-rose-950/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Who is Out? */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Dismissed Batsman
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlayerOutId(getId(currentInnings?.striker))}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                (!playerOutId || playerOutId === getId(currentInnings?.striker))
                  ? 'bg-sky-600/20 text-sky-200 border-sky-500'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-sky-400 block">Striker</span>
                <span className="font-bold text-sm text-white">{striker?.name || 'Current Striker'}</span>
              </div>
              <span className="text-lg">🏏</span>
            </button>

            <button
              type="button"
              onClick={() => setPlayerOutId(getId(currentInnings?.nonStriker))}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                playerOutId === getId(currentInnings?.nonStriker)
                  ? 'bg-sky-600/20 text-sky-200 border-sky-500'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Non-Striker</span>
                <span className="font-bold text-sm text-white">{nonStriker?.name || 'Non-Striker'}</span>
              </div>
              <span className="text-lg">🏃</span>
            </button>
          </div>
        </div>

        {/* Primary Fielder (if applicable) */}
        {needsFielder && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {dismissalType === 'Caught Behind' || dismissalType === 'Stumped' ? 'Wicket-Keeper / Catcher' : 'Primary Fielder / Catcher'}
            </label>
            <select
              value={primaryFielderId}
              onChange={(e) => setPrimaryFielderId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">Select Fielder...</option>
              {fieldingPlayers.map((p) => (
                <option key={getId(p)} value={getId(p)}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assistant Fielder for Run Out */}
        {needsAssistantFielder && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Assisted By (Optional Thrower / Relay)
            </label>
            <select
              value={assistedById}
              onChange={(e) => setAssistedById(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">Select Assistant Fielder (Optional)...</option>
              {fieldingPlayers.map((p) => (
                <option key={getId(p)} value={getId(p)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Runs Completed before dismissal */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Runs Completed on Ball
          </label>
          <div className="flex space-x-2">
            {[0, 1, 2, 3].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunsCompleted(r)}
                className={`flex-1 py-2 rounded-lg font-mono font-bold text-sm border transition-all ${
                  runsCompleted === r
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {r} Runs
              </button>
            ))}
          </div>
        </div>

        {/* Bowler Credit Indicator */}
        <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Bowler Credit:</span>
          <span className={`font-bold ${bowlerGetsCredit ? 'text-emerald-400' : 'text-slate-400'}`}>
            {bowlerGetsCredit ? `✅ Yes (${bowler?.name || 'Bowler'} gets wicket)` : '❌ No (Run Out / Retired)'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-950/60 transition-all"
          >
            Confirm Dismissal
          </button>
        </div>

      </div>
    </Modal>
  );
};
