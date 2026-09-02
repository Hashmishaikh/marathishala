import React, { useState } from 'react';
import type { Match, Player, Team } from '../../types';
import { getId } from '../../utils/helpers';

interface ScorecardTabsProps {
  match: Match;
}

export const ScorecardTabs: React.FC<ScorecardTabsProps> = ({ match }) => {
  const [activeInningsTab, setActiveInningsTab] = useState<number>(match.currentInningsNumber || 1);

  const currentInnings = match.innings.find(i => i.inningsNumber === activeInningsTab) || match.innings[0];

  if (!currentInnings) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        Scorecard not available yet. Match has not started.
      </div>
    );
  }

  const battingTeam = currentInnings.battingTeam as Team;
  const bowlingTeam = currentInnings.bowlingTeam as Team;

  const batsmenStats = currentInnings.batsmenStats || [];
  const bowlerStats = currentInnings.bowlerStats || [];
  const fallOfWickets = currentInnings.fallOfWickets || [];
  const extras = currentInnings.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
  const totalExtras = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0) + (extras.penalty || 0);

  const getStrikeRate = (runs: number, balls: number) => {
    if (!balls) return '0.0';
    return ((runs / balls) * 100).toFixed(1);
  };

  const getEconomy = (runs: number, balls: number) => {
    if (!balls) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 w-full space-y-6">
      
      {/* Innings Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
        {match.innings.map((inn) => {
          const bTeam = inn.battingTeam as Team;
          return (
            <button
              key={inn.inningsNumber}
              onClick={() => setActiveInningsTab(inn.inningsNumber)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                activeInningsTab === inn.inningsNumber
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{bTeam?.shortCode || `Team ${inn.inningsNumber}`} Innings</span>
              <span className="font-mono text-xs opacity-75">
                ({inn.totalRuns}/{inn.wickets})
              </span>
            </button>
          );
        })}
      </div>

      {/* Batting Scorecard Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">
            🏏 {battingTeam?.name || 'Batting'} Innings
          </h3>
          <span className="text-xs font-mono font-bold text-slate-300">
            {currentInnings.totalRuns}/{currentInnings.wickets} ({currentInnings.overs} ov)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-2">Batter</th>
                <th className="py-2.5 px-2">Dismissal</th>
                <th className="py-2.5 px-2 text-right">R</th>
                <th className="py-2.5 px-2 text-right">B</th>
                <th className="py-2.5 px-2 text-right">4s</th>
                <th className="py-2.5 px-2 text-right">6s</th>
                <th className="py-2.5 px-2 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {batsmenStats.map((stat, idx) => {
                const player = stat.player as Player;
                const isStriker = currentInnings.striker && getId(currentInnings.striker) === getId(player);
                
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white">
                          {player?.name || 'Player'}
                        </span>
                        {isStriker && !stat.isOut && (
                          <span className="text-amber-400 font-bold">*</span>
                        )}
                        {stat.inningsAttempt > 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            2nd Turn {stat.isOppositeHand ? '(Opposite Hand)' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-400 text-xs italic">
                      {stat.isOut ? stat.dismissal : <span className="text-emerald-400 font-semibold not-italic">Not Out</span>}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-black text-white">{stat.runs}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-400">{stat.balls}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-300">{stat.fours}</td>
                    <td className="py-3 px-2 text-right font-mono text-purple-300">{stat.sixes}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-sky-400">
                      {getStrikeRate(stat.runs, stat.balls)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Extras & Total Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-300 gap-2 font-mono">
          <div>
            <span className="text-slate-400">Extras: </span>
            <strong className="text-white">{totalExtras}</strong>
            <span className="text-slate-400 ml-1">
              (wd {extras.wides || 0}, nb {extras.noBalls || 0}, b {extras.byes || 0}, lb {extras.legByes || 0})
            </span>
          </div>
          <div>
            <span className="text-slate-400">Total: </span>
            <strong className="text-white text-sm">{currentInnings.totalRuns}/{currentInnings.wickets}</strong>
            <span className="text-slate-400 ml-1">({currentInnings.overs} Overs, RR: {((currentInnings.totalRuns / Math.max(1, currentInnings.overs)) || 0).toFixed(2)})</span>
          </div>
        </div>
      </div>

      {/* Bowling Scorecard Table */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
          🎯 {bowlingTeam?.name || 'Bowling'} Figures
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-2">Bowler</th>
                <th className="py-2.5 px-2 text-right">O</th>
                <th className="py-2.5 px-2 text-right">M</th>
                <th className="py-2.5 px-2 text-right">R</th>
                <th className="py-2.5 px-2 text-right">W</th>
                <th className="py-2.5 px-2 text-right">ECON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bowlerStats.map((bw, idx) => {
                const player = bw.player as Player;
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-bold text-white">
                      {player?.name || 'Bowler'}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-300">{bw.overs}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-400">{bw.maidens}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-300">{bw.runsConceded}</td>
                    <td className="py-3 px-2 text-right font-mono font-black text-indigo-300 text-sm">{bw.wickets}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-amber-400">
                      {getEconomy(bw.runsConceded, bw.ballsBowled)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {fallOfWickets.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Fall of Wickets
          </h4>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {fallOfWickets.map((fow, i) => {
              const p = fow.playerOut as Player;
              return (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-200">
                  <strong>{fow.score}-{fow.wicketNumber}</strong> ({p?.name || 'Player'}, {fow.overs} ov)
                </span>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
