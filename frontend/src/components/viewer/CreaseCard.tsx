import React from 'react';
import { Sparkles, UserPlus } from 'lucide-react';
import type { Match, Player } from '../../types';
import { getId } from '../../utils/helpers';

interface CreaseCardProps {
  match: Match;
  isScorerMode?: boolean;
  onSelectStriker?: () => void;
  onSelectNonStriker?: () => void;
  onSelectBowler?: () => void;
}

export const CreaseCard: React.FC<CreaseCardProps> = ({
  match,
  isScorerMode = false,
  onSelectStriker,
  onSelectNonStriker,
  onSelectBowler
}) => {
  const currentInnings = match.innings.find(i => i.inningsNumber === match.currentInningsNumber);
  
  const striker = typeof currentInnings?.striker === 'object' ? currentInnings.striker as Player : null;
  const nonStriker = typeof currentInnings?.nonStriker === 'object' ? currentInnings.nonStriker as Player : null;
  const bowler = typeof currentInnings?.currentBowler === 'object' ? currentInnings.currentBowler as Player : null;

  const strikerId = getId(currentInnings?.striker);
  const nonStrikerId = getId(currentInnings?.nonStriker);
  const bowlerId = getId(currentInnings?.currentBowler);

  const strikerStat = currentInnings?.batsmenStats.find(b => {
    const pId = getId(b.player);
    return strikerId && pId === strikerId && !b.isOut;
  }) || currentInnings?.batsmenStats.find(b => {
    const pId = getId(b.player);
    return strikerId && pId === strikerId;
  });

  const nonStrikerStat = currentInnings?.batsmenStats.find(b => {
    const pId = getId(b.player);
    return nonStrikerId && pId === nonStrikerId && !b.isOut;
  }) || currentInnings?.batsmenStats.find(b => {
    const pId = getId(b.player);
    return nonStrikerId && pId === nonStrikerId;
  });

  const bowlerStat = currentInnings?.bowlerStats.find(bw => {
    const pId = getId(bw.player);
    return bowlerId && pId === bowlerId;
  });

  // Calculate current over display
  const currentOversCount = currentInnings?.overs || 0;
  const nextOverNumber = Math.floor(currentOversCount) + 1;

  // Calculate strike rates
  const getStrikeRate = (runs: number, balls: number) => {
    if (!balls) return '0.0';
    return ((runs / balls) * 100).toFixed(1);
  };

  // Calculate bowler economy
  const getEconomy = (runs: number, balls: number) => {
    if (!balls) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      
      {/* Batsmen Crease Card */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
            <span>🏏 BATTERS AT CREASE</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            R(B) • 4s • 6s • SR
          </span>
        </div>

        <div className="space-y-3">
          
          {/* Striker Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-xs">
                {striker?.name ? striker.name.charAt(0) : '?'}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-white">
                    {striker?.name || 'Select Striker'}
                  </span>
                  <span className="text-amber-400 font-extrabold text-sm animate-pulse">*</span>
                  {strikerStat?.isOppositeHand && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-0.5">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      OPPOSITE HAND
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-sky-400 font-semibold uppercase">
                  Striker
                </span>
              </div>
            </div>

            {striker ? (
              <div className="text-right font-mono">
                <div className="text-base font-black text-white">
                  {strikerStat?.runs || 0} <span className="text-slate-400 font-normal text-xs">({strikerStat?.balls || 0})</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {strikerStat?.fours || 0}x4 • {strikerStat?.sixes || 0}x6 • SR: <span className="text-sky-300 font-bold">{getStrikeRate(strikerStat?.runs || 0, strikerStat?.balls || 0)}</span>
                </div>
              </div>
            ) : isScorerMode ? (
              <button
                onClick={onSelectStriker}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center space-x-1 shadow-md shadow-sky-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Pick Striker</span>
              </button>
            ) : null}
          </div>

          {/* Non-Striker Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs">
                {nonStriker?.name ? nonStriker.name.charAt(0) : '?'}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-white">
                    {nonStriker?.name || (match.customRules?.lastManStandsAlone ? 'None (Last Man Alone)' : 'Select Non-Striker')}
                  </span>
                  {nonStrikerStat?.isOppositeHand && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      OPPOSITE HAND
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  Non-Striker
                </span>
              </div>
            </div>

            {nonStriker ? (
              <div className="text-right font-mono">
                <div className="text-base font-black text-white">
                  {nonStrikerStat?.runs || 0} <span className="text-slate-400 font-normal text-xs">({nonStrikerStat?.balls || 0})</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {nonStrikerStat?.fours || 0}x4 • {nonStrikerStat?.sixes || 0}x6 • SR: <span className="text-sky-300 font-bold">{getStrikeRate(nonStrikerStat?.runs || 0, nonStrikerStat?.balls || 0)}</span>
                </div>
              </div>
            ) : isScorerMode && !match.customRules?.lastManStandsAlone ? (
              <button
                onClick={onSelectNonStriker}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Pick Non-Striker</span>
              </button>
            ) : null}
          </div>

        </div>

        {/* Change batsmen shortcut in scorer mode */}
        {isScorerMode && (
          <div className="flex justify-end space-x-2 pt-1">
            <button
              onClick={onSelectStriker}
              className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold"
            >
              Change Striker
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={onSelectNonStriker}
              className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold"
            >
              Change Non-Striker
            </button>
          </div>
        )}
      </div>

      {/* Active Bowler Card */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
            <span>🎯 ACTIVE BOWLER</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            O • M • R • W • ECON
          </span>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
          bowler 
            ? 'bg-indigo-950/30 border-indigo-500/30'
            : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-md ${
              bowler ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {bowler?.name ? bowler.name.charAt(0) : '?'}
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-white">
                {bowler?.name || (isScorerMode ? `Pick Bowler for Over ${nextOverNumber}` : 'No Active Bowler')}
              </h4>
              <p className="text-xs text-indigo-400 font-medium">
                {bowler ? (bowler.bowlingStyle || 'Bowler') : 'Over completed / waiting for bowler'}
              </p>
            </div>
          </div>

          {bowler ? (
            <div className="text-right font-mono">
              <div className="text-xl font-black text-white">
                {bowlerStat?.wickets || 0} / <span className="text-indigo-400">{bowlerStat?.runsConceded || 0}</span>
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-bold">{bowlerStat?.overs || '0.0'}</span> ov • M: {bowlerStat?.maidens || 0} • Econ: <span className="text-amber-400 font-bold">{getEconomy(bowlerStat?.runsConceded || 0, bowlerStat?.ballsBowled || 0)}</span>
              </div>
            </div>
          ) : isScorerMode ? (
            <button
              onClick={onSelectBowler}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 animate-pulse"
            >
              Pick Bowler
            </button>
          ) : null}
        </div>

        {/* Change bowler shortcut in scorer mode */}
        {isScorerMode && (
          <div className="flex justify-end pt-1">
            <button
              onClick={onSelectBowler}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
            >
              {bowler ? 'Change Active Bowler' : 'Select Bowler for this Over'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
