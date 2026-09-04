import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getMatches, deleteMatch, syncPlayerStats, getTeams, getPlayers } from '../services/api';
import type { Match, Team, Player } from '../types';

interface AdminDashboardScreenProps {
  onNavigateTab: (tab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create') => void;
  onSelectMatch: (matchId: string) => void;
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onNavigateTab,
  onSelectMatch,
  onLogout,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamCount, setTeamCount] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [matchesData, teamsData, playersData] = await Promise.all([
        getMatches(),
        getTeams(),
        getPlayers(),
      ]);
      setMatches(matchesData);
      setTeamCount(teamsData.length);
      setPlayerCount(playersData.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleSyncStats = async () => {
    try {
      setSyncing(true);
      await syncPlayerStats();
      Alert.alert('Success', 'All player career averages and records recalculated!');
    } catch (err: any) {
      Alert.alert('Sync Error', err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteMatch = (matchId: string, title: string) => {
    Alert.alert('Delete Match', `Are you sure you want to permanently delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMatch(matchId);
            fetchDashboardData();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || err.message);
          }
        },
      },
    ]);
  };

  const liveMatches = matches.filter((m) => m.status === 'Live');
  const upcomingMatches = matches.filter((m) => m.status === 'Upcoming');
  const completedMatches = matches.filter((m) => m.status === 'Completed');

  if (loading && matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Admin Hub...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>🛡️ Admin Operations</Text>
            <Text style={styles.subtitle}>Full tournament scoring and fixture control</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={16} color="#f43f5e" />
            <Text style={styles.logoutBtnText}>Lock Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Quick KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{liveMatches.length}</Text>
            <Text style={[styles.kpiLabel, { color: '#ef4444' }]}>🔴 LIVE NOW</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{matches.length}</Text>
            <Text style={styles.kpiLabel}>TOTAL MATCHES</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{teamCount}</Text>
            <Text style={styles.kpiLabel}>TEAMS</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>{playerCount}</Text>
            <Text style={styles.kpiLabel}>PLAYERS</Text>
          </View>
        </View>

        {/* Quick Launchpad Buttons */}
        <View style={styles.launchpadRow}>
          <TouchableOpacity
            style={styles.launchBtnPrimary}
            onPress={() => onNavigateTab('create')}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.launchBtnPrimaryText}>+ Create Fixture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.launchBtnSecondary}
            onPress={handleSyncStats}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#38bdf8" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#38bdf8" />
                <Text style={styles.launchBtnSecondaryText}>Sync Stats</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Matches Management List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ALL FIXTURES ({matches.length})</Text>

          {matches.map((m) => {
            const teamA = m.teamA?.teamId as Team;
            const teamB = m.teamB?.teamId as Team;
            const isLive = m.status === 'Live';

            return (
              <View key={m._id} style={[styles.matchRow, isLive && styles.matchRowLive]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.matchRowHeader}>
                    <Text style={styles.matchTitleText}>{m.title}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        isLive && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' },
                      ]}
                    >
                      <Text style={[styles.statusPillText, isLive && { color: '#ef4444' }]}>
                        {m.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.matchTeamsText}>
                    {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'} • {m.totalOvers} ov
                  </Text>
                </View>

                <View style={styles.matchActions}>
                  <TouchableOpacity
                    style={styles.scoreActionBtn}
                    onPress={() => {
                      onSelectMatch(m._id);
                      onNavigateTab('scorer');
                    }}
                  >
                    <MaterialCommunityIcons name="scoreboard" size={16} color="#38bdf8" />
                    <Text style={styles.scoreActionBtnText}>Score</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteActionBtn}
                    onPress={() => handleDeleteMatch(m._id, m.title)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  container: {
    padding: 14,
    gap: 12,
    paddingBottom: 36,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  logoutBtnText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  kpiVal: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  kpiLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  launchpadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  launchBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  launchBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  launchBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  launchBtnSecondaryText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  sectionTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  matchRowLive: {
    borderColor: '#0284c7',
    backgroundColor: '#0c2444',
  },
  matchRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchTitleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  statusPillText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
  },
  matchTeamsText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0c2444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  scoreActionBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  deleteActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
