import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles, UserCheck } from 'lucide-react';
import type { Match } from '../../types';
import { getId, getTeamBattingAndBowling } from '../../utils/helpers';

interface BatsmanPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  position: 'striker' | 'nonStriker';
  onSelectBatsman: (payload: { playerId: string; position: 'striker' | 'nonStriker'; isOppositeHand: boolean; inningsAttempt: number }) => void;
}

export const BatsmanPickerModal: React.FC<BatsmanPickerModalProps> = ({
  isOpen,
  onClose,
  match,
  position,
  onSelectBatsman
}) => {
  const currentInnings = match.innings.find(i => i.inningsNumber === match.currentInningsNumber);
  const { battingSquad } = getTeamBattingAndBowling(match);

  const activeStrikerId = getId(currentInnings?.striker);
  const activeNonStrikerId = getId(currentInnings?.nonStriker);

  const partnerId = position === 'striker' ? activeNonStrikerId : activeStrikerId;
  const currentPositionPlayerId = position === 'striker' ? activeStrikerId : activeNonStrikerId;

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [isOppositeHand, setIsOppositeHand] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerId(currentPositionPlayerId || '');
      setIsOppositeHand(false);
    }
  }, [isOpen, currentPositionPlayerId]);

  const batsmanStats = currentInnings?.batsmenStats || [];

  const handleConfirm = () => {
    if (!selectedPlayerId) return;

    // Check how many times player already batted in this innings
    const timesBatted = batsmanStats.filter(b => {
      const pId = getId(b.player);
      return pId === selectedPlayerId;
    }).length;

    onSelectBatsman({
      playerId: selectedPlayerId,
      position,
      isOppositeHand,
      inningsAttempt: timesBatted + 1
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Select ${position === 'striker' ? 'Striker (*)' : 'Non-Striker'}`}
      subtitle={`Choose batter from ${getTeamBattingAndBowling(match).battingTeam?.name || 'Batting Squad'}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-slate-200">
        
        {/* Player List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {battingSquad.map((player) => {
            const pId = getId(player);
            const isPartnerAtOtherEnd = partnerId && pId === partnerId;
            const isCurrentAtThisPosition = currentPositionPlayerId && pId === currentPositionPlayerId;

            const existingEntries = batsmanStats.filter(b => getId(b.player) === pId);
            const isDismissed = existingEntries.some(b => b.isOut);
            const isSelected = selectedPlayerId === pId;

            const allowSelection = !isPartnerAtOtherEnd && (!isDismissed || match.customRules?.allowDoubleBatting);

            return (
              <div
                key={pId}
                onClick={() => {
                  if (!allowSelection) return;
                  setSelectedPlayerId(pId);
                  if (isDismissed && match.customRules?.oppositeHandRule) {
                    setIsOppositeHand(true);
                  } else {
                    setIsOppositeHand(false);
                  }
                }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  !allowSelection
                    ? 'opacity-40 bg-slate-900 border-white/5 cursor-not-allowed'
                    : isSelected
                    ? 'bg-sky-600/30 border-sky-400 shadow-md shadow-sky-950/50 cursor-pointer'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-sky-400">
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{player.name}</span>
                      {isDismissed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          OUT ({existingEntries[0]?.runs}r)
                        </span>
                      )}
                      {isPartnerAtOtherEnd && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          AT OTHER END
                        </span>
                      )}
                      {isCurrentAtThisPosition && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {player.role} • {player.battingStyle}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <UserCheck className="w-5 h-5 text-sky-400 animate-in zoom-in" />
                )}
              </div>
            );
          })}
        </div>

        {/* Double Batting & Opposite Hand Feature Alert */}
        {selectedPlayerId && (() => {
          const selectedPlayer = battingSquad.find(p => getId(p) === selectedPlayerId);
          const wasDismissed = batsmanStats.some(b => getId(b.player) === selectedPlayerId && b.isOut);

          if (!wasDismissed) return null;

          return (
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-200">MSCA Double-Batting Rule</h4>
                  <p className="text-xs text-purple-300/80">
                    {selectedPlayer?.name} was previously dismissed. Under MSCA Gully Rules, this player unlocks a second batting turn with the opposite hand.
                  </p>
                </div>
              </div>

              <label className="flex items-center space-x-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOppositeHand}
                  onChange={(e) => setIsOppositeHand(e.target.checked)}
                  className="rounded border-purple-500 text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-xs font-bold text-purple-200">
                  Must Bat Opposite Hand ({selectedPlayer?.battingStyle === 'Right-hand' ? 'Switch to Left-Hand' : 'Switch to Right-Hand'})
                </span>
              </label>
            </div>
          );
        })()}

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
            disabled={!selectedPlayerId}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 transition-all"
          >
            Confirm Batsman
          </button>
        </div>

      </div>
    </Modal>
  );
};
