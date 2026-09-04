import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTeams, getPlayers, getSeriesList, createMatch } from '../services/api';
import type { Team, Player, Series, CustomRules } from '../types';
import { getId } from '../utils/helpers';

interface CreateMatchScreenProps {
  onMatchCreated: (matchId: string) => void;
}

export const CreateMatchScreen: React.FC<CreateMatchScreenProps> = ({ onMatchCreated }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('MSCA Gully Clash');
  const [venue, setVenue] = useState<string>('MarathiShala Ground');
  const [totalOvers, setTotalOvers] = useState<number>(5);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');

  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);

  // Rules
  const [rules, setRules] = useState<CustomRules>({
    widePenaltyRuns: 1,
    noBallPenaltyRuns: 1,
    allOutThresholdType: 'AllPlayersOut',
    allowDoubleBatting: true,
    oppositeHandRule: false,
    lastManStandsAlone: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, playersData, seriesData] = await Promise.all([
        getTeams(),
        getPlayers(),
        getSeriesList(),
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
      setSeriesList(seriesData);

      if (teamsData.length >= 2) {
        setTeamAId(teamsData[0]._id);
        setTeamBId(teamsData[1]._id);
      }
      if (seriesData.length > 0) {
        setSelectedSeriesId(seriesData[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Split available players evenly when teams change
  useEffect(() => {
    if (players.length > 0 && teamAPlayers.length === 0 && teamBPlayers.length === 0) {
      const half = Math.ceil(players.length / 2);
      setTeamAPlayers(players.slice(0, half).map((p) => p._id));
      setTeamBPlayers(players.slice(half).map((p) => p._id));
    }
  }, [players]);

  const togglePlayerSquad = (playerId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (teamAPlayers.includes(playerId)) {
        setTeamAPlayers(teamAPlayers.filter((id) => id !== playerId));
      } else {
        setTeamAPlayers([...teamAPlayers, playerId]);
        setTeamBPlayers(teamBPlayers.filter((id) => id !== playerId));
      }
    } else {
      if (teamBPlayers.includes(playerId)) {
        setTeamBPlayers(teamBPlayers.filter((id) => id !== playerId));
      } else {
        setTeamBPlayers([...teamBPlayers, playerId]);
        setTeamAPlayers(teamAPlayers.filter((id) => id !== playerId));
      }
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !teamAId || !teamBId) {
      Alert.alert('Incomplete Form', 'Please enter a match title and select two teams.');
      return;
    }
    if (teamAId === teamBId) {
      Alert.alert('Invalid Teams', 'Team A and Team B must be different teams.');
      return;
    }
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      Alert.alert('Squad Selection Required', 'Please assign at least 1 player to each team.');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        title: title.trim(),
        venue: venue.trim(),
        totalOvers: Number(totalOvers) || 5,
        seriesId: selectedSeriesId || null,
        teamA: {
          teamId: teamAId,
          players: teamAPlayers,
          maxWickets: teamAPlayers.length - (rules.lastManStandsAlone ? 0 : 1),
        },
        teamB: {
          teamId: teamBId,
          players: teamBPlayers,
          maxWickets: teamBPlayers.length - (rules.lastManStandsAlone ? 0 : 1),
        },
        customRules: rules,
      };

      const newMatch = await createMatch(payload);
      Alert.alert('Fixture Created!', `${title} is ready for live scoring.`);
      onMatchCreated(newMatch._id);
    } catch (err: any) {
      Alert.alert('Error Creating Match', err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && teams.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Match Creator...</Text>
      </View>
    );
  }

  const teamAObj = teams.find((t) => t._id === teamAId);
  const teamBObj = teams.find((t) => t._id === teamBId);

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.heading}>🏏 Create New Fixture</Text>
        <Text style={styles.subheading}>
          Configure overs, squads & custom Gully Cricket rules
        </Text>

        {/* Basic Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FIXTURE INFO</Text>

          <Text style={styles.inputLabel}>Match Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Quarter Final 1"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.inputLabel}>Venue / Ground</Text>
          <TextInput
            style={styles.input}
            value={venue}
            onChangeText={setVenue}
            placeholder="e.g. Shivaji Park Box"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.inputLabel}>Overs Per Side</Text>
          <View style={styles.oversRow}>
            {[3, 5, 6, 8, 10, 20].map((ov) => (
              <TouchableOpacity
                key={ov}
                style={[styles.overChip, totalOvers === ov && styles.overChipActive]}
                onPress={() => setTotalOvers(ov)}
              >
                <Text style={[styles.overChipText, totalOvers === ov && styles.overChipTextActive]}>
                  {ov} Ov
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Teams Picker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SELECT TEAMS</Text>

          {/* Team A */}
          <Text style={styles.inputLabel}>Team A</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamPickerScroll}>
            {teams.map((t) => (
              <TouchableOpacity
                key={t._id}
                style={[styles.teamSelectBtn, teamAId === t._id && styles.teamSelectBtnActive]}
                onPress={() => setTeamAId(t._id)}
              >
                <Text style={[styles.teamSelectText, teamAId === t._id && styles.teamSelectTextActive]}>
                  🛡️ {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Team B */}
          <Text style={styles.inputLabel}>Team B</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamPickerScroll}>
            {teams.map((t) => (
              <TouchableOpacity
                key={t._id}
                style={[
                  styles.teamSelectBtn,
                  { borderColor: '#d97706' },
                  teamBId === t._id && { backgroundColor: '#451a03', borderColor: '#fbbf24' },
                ]}
                onPress={() => setTeamBId(t._id)}
              >
                <Text style={[styles.teamSelectText, teamBId === t._id && { color: '#fbbf24' }]}>
                  ⚔️ {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Squad Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>SQUAD ASSIGNMENT</Text>
            <Text style={styles.squadCountText}>
              A: {teamAPlayers.length} • B: {teamBPlayers.length}
            </Text>
          </View>

          <Text style={styles.squadHint}>
            Tap a player to toggle between Team A ({teamAObj?.shortCode || 'A'}) and Team B ({teamBObj?.shortCode || 'B'})
          </Text>

          <View style={styles.playersGrid}>
            {players.map((p) => {
              const inA = teamAPlayers.includes(p._id);
              const inB = teamBPlayers.includes(p._id);

              return (
                <View key={p._id} style={styles.playerAssignRow}>
                  <Text style={styles.assignPlayerName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.assignActions}>
                    <TouchableOpacity
                      style={[styles.teamToggleBtn, inA && styles.teamToggleBtnAActive]}
                      onPress={() => togglePlayerSquad(p._id, 'A')}
                    >
                      <Text style={[styles.teamToggleBtnText, inA && styles.teamToggleBtnTextAActive]}>
                        {teamAObj?.shortCode || 'Team A'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.teamToggleBtn, inB && styles.teamToggleBtnBActive]}
                      onPress={() => togglePlayerSquad(p._id, 'B')}
                    >
                      <Text style={[styles.teamToggleBtnText, inB && styles.teamToggleBtnTextBActive]}>
                        {teamBObj?.shortCode || 'Team B'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Custom Rules */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GULLY CRICKET RULES</Text>

          {/* Wide Penalty */}
          <Text style={styles.inputLabel}>Wide Ball Penalty</Text>
          <View style={styles.oversRow}>
            {[0, 1, 2].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.overChip, rules.widePenaltyRuns === r && styles.overChipActive]}
                onPress={() => setRules({ ...rules, widePenaltyRuns: r })}
              >
                <Text style={[styles.overChipText, rules.widePenaltyRuns === r && styles.overChipTextActive]}>
                  +{r} Runs
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* NoBall Penalty */}
          <Text style={styles.inputLabel}>No-Ball Penalty</Text>
          <View style={styles.oversRow}>
            {[0, 1, 2].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.overChip, rules.noBallPenaltyRuns === r && styles.overChipActive]}
                onPress={() => setRules({ ...rules, noBallPenaltyRuns: r })}
              >
                <Text style={[styles.overChipText, rules.noBallPenaltyRuns === r && styles.overChipTextActive]}>
                  +{r} Runs
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Double Batting */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Allow Double Batting</Text>
              <Text style={styles.toggleSub}>Dismissed batters can re-enter on late wickets</Text>
            </View>
            <Switch
              value={rules.allowDoubleBatting}
              onValueChange={(val) => setRules({ ...rules, allowDoubleBatting: val })}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={rules.allowDoubleBatting ? '#38bdf8' : '#94a3b8'}
            />
          </View>

          {/* Opposite Hand */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Opposite Hand Rule</Text>
              <Text style={styles.toggleSub}>Batters forced to switch batting grip/stance</Text>
            </View>
            <Switch
              value={rules.oppositeHandRule}
              onValueChange={(val) => setRules({ ...rules, oppositeHandRule: val })}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={rules.oppositeHandRule ? '#38bdf8' : '#94a3b8'}
            />
          </View>

          {/* Last Man Stands */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Last Man Stands Alone</Text>
              <Text style={styles.toggleSub}>Single batter can finish remaining balls</Text>
            </View>
            <Switch
              value={rules.lastManStandsAlone}
              onValueChange={(val) => setRules({ ...rules, lastManStandsAlone: val })}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={rules.lastManStandsAlone ? '#38bdf8' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Create Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, creating && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Create & Launch Scorer</Text>
            </>
          )}
        </TouchableOpacity>
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
  heading: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  subheading: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: -8,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  squadCountText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  squadHint: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 10,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 4,
  },
  oversRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  overChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  overChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  overChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  overChipTextActive: {
    color: '#ffffff',
  },
  teamPickerScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  teamSelectBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  teamSelectBtnActive: {
    backgroundColor: '#0c2444',
    borderColor: '#38bdf8',
  },
  teamSelectText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  teamSelectTextActive: {
    color: '#38bdf8',
  },
  playersGrid: {
    gap: 6,
  },
  playerAssignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  assignPlayerName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  assignActions: {
    flexDirection: 'row',
    gap: 6,
  },
  teamToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamToggleBtnAActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  teamToggleBtnBActive: {
    backgroundColor: '#d97706',
    borderColor: '#fbbf24',
  },
  teamToggleBtnText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  teamToggleBtnTextAActive: {
    color: '#ffffff',
  },
  teamToggleBtnTextBActive: {
    color: '#ffffff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#162032',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  toggleTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#94a3b8',
    fontSize: 9,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
