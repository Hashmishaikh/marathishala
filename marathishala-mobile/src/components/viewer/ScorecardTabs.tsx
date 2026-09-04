import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { Match, Team, Player, Innings } from '../../types';
import { formatOvers } from '../../utils/helpers';

interface ScorecardTabsProps {
  match: Match;
}

export const ScorecardTabs: React.FC<ScorecardTabsProps> = ({ match }) => {
  const [selectedInningsNum, setSelectedInningsNum] = useState<number>(
    match.currentInningsNumber || 1
  );

  const teamA = match.teamA?.teamId as Team;
  const teamB = match.teamB?.teamId as Team;

  const currentInnings = match.innings?.find((i) => i.inningsNumber === selectedInningsNum);

  const battingTeam = currentInnings?.battingTeam as Team;
  const bowlingTeam = currentInnings?.bowlingTeam as Team;

  const calculateSR = (runs = 0, balls = 0) => {
    if (balls === 0) return '0.0';
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEcon = (runs = 0, overs = 0) => {
    const full = Math.floor(overs);
    const balls = Math.round((overs - full) * 10);
    const totalBalls = full * 6 + balls;
    if (totalBalls === 0) return '0.00';
    return ((runs / totalBalls) * 6).toFixed(2);
  };

  return (
    <View style={styles.container}>
      {/* Innings Switcher Tabs */}
      <View style={styles.tabsHeader}>
        {match.innings?.map((inn) => {
          const bTeam = inn.battingTeam as Team;
          const isSelected = selectedInningsNum === inn.inningsNumber;
          return (
            <TouchableOpacity
              key={inn.inningsNumber}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setSelectedInningsNum(inn.inningsNumber)}
            >
              <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                {bTeam?.shortCode || `Inn ${inn.inningsNumber}`} ({inn.totalRuns}/{inn.wickets})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {currentInnings ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.contentScroll}>
          {/* Batting Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>BATTING SCORECARD</Text>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { flex: 2.2 }]}>Batter</Text>
              <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>R</Text>
              <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>B</Text>
              <Text style={[styles.tableColHeader, { flex: 0.6, textAlign: 'right' }]}>4s</Text>
              <Text style={[styles.tableColHeader, { flex: 0.6, textAlign: 'right' }]}>6s</Text>
              <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>SR</Text>
            </View>

            {/* Batsmen Rows */}
            {currentInnings.batsmenStats?.map((bStat, idx) => {
              const p = bStat.player as Player;
              return (
                <View key={idx} style={styles.tableRow}>
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.playerNameText} numberOfLines={1}>
                      {p?.name || 'Batter'}
                      {bStat.inningsAttempt > 1 ? ` (Inn ${bStat.inningsAttempt})` : ''}
                    </Text>
                    <Text style={styles.dismissalText} numberOfLines={1}>
                      {bStat.isOut ? bStat.dismissal || 'out' : 'not out'}
                    </Text>
                  </View>
                  <Text style={[styles.runsText, { flex: 0.8 }]}>{bStat.runs}</Text>
                  <Text style={[styles.tableDataText, { flex: 0.8 }]}>{bStat.balls}</Text>
                  <Text style={[styles.tableDataText, { flex: 0.6 }]}>{bStat.fours || 0}</Text>
                  <Text style={[styles.tableDataText, { flex: 0.6 }]}>{bStat.sixes || 0}</Text>
                  <Text style={[styles.tableDataText, { flex: 1.2 }]}>
                    {calculateSR(bStat.runs, bStat.balls)}
                  </Text>
                </View>
              );
            })}

            {/* Extras Row */}
            <View style={styles.extrasFooterRow}>
              <Text style={styles.extrasLabel}>Extras</Text>
              <Text style={styles.extrasBreakdown}>
                {(currentInnings.extras?.wides || 0) +
                  (currentInnings.extras?.noBalls || 0) +
                  (currentInnings.extras?.byes || 0) +
                  (currentInnings.extras?.legByes || 0) +
                  (currentInnings.extras?.penalty || 0)}{' '}
                (wd {currentInnings.extras?.wides || 0}, nb {currentInnings.extras?.noBalls || 0}, b{' '}
                {currentInnings.extras?.byes || 0}, lb {currentInnings.extras?.legByes || 0})
              </Text>
            </View>

            {/* Total Row */}
            <View style={styles.totalFooterRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalScore}>
                {currentInnings.totalRuns}/{currentInnings.wickets} ({formatOvers(currentInnings.overs)} ov)
              </Text>
            </View>
          </View>

          {/* Bowling Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: '#fbbf24' }]}>BOWLING FIGURES</Text>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { flex: 2.2 }]}>Bowler</Text>
              <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>O</Text>
              <Text style={[styles.tableColHeader, { flex: 0.6, textAlign: 'right' }]}>M</Text>
              <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>R</Text>
              <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>W</Text>
              <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>ECON</Text>
            </View>

            {/* Bowler Rows */}
            {currentInnings.bowlerStats?.map((bStat, idx) => {
              const p = bStat.player as Player;
              return (
                <View key={idx} style={styles.tableRow}>
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.playerNameText} numberOfLines={1}>
                      {p?.name || 'Bowler'}
                    </Text>
                  </View>
                  <Text style={[styles.tableDataText, { flex: 0.8 }]}>
                    {formatOvers(bStat.overs)}
                  </Text>
                  <Text style={[styles.tableDataText, { flex: 0.6 }]}>{bStat.maidens || 0}</Text>
                  <Text style={[styles.tableDataText, { flex: 0.8 }]}>{bStat.runsConceded}</Text>
                  <Text style={[styles.wicketsText, { flex: 0.8 }]}>{bStat.wickets}</Text>
                  <Text style={[styles.tableDataText, { flex: 1.2 }]}>
                    {calculateEcon(bStat.runsConceded, bStat.overs)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Fall of Wickets */}
          {currentInnings.fallOfWickets && currentInnings.fallOfWickets.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>FALL OF WICKETS</Text>
              </View>
              <View style={styles.fowContainer}>
                {currentInnings.fallOfWickets.map((fow, idx) => {
                  const p = fow.playerOut as Player;
                  return (
                    <Text key={idx} style={styles.fowText}>
                      <Text style={{ color: '#38bdf8', fontWeight: '800' }}>
                        {fow.score}/{fow.wicketNumber}
                      </Text>{' '}
                      ({p?.name || 'Player'}, {fow.overs} ov)
                      {idx < currentInnings.fallOfWickets.length - 1 ? ' • ' : ''}
                    </Text>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No scorecard available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  tabsHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#38bdf8',
  },
  contentScroll: {
    gap: 12,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  cardHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: 6,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tableColHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  playerNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissalText: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 1,
  },
  runsText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  wicketsText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  tableDataText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  extrasFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  extrasLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  extrasBreakdown: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  totalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  totalScore: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '900',
  },
  fowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fowText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 18,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
  },
});
