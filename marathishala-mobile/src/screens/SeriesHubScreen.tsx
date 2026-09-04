import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { getSeriesList, getSeriesSummary } from '../services/api';
import type { Series, SeriesSummary, Team, Player, Match, PointsTableEntry, LeaderboardPlayerEntry } from '../types';
import { getId } from '../utils/helpers';

interface SeriesHubScreenProps {
  onSelectMatch: (matchId: string) => void;
  onNavigateTab: (tab: 'viewer' | 'scorer' | 'create') => void;
  isAdminLoggedIn?: boolean;
}

export const SeriesHubScreen: React.FC<SeriesHubScreenProps> = ({
  onSelectMatch,
  onNavigateTab,
  isAdminLoggedIn = false,
}) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [summary, setSummary] = useState<SeriesSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'standings' | 'leaderboard' | 'fixtures'>('standings');

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const list = await getSeriesList();
      setSeriesList(list);
      if (list.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(list[0]._id);
      }
    } catch (err) {
      console.error('Error fetching series list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (id: string) => {
    if (!id) return;
    try {
      const data = await getSeriesSummary(id);
      setSummary(data);
    } catch (err) {
      console.error('Error fetching series summary:', err);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    if (selectedSeriesId) {
      fetchSummary(selectedSeriesId);
    }
  }, [selectedSeriesId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSeries(), selectedSeriesId ? fetchSummary(selectedSeriesId) : null]);
    setRefreshing(false);
  };

  if (loading && seriesList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Tournament Standings...</Text>
      </View>
    );
  }

  const selectedSeries = seriesList.find((s) => s._id === selectedSeriesId) || seriesList[0];

  return (
    <View style={styles.screen}>
      {/* Series Selector Chips */}
      {seriesList.length > 0 && (
        <View style={styles.seriesSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seriesChips}>
            {seriesList.map((s) => {
              const isSelected = s._id === selectedSeriesId;
              return (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.seriesChip, isSelected && styles.seriesChipActive]}
                  onPress={() => setSelectedSeriesId(s._id)}
                >
                  <Text style={[styles.seriesChipText, isSelected && styles.seriesChipTextActive]}>
                    🏆 {s.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Segment Tabs */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'standings' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('standings')}
        >
          <MaterialCommunityIcons
            name="table"
            size={16}
            color={activeTab === 'standings' ? '#38bdf8' : '#94a3b8'}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'standings' && styles.segmentBtnTextActive]}>
            Standings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'leaderboard' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <MaterialCommunityIcons
            name="crown"
            size={16}
            color={activeTab === 'leaderboard' ? '#fbbf24' : '#94a3b8'}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'leaderboard' && styles.segmentBtnTextActive]}>
            Caps & Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'fixtures' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('fixtures')}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color={activeTab === 'fixtures' ? '#10b981' : '#94a3b8'}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'fixtures' && styles.segmentBtnTextActive]}>
            Fixtures
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38bdf8"
            colors={['#38bdf8']}
          />
        }
      >
        {/* STANDINGS TAB */}
        {activeTab === 'standings' && (
          <View style={styles.tabContent}>
            {summary?.pointsTable && summary.pointsTable.length > 0 ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>POINTS TABLE & NRR</Text>
                  <Text style={styles.cardSubtitle}>
                    {selectedSeries?.format || 'Gully Pro'} • {selectedSeries?.defaultOvers || 5} Overs
                  </Text>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.colHeader, { flex: 0.5 }]}>#</Text>
                  <Text style={[styles.colHeader, { flex: 2.2 }]}>Team</Text>
                  <Text style={[styles.colHeader, { flex: 0.6, textAlign: 'center' }]}>P</Text>
                  <Text style={[styles.colHeader, { flex: 0.6, textAlign: 'center' }]}>W</Text>
                  <Text style={[styles.colHeader, { flex: 0.6, textAlign: 'center' }]}>L</Text>
                  <Text style={[styles.colHeader, { flex: 0.7, textAlign: 'center' }]}>PTS</Text>
                  <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right' }]}>NRR</Text>
                </View>

                {/* Table Rows */}
                {summary.pointsTable.map((row: PointsTableEntry, idx: number) => (
                  <View key={row.team?._id || idx} style={styles.tableRow}>
                    <Text style={[styles.rankText, { flex: 0.5 }]}>{idx + 1}</Text>
                    <View style={{ flex: 2.2 }}>
                      <Text style={styles.teamNameText} numberOfLines={1}>
                        {row.team?.name || 'Team'}
                      </Text>
                      <Text style={styles.teamShortCode}>{row.team?.shortCode || ''}</Text>
                    </View>
                    <Text style={[styles.dataText, { flex: 0.6, textAlign: 'center' }]}>
                      {row.played}
                    </Text>
                    <Text style={[styles.dataText, { flex: 0.6, textAlign: 'center', color: '#34d399' }]}>
                      {row.won}
                    </Text>
                    <Text style={[styles.dataText, { flex: 0.6, textAlign: 'center', color: '#f87171' }]}>
                      {row.lost}
                    </Text>
                    <Text style={[styles.ptsText, { flex: 0.7, textAlign: 'center' }]}>
                      {row.points}
                    </Text>
                    <Text
                      style={[
                        styles.nrrText,
                        { flex: 1.2, color: row.netRunRate >= 0 ? '#38bdf8' : '#f87171' },
                      ]}
                    >
                      {row.netRunRate > 0 ? `+${row.netRunRate.toFixed(3)}` : row.netRunRate.toFixed(3)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tournament standings recorded yet</Text>
              </View>
            )}
          </View>
        )}

        {/* LEADERBOARDS TAB */}
        {activeTab === 'leaderboard' && summary?.leaderboards && (
          <View style={styles.tabContent}>
            {/* Orange Cap & Purple Cap Feature Cards */}
            <View style={styles.capsRow}>
              {/* Orange Cap */}
              <View style={[styles.capCard, styles.orangeCapCard]}>
                <View style={styles.capHeader}>
                  <Text style={styles.capEmoji}>👑</Text>
                  <Text style={[styles.capTitle, { color: '#fb923c' }]}>ORANGE CAP</Text>
                </View>
                {summary.leaderboards.orangeCap ? (
                  <View style={styles.capBody}>
                    <Text style={styles.capPlayerName} numberOfLines={1}>
                      {summary.leaderboards.orangeCap.player?.name || 'Top Batsman'}
                    </Text>
                    <Text style={styles.capScore}>
                      {summary.leaderboards.orangeCap.runs}{' '}
                      <Text style={styles.capScoreSub}>Runs</Text>
                    </Text>
                    <Text style={styles.capMeta}>
                      Avg {summary.leaderboards.orangeCap.average.toFixed(1)} • SR{' '}
                      {summary.leaderboards.orangeCap.strikeRate.toFixed(1)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noCapText}>No stats yet</Text>
                )}
              </View>

              {/* Purple Cap */}
              <View style={[styles.capCard, styles.purpleCapCard]}>
                <View style={styles.capHeader}>
                  <Text style={styles.capEmoji}>💜</Text>
                  <Text style={[styles.capTitle, { color: '#c084fc' }]}>PURPLE CAP</Text>
                </View>
                {summary.leaderboards.purpleCap ? (
                  <View style={styles.capBody}>
                    <Text style={styles.capPlayerName} numberOfLines={1}>
                      {summary.leaderboards.purpleCap.player?.name || 'Top Bowler'}
                    </Text>
                    <Text style={styles.capScore}>
                      {summary.leaderboards.purpleCap.wickets}{' '}
                      <Text style={styles.capScoreSub}>Wkts</Text>
                    </Text>
                    <Text style={styles.capMeta}>
                      Econ {summary.leaderboards.purpleCap.economy.toFixed(2)} • {summary.leaderboards.purpleCap.overs} ov
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noCapText}>No stats yet</Text>
                )}
              </View>
            </View>

            {/* Top 5 Run Scorers */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>TOP RUN SCORERS</Text>
              {summary.leaderboards.topBatsmen?.map((b: LeaderboardPlayerEntry, idx: number) => (
                <View key={b.player?._id || idx} style={styles.playerRankRow}>
                  <Text style={styles.playerRankNum}>{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerRankName}>{b.player?.name || 'Batter'}</Text>
                    <Text style={styles.playerRankMeta}>
                      {b.innings} innings • HS {b.highestScore} • {b.fours || 0} 4s, {b.sixes || 0} 6s
                    </Text>
                  </View>
                  <View style={styles.playerRankRight}>
                    <Text style={styles.playerRankValue}>{b.runs} R</Text>
                    <Text style={styles.playerRankSub}>SR {b.strikeRate.toFixed(1)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Top 5 Wicket Takers */}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: '#c084fc' }]}>TOP WICKET TAKERS</Text>
              {summary.leaderboards.topBowlers?.map((bw: LeaderboardPlayerEntry, idx: number) => (
                <View key={bw.player?._id || idx} style={styles.playerRankRow}>
                  <Text style={styles.playerRankNum}>{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerRankName}>{bw.player?.name || 'Bowler'}</Text>
                    <Text style={styles.playerRankMeta}>
                      {bw.overs} overs • M:{bw.maidens || 0} • R:{bw.runsConceded}
                    </Text>
                  </View>
                  <View style={styles.playerRankRight}>
                    <Text style={[styles.playerRankValue, { color: '#c084fc' }]}>{bw.wickets} W</Text>
                    <Text style={styles.playerRankSub}>Econ {bw.economy.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FIXTURES TAB */}
        {activeTab === 'fixtures' && (
          <View style={styles.tabContent}>
            {summary?.matches && summary.matches.length > 0 ? (
              summary.matches.map((match: Match) => {
                const teamA = match.teamA?.teamId as Team;
                const teamB = match.teamB?.teamId as Team;
                const isLive = match.status === 'Live';
                const isCompleted = match.status === 'Completed';

                return (
                  <TouchableOpacity
                    key={match._id}
                    style={[styles.fixtureCard, isLive && styles.fixtureCardLive]}
                    onPress={() => {
                      onSelectMatch(match._id);
                      if (isAdminLoggedIn && isLive) {
                        onNavigateTab('scorer');
                      } else {
                        onNavigateTab('viewer');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.fixtureHeader}>
                      <Text style={styles.fixtureTitle}>{match.title}</Text>
                      <View
                        style={[
                          styles.statusBadgeSmall,
                          isLive && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' },
                          isCompleted && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeSmallText,
                            isLive && { color: '#ef4444' },
                            isCompleted && { color: '#10b981' },
                          ]}
                        >
                          {match.status}
                        </Text>
                      </View>
                    </View>

                    {/* Teams & Scores */}
                    <View style={styles.fixtureTeamsRow}>
                      <View style={styles.fixtureTeamCol}>
                        <Text style={styles.fixtureTeamName}>{teamA?.name || 'Team A'}</Text>
                        {match.innings?.[0] && (
                          <Text style={styles.fixtureScore}>
                            {match.innings[0].totalRuns}/{match.innings[0].wickets}
                          </Text>
                        )}
                      </View>

                      <Text style={styles.fixtureVs}>vs</Text>

                      <View style={[styles.fixtureTeamCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.fixtureTeamName}>{teamB?.name || 'Team B'}</Text>
                        {match.innings?.[1] && (
                          <Text style={styles.fixtureScore}>
                            {match.innings[1].totalRuns}/{match.innings[1].wickets}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Result or Action */}
                    {isCompleted && match.result?.margin && (
                      <Text style={styles.fixtureResultText}>
                        🏆 {match.result.margin}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No matches scheduled in this series</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080d1a',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  seriesSelector: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  seriesChips: {
    flexDirection: 'row',
    gap: 8,
  },
  seriesChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  seriesChipActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  seriesChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  seriesChipTextActive: {
    color: '#38bdf8',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#0b1120',
    padding: 6,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#1e293b',
  },
  segmentBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#ffffff',
  },
  scroll: {
    padding: 12,
  },
  tabContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  colHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rankText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  teamNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  teamShortCode: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
  },
  dataText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  ptsText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '900',
  },
  nrrText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  capsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  capCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  orangeCapCard: {
    backgroundColor: '#27170a',
    borderColor: '#f97316',
  },
  purpleCapCard: {
    backgroundColor: '#210d3b',
    borderColor: '#a855f7',
  },
  capHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  capEmoji: {
    fontSize: 16,
  },
  capTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  capBody: {
    gap: 2,
  },
  capPlayerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  capScore: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  capScoreSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  capMeta: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  noCapText: {
    color: '#64748b',
    fontSize: 11,
  },
  playerRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  playerRankNum: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    width: 24,
  },
  playerRankName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  playerRankMeta: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1,
  },
  playerRankRight: {
    alignItems: 'flex-end',
  },
  playerRankValue: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '900',
  },
  playerRankSub: {
    color: '#64748b',
    fontSize: 10,
  },
  fixtureCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  fixtureCardLive: {
    borderColor: '#0284c7',
    backgroundColor: '#09152b',
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fixtureTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBadgeSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
  },
  fixtureTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fixtureTeamCol: {
    flex: 1,
  },
  fixtureTeamName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  fixtureScore: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  fixtureVs: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  fixtureResultText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
  },
});
