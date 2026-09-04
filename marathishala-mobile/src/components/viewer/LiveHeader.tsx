import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Match, Team, Innings } from '../../types';
import { formatOvers, calculateRunRate, calculateRequiredRunRate } from '../../utils/helpers';

interface LiveHeaderProps {
  match: Match;
}

export const LiveHeader: React.FC<LiveHeaderProps> = ({ match }) => {
  const teamA = match.teamA?.teamId as Team;
  const teamB = match.teamB?.teamId as Team;

  const inn1 = match.innings?.find((i) => i.inningsNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningsNumber === 2);
  const currentInnings = match.innings?.find(
    (i) => i.inningsNumber === match.currentInningsNumber
  ) || inn1;

  const isSecondInnings = match.currentInningsNumber === 2;
  const firstInningsRuns = inn1?.totalRuns || 0;
  const target = isSecondInnings ? firstInningsRuns + 1 : undefined;

  const currentRuns = currentInnings?.totalRuns || 0;
  const currentWickets = currentInnings?.wickets || 0;
  const maxWickets = currentInnings?.maxWicketsForInnings || 10;
  const currentOvers = currentInnings?.overs || 0;

  const totalBalls = (match.totalOvers || 5) * 6;
  const fullOvers = Math.floor(currentOvers);
  const ballsInCurrentOver = Math.round((currentOvers - fullOvers) * 10);
  const ballsBowled = fullOvers * 6 + ballsInCurrentOver;
  const remainingBalls = Math.max(0, totalBalls - ballsBowled);
  const runsNeeded = target ? target - currentRuns : 0;

  const crr = calculateRunRate(currentRuns, currentOvers);
  const rrr = target ? calculateRequiredRunRate(target, currentRuns, remainingBalls) : null;

  const battingTeam = typeof currentInnings?.battingTeam === 'object'
    ? (currentInnings.battingTeam as Team)
    : (match.currentInningsNumber === 1 ? teamA : teamB);

  return (
    <View style={styles.card} className="bg-slate-900 rounded-3xl p-4 border border-white/10 mb-3">
      {/* Top Match Title & Status Badge */}
      <View style={styles.titleRow} className="flex-row justify-between items-center mb-2">
        <Text style={styles.matchTitle} className="text-slate-400 text-xs font-bold flex-1 mr-2" numberOfLines={1}>
          {match.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            match.status === 'Live' && styles.statusLive,
            match.status === 'Completed' && styles.statusCompleted,
          ]}
          className="px-2.5 py-0.5 rounded-full border"
        >
          <Text
            style={[
              styles.statusText,
              match.status === 'Live' && { color: '#ef4444' },
              match.status === 'Completed' && { color: '#10b981' },
            ]}
            className="text-[10px] font-black uppercase tracking-wider"
          >
            {match.status}
          </Text>
        </View>
      </View>

      {/* Main Score Centerpiece */}
      <View style={styles.scoreSection} className="flex-row justify-between items-center my-1">
        <View style={styles.scoreLeft} className="flex-1">
          <Text style={styles.battingTeamName} className="text-white text-base font-black mb-0.5">
            {battingTeam?.name || 'Batting Team'}
          </Text>
          <View style={styles.scoreNumberRow} className="flex-row items-baseline gap-2">
            <Text style={styles.scoreRunsWickets} className="text-sky-400 text-4xl font-black tracking-tight">
              {currentRuns}/{currentWickets}
            </Text>
            <Text style={styles.oversText} className="text-slate-400 text-sm font-bold">
              ({formatOvers(currentOvers)} / {match.totalOvers} ov)
            </Text>
          </View>
        </View>

        {/* 1st Innings Summary Box (if in 2nd innings) */}
        {isSecondInnings && inn1 && (
          <View style={styles.inn1Box} className="bg-slate-800 px-3 py-1.5 rounded-xl items-end border border-slate-700">
            <Text style={styles.inn1Label} className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              1st Innings
            </Text>
            <Text style={styles.inn1Score} className="text-slate-200 text-xs font-extrabold mt-0.5">
              {inn1.totalRuns}/{inn1.wickets} ({formatOvers(inn1.overs)})
            </Text>
          </View>
        )}
      </View>

      {/* Target Equation Banner */}
      {isSecondInnings && match.status === 'Live' && target ? (
        <View style={styles.targetBanner} className="bg-[#0c2444] px-3 py-2 rounded-xl mt-2 border border-sky-500">
          <Text style={styles.targetText} className="text-slate-200 text-xs font-semibold text-center">
            Target: <Text style={styles.highlight}>{target}</Text> • Need{' '}
            <Text style={styles.highlight}>{runsNeeded > 0 ? runsNeeded : 0} runs</Text> in{' '}
            <Text style={styles.highlight}>{remainingBalls} balls</Text>
          </Text>
        </View>
      ) : null}

      {/* Match Completed Result Banner */}
      {match.status === 'Completed' && match.result?.margin ? (
        <View style={styles.resultBanner} className="bg-emerald-950/80 px-3 py-2 rounded-xl mt-2 border border-emerald-500">
          <Text style={styles.resultText} className="text-emerald-400 text-xs font-black text-center">
            🏆 {(match.result.winner as Team)?.name || 'Winner'}: {match.result.margin}
          </Text>
        </View>
      ) : null}

      {/* Rate Statistics Row */}
      <View style={styles.statsRow} className="flex-row justify-between bg-slate-950/80 mt-3 px-3 py-2 rounded-xl border border-white/5">
        <View style={styles.statItem} className="items-center">
          <Text style={styles.statLabel} className="text-slate-400 text-[9px] font-black tracking-wider">CRR</Text>
          <Text style={styles.statValue} className="text-white text-xs font-black mt-0.5">{crr}</Text>
        </View>

        {rrr ? (
          <View style={styles.statItem} className="items-center">
            <Text style={styles.statLabel} className="text-slate-400 text-[9px] font-black tracking-wider">REQ RR</Text>
            <Text style={[styles.statValue, { color: '#fbbf24' }]} className="text-amber-400 text-xs font-black mt-0.5">{rrr}</Text>
          </View>
        ) : null}

        <View style={styles.statItem} className="items-center">
          <Text style={styles.statLabel} className="text-slate-400 text-[9px] font-black tracking-wider">EXTRAS</Text>
          <Text style={styles.statValue} className="text-white text-xs font-black mt-0.5">
            {(currentInnings?.extras?.wides || 0) +
              (currentInnings?.extras?.noBalls || 0) +
              (currentInnings?.extras?.byes || 0) +
              (currentInnings?.extras?.legByes || 0) +
              (currentInnings?.extras?.penalty || 0)}
          </Text>
        </View>

        <View style={styles.statItem} className="items-center">
          <Text style={styles.statLabel} className="text-slate-400 text-[9px] font-black tracking-wider">WKTS LEFT</Text>
          <Text style={styles.statValue} className="text-white text-xs font-black mt-0.5">{Math.max(0, maxWickets - currentWickets)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  statusLive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  statusText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  scoreLeft: {
    flex: 1,
  },
  battingTeamName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreRunsWickets: {
    color: '#38bdf8',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  oversText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  inn1Box: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inn1Label: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inn1Score: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  targetBanner: {
    backgroundColor: '#0c2444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  targetText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  highlight: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  resultBanner: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  resultText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#131d31',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
