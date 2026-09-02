import { Trophy, Target } from 'lucide-react';
import type { Match, Team } from '../../types';

interface LiveHeaderProps {
  match: Match;
}

export const LiveHeader: React.FC<LiveHeaderProps> = ({ match }) => {
  const currentInnings = match.innings.find(i => i.inningsNumber === match.currentInningsNumber);

  const battingTeam = (currentInnings ? currentInnings.battingTeam : match.teamA.teamId) as Team;
  const bowlingTeam = (currentInnings ? currentInnings.bowlingTeam : match.teamB.teamId) as Team;

  const totalRuns = currentInnings?.totalRuns || 0;
  const wickets = currentInnings?.wickets || 0;
  const maxWickets = currentInnings?.maxWicketsForInnings || 10;
  const overs = currentInnings?.overs || 0.0;

  // Calculate Current Run Rate (CRR)
  const oversParts = overs.toString().split('.');
  const ballsBowledTotal = (parseInt(oversParts[0], 10) || 0) * 6 + (parseInt(oversParts[1], 10) || 0);
  const crr = ballsBowledTotal > 0 ? ((totalRuns / ballsBowledTotal) * 6).toFixed(2) : '0.00';

  // Calculate Target & Required Run Rate (RRR) for 2nd innings
  let target = 0;
  let runsNeeded = 0;
  let ballsRemaining = 0;
  let rrr = '0.00';

  if (match.currentInningsNumber === 2 && match.innings.length >= 2) {
    const inn1 = match.innings[0];
    target = inn1.totalRuns + 1;
    runsNeeded = Math.max(0, target - totalRuns);
    const totalMatchBalls = match.totalOvers * 6;
    ballsRemaining = Math.max(0, totalMatchBalls - ballsBowledTotal);
    rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';
  }

  return (
    <div className="glass-panel p-5 sm:p-6 w-full space-y-4">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {match.venue || 'MSCA Arena'}
          </span>
          <span className="text-slate-400 font-medium">
            {match.totalOvers} Overs Gully Match
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {match.status === 'Live' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <span className="w-2 h-2 mr-1.5 rounded-full bg-rose-500"></span>
              LIVE INNINGS {match.currentInningsNumber}
            </span>
          )}
          {match.status === 'Innings Break' && (
            <span className="px-3 py-1 rounded-full font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              INNINGS BREAK
            </span>
          )}
          {match.status === 'Completed' && (
            <span className="px-3 py-1 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              MATCH CONCLUDED
            </span>
          )}
          {match.status === 'Upcoming' && (
            <span className="px-3 py-1 rounded-full font-extrabold bg-slate-700 text-slate-300">
              UPCOMING
            </span>
          )}
        </div>
      </div>

      {/* Main Big Score Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Batting Team & Big Score */}
        <div className="flex items-center space-x-4">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-xl"
            style={{ backgroundColor: battingTeam?.colorHex || '#0284c7' }}
          >
            {battingTeam?.shortCode || 'BAT'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {battingTeam?.name || 'Batting Team'}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold bg-white/10 text-slate-300">
                vs {bowlingTeam?.shortCode || 'BOWL'}
              </span>
            </div>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {totalRuns}<span className="text-sky-400">/{wickets}</span>
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-slate-300">
                ({overs} / {match.totalOvers} ov)
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic All-Out & Rates Matrix */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2">
          
          {/* Dynamic All-Out Sizing Tag */}
          <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-mono">
            <span className="text-slate-400">All-Out Limit: </span>
            <span className="text-sky-300 font-bold">{wickets} / {maxWickets} Dismissals</span>
            <span className="text-slate-400 ml-1">({maxWickets - wickets} left)</span>
          </div>

          {/* CRR & Target Status */}
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-mono">
            <div className="flex items-center space-x-1 text-slate-300">
              <span className="text-slate-500 font-bold">CRR:</span>
              <span className="font-bold text-sky-400">{crr}</span>
            </div>

            {match.currentInningsNumber === 2 && (
              <>
                <span className="text-white/20">•</span>
                <div className="flex items-center space-x-1 text-slate-300">
                  <span className="text-slate-500 font-bold">RRR:</span>
                  <span className="font-bold text-amber-400">{rrr}</span>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Target Chasing Bar (2nd Innings) or Result Banner */}
      {match.currentInningsNumber === 2 && match.status === 'Live' && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center space-x-2 text-amber-200">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">
              Target: <strong className="text-white font-mono text-base">{target}</strong> runs
            </span>
          </div>
          <span className="font-bold text-amber-300 font-mono">
            Need <strong className="text-white text-sm">{runsNeeded}</strong> runs off <strong className="text-white text-sm">{ballsRemaining}</strong> balls
          </span>
        </div>
      )}

      {/* Completed Match Banner */}
      {match.status === 'Completed' && match.result && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center space-x-2 text-emerald-200 font-bold text-sm sm:text-base animate-in zoom-in-95">
          <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
          <span>
            {match.result.winner 
              ? `${(typeof match.result.winner === 'object' ? (match.result.winner as Team).name : match.result.winner)} won by ${match.result.margin}!`
              : match.result.margin || 'Match Tied!'}
          </span>
        </div>
      )}

    </div>
  );
};
