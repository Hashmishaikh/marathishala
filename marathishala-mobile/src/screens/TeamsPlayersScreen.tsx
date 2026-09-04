import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import {
  getTeams,
  getPlayers,
  createTeam,
  createPlayer,
  syncPlayerStats,
} from '../services/api';
import type { Team, Player } from '../types';

interface TeamsPlayersScreenProps {
  isAdminLoggedIn?: boolean;
}

export const TeamsPlayersScreen: React.FC<TeamsPlayersScreenProps> = ({
  isAdminLoggedIn = false,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Modals
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamCode, setNewTeamCode] = useState<string>('');

  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerRole, setNewPlayerRole] = useState<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'>('All-Rounder');
  const [newBatStyle, setNewBatStyle] = useState<'Right-hand' | 'Left-hand'>('Right-hand');
  const [newBowlStyle, setNewBowlStyle] = useState<'Right-arm Fast' | 'Left-arm Fast' | 'Right-arm Spin' | 'Left-arm Spin' | 'None'>('Right-arm Fast');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, playersData] = await Promise.all([getTeams(), getPlayers()]);
      setTeams(teamsData);
      setPlayers(playersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncStats = async () => {
    try {
      setSyncing(true);
      await syncPlayerStats();
      await fetchData();
      Alert.alert('Stats Synced', 'All player career averages, runs, and wickets recalculated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamCode.trim()) return;
    try {
      await createTeam({ name: newTeamName.trim(), shortCode: newTeamCode.trim().toUpperCase() });
      setNewTeamName('');
      setNewTeamCode('');
      setIsAddTeamModalOpen(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    try {
      await createPlayer({
        name: newPlayerName.trim(),
        role: newPlayerRole,
        battingStyle: newBatStyle,
        bowlingStyle: newBowlStyle,
      });
      setNewPlayerName('');
      setIsAddPlayerModalOpen(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  };

  const filteredPlayers = players.filter((p) => {
    if (searchQuery.trim()) {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (loading && teams.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Roster & Profiles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Top Search & Actions */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search player name..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        {isAdminLoggedIn && (
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleSyncStats}
            disabled={syncing}
            activeOpacity={0.7}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#fff" />
                <Text style={styles.syncBtnText}>Sync</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Action Row (Add Team / Add Player) */}
      {isAdminLoggedIn && (
        <View style={styles.adminActionRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsAddTeamModalOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#38bdf8" />
            <Text style={styles.addBtnText}>+ New Team</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsAddPlayerModalOpen(true)}
          >
            <Ionicons name="person-add" size={16} color="#38bdf8" />
            <Text style={styles.addBtnText}>+ New Player</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Teams Chips */}
      <View style={styles.teamsChipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <TouchableOpacity
            style={[styles.teamChip, selectedTeamId === 'all' && styles.teamChipActive]}
            onPress={() => setSelectedTeamId('all')}
          >
            <Text style={[styles.teamChipText, selectedTeamId === 'all' && styles.teamChipTextActive]}>
              All Players ({players.length})
            </Text>
          </TouchableOpacity>

          {teams.map((t) => (
            <TouchableOpacity
              key={t._id}
              style={[styles.teamChip, selectedTeamId === t._id && styles.teamChipActive]}
              onPress={() => setSelectedTeamId(t._id)}
            >
              <Text style={[styles.teamChipText, selectedTeamId === t._id && styles.teamChipTextActive]}>
                🛡️ {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Players List */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {filteredPlayers.map((player) => {
            const stats = player.stats;
            return (
              <View key={player._id} style={styles.playerCard}>
                <View style={styles.playerHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {player.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerRole}>
                      {player.role} • {player.battingStyle}
                    </Text>
                  </View>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{player.role}</Text>
                  </View>
                </View>

                {/* Career Stats Grid */}
                {stats ? (
                  <View style={styles.statsGrid}>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>MATCHES</Text>
                      <Text style={styles.statVal}>{stats.matches || 0}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>RUNS</Text>
                      <Text style={[styles.statVal, { color: '#38bdf8' }]}>{stats.runs || 0}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>HIGHEST</Text>
                      <Text style={styles.statVal}>{stats.highestScore || 0}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>WICKETS</Text>
                      <Text style={[styles.statVal, { color: '#fbbf24' }]}>{stats.wickets || 0}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noStatsText}>No career match stats recorded</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Team Modal */}
      <Modal visible={isAddTeamModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🛡️ Register New Team</Text>
            <TextInput
              style={styles.input}
              placeholder="Team Name (e.g. Shivaji Warriors)"
              placeholderTextColor="#64748b"
              value={newTeamName}
              onChangeText={setNewTeamName}
            />
            <TextInput
              style={styles.input}
              placeholder="Short Code (e.g. SHW)"
              placeholderTextColor="#64748b"
              value={newTeamCode}
              onChangeText={setNewTeamCode}
              maxLength={4}
              autoCapitalize="characters"
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddTeamModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateTeam}>
                <Text style={styles.modalSaveText}>Create Team</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Player Modal */}
      <Modal visible={isAddPlayerModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>👤 Register New Player</Text>
            <TextInput
              style={styles.input}
              placeholder="Player Full Name"
              placeholderTextColor="#64748b"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
            />

            <Text style={styles.pickerLabel}>Role</Text>
            <View style={styles.roleOptions}>
              {(['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOptBtn, newPlayerRole === r && styles.roleOptBtnActive]}
                  onPress={() => setNewPlayerRole(r)}
                >
                  <Text style={[styles.roleOptText, newPlayerRole === r && styles.roleOptTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddPlayerModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreatePlayer}>
                <Text style={styles.modalSaveText}>Create Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  adminActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0c2444',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  addBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  teamsChipRow: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  teamChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamChipActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  teamChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  teamChipTextActive: {
    color: '#38bdf8',
  },
  scroll: {
    paddingHorizontal: 12,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 24,
  },
  playerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  playerRole: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  roleTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  roleTagText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    padding: 10,
    borderRadius: 10,
  },
  statCell: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
  },
  statVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  noStatsText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  pickerLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  roleOptBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleOptBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  roleOptText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  roleOptTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
