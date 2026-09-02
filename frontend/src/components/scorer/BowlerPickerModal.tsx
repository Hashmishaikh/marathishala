import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { UserCheck, ShieldAlert } from 'lucide-react';
import type { Match } from '../../types';
import { getId, getTeamBattingAndBowling } from '../../utils/helpers';

interface BowlerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSelectBowler: (bowlerId: string) => void;
  lastBowlerId?: string;
  title?: string;
}

export const BowlerPickerModal: React.FC<BowlerPickerModalProps> = ({
  isOpen,
  onClose,
  match,
  onSelectBowler,
  lastBowlerId,
  title
}) => {
  const currentInnings = match.innings.find(i => i.inningsNumber === match.currentInningsNumber);
  const { fieldingSquad, bowlingTeam } = getTeamBattingAndBowling(match);

  const activeBowlerId = getId(currentInnings?.currentBowler);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (activeBowlerId) {
        setSelectedBowlerId(activeBowlerId);
      } else {
        setSelectedBowlerId('');
      }
    }
  }, [isOpen, activeBowlerId]);

  const bowlerStats = currentInnings?.bowlerStats || [];

  const handleConfirm = () => {
    if (!selectedBowlerId) return;
    onSelectBowler(selectedBowlerId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Select Active Bowler"}
      subtitle={`Choose bowler from ${bowlingTeam?.name || 'Fielding Squad'} for the upcoming over`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-slate-200">
        
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {fieldingSquad.map((player) => {
            const pId = getId(player);
            const stat = bowlerStats.find(bw => getId(bw.player) === pId);

            const isSelected = selectedBowlerId === pId;
            const isCurrent = activeBowlerId && pId === activeBowlerId;
            const isLastOverBowler = lastBowlerId && pId === lastBowlerId;

            // In standard cricket, same bowler cannot bowl consecutive overs if squad > 1
            const isConsecutiveRestricted = isLastOverBowler && fieldingSquad.length > 1;

            return (
              <div
                key={pId}
                onClick={() => {
                  if (isConsecutiveRestricted) return;
                  setSelectedBowlerId(pId);
                }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isConsecutiveRestricted
                    ? 'opacity-40 bg-slate-900 border-white/5 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 shadow-md shadow-indigo-950/50 cursor-pointer'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400">
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{player.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          ACTIVE
                        </span>
                      )}
                      {isLastOverBowler && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>BOWLED LAST OVER</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isConsecutiveRestricted ? 'Cannot bowl consecutive overs' : (player.bowlingStyle || 'Bowler')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {stat && (
                    <div className="text-right font-mono text-xs">
                      <span className="text-white font-bold">{stat.wickets}/{stat.runsConceded}</span>
                      <span className="text-slate-400 ml-1.5">({stat.overs} ov)</span>
                    </div>
                  )}
                  {isSelected && (
                    <UserCheck className="w-5 h-5 text-indigo-400 animate-in zoom-in" />
                  )}
                </div>
              </div>
            );
          })}
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
            disabled={!selectedBowlerId}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all"
          >
            Confirm Bowler
          </button>
        </div>

      </div>
    </Modal>
  );
};
