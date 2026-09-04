import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Header } from '../components/common/Header';
import { AdminLoginModal } from '../components/common/AdminLoginModal';
import { ConnectionModal } from '../components/common/ConnectionModal';
import { MatchViewerScreen } from '../screens/MatchViewerScreen';
import { SeriesHubScreen } from '../screens/SeriesHubScreen';
import { TeamsPlayersScreen } from '../screens/TeamsPlayersScreen';
import { AdminScorerScreen } from '../screens/AdminScorerScreen';
import { CreateMatchScreen } from '../screens/CreateMatchScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { getMatches } from '../services/api';
import type { Match, Team } from '../types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin'
  >('viewer');
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [intendedAdminTab, setIntendedAdminTab] = useState<'admin' | 'scorer' | 'create'>('admin');

  // Connection Modal
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isMatchPickerModalOpen, setIsMatchPickerModalOpen] = useState<boolean>(false);

  const fetchInitialMatch = async () => {
    try {
      const matches = await getMatches();
      setAllMatches(matches);
      if (matches.length > 0) {
        const live = matches.find((m) => m.status === 'Live') || matches[0];
        setActiveMatchId(live._id);
        setActiveMatch(live);
      }
    } catch (err) {
      console.error('Error fetching initial matches:', err);
    }
  };

  useEffect(() => {
    fetchInitialMatch();
  }, []);

  const handleTabChange = (
    tab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin'
  ) => {
    if (['admin', 'scorer', 'create'].includes(tab)) {
      if (!isAdminLoggedIn) {
        setIntendedAdminTab(tab as 'admin' | 'scorer' | 'create');
        setIsAdminLoginModalOpen(true);
        return;
      }
    }
    setCurrentTab(tab);
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentTab(intendedAdminTab);
  };

  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    if (['admin', 'scorer', 'create'].includes(currentTab)) {
      setCurrentTab('viewer');
    }
  };

  const handleMatchCreated = (newMatchId: string) => {
    setActiveMatchId(newMatchId);
    fetchInitialMatch();
    setCurrentTab('scorer');
  };

  const handleSelectMatch = (matchId: string) => {
    setActiveMatchId(matchId);
    const m = allMatches.find((match) => match._id === matchId);
    if (m) setActiveMatch(m);
    setIsMatchPickerModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top Application Header */}
      <Header
        activeMatchTitle={activeMatch?.title}
        isLive={activeMatch?.status === 'Live'}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => {
          setIntendedAdminTab('admin');
          setIsAdminLoginModalOpen(true);
        }}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onOpenMatchPicker={() => setIsMatchPickerModalOpen(true)}
      />

      {/* Main Screen Views */}
      <View style={styles.mainContent}>
        {/* PUBLIC SPECTATOR TAB: Live Score & Match Center */}
        {currentTab === 'viewer' && (
          <MatchViewerScreen
            selectedMatchId={activeMatchId}
            onSelectMatch={handleSelectMatch}
            onNavigateToScorer={() => handleTabChange('scorer')}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* PUBLIC SPECTATOR TAB: Tournament Standings & NRR */}
        {currentTab === 'series' && (
          <SeriesHubScreen
            onSelectMatch={handleSelectMatch}
            onNavigateTab={handleTabChange}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* PUBLIC SPECTATOR TAB: Roster & Player Stats */}
        {currentTab === 'teams' && (
          <TeamsPlayersScreen isAdminLoggedIn={isAdminLoggedIn} />
        )}

        {/* PROTECTED ADMIN SECTION: Touch Scorer Console */}
        {currentTab === 'scorer' &&
          (activeMatchId ? (
            <AdminScorerScreen
              matchId={activeMatchId}
              onNavigateToViewer={() => setCurrentTab('viewer')}
            />
          ) : (
            <View style={styles.noMatchSelectedBox}>
              <Text style={styles.noMatchIcon}>🏏</Text>
              <Text style={styles.noMatchTitle}>No Fixture Selected</Text>
              <Text style={styles.noMatchSub}>
                Please create or select an active fixture to begin live scoring.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setCurrentTab('create')}
              >
                <Text style={styles.createBtnText}>+ Create New Fixture</Text>
              </TouchableOpacity>
            </View>
          ))}

        {/* PROTECTED ADMIN SECTION: Fixture Creator */}
        {currentTab === 'create' && (
          <CreateMatchScreen onMatchCreated={handleMatchCreated} />
        )}

        {/* PROTECTED ADMIN SECTION: Admin Operations Hub */}
        {currentTab === 'admin' && (
          <AdminDashboardScreen
            onNavigateTab={handleTabChange}
            onSelectMatch={handleSelectMatch}
            onLogout={handleLogoutAdmin}
          />
        )}
      </View>

      {/* Bottom Sticky Tab Navigation */}
      <View style={styles.bottomNav}>
        {/* Match Center */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabChange('viewer')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="scoreboard-outline"
            size={22}
            color={currentTab === 'viewer' ? '#38bdf8' : '#64748b'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'viewer' && styles.navLabelActive,
            ]}
          >
            Live Center
          </Text>
        </TouchableOpacity>

        {/* Tournaments */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabChange('series')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="trophy-outline"
            size={22}
            color={currentTab === 'series' ? '#38bdf8' : '#64748b'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'series' && styles.navLabelActive,
            ]}
          >
            Series
          </Text>
        </TouchableOpacity>

        {/* Scorer Button (Centered highlight) */}
        <TouchableOpacity
          style={styles.scorerCenterTab}
          onPress={() => handleTabChange('scorer')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.scorerCircle,
              currentTab === 'scorer' && styles.scorerCircleActive,
            ]}
          >
            <MaterialCommunityIcons name="cricket" size={24} color="#ffffff" />
          </View>
          <Text
            style={[
              styles.navLabel,
              currentTab === 'scorer' && styles.navLabelActive,
              { marginTop: 2 },
            ]}
          >
            Scorer
          </Text>
        </TouchableOpacity>

        {/* Teams / Players */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabChange('teams')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="people-outline"
            size={22}
            color={currentTab === 'teams' ? '#38bdf8' : '#64748b'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'teams' && styles.navLabelActive,
            ]}
          >
            Roster
          </Text>
        </TouchableOpacity>

        {/* Admin Hub */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabChange('admin')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="shield-crown-outline"
            size={22}
            color={currentTab === 'admin' ? '#38bdf8' : '#64748b'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'admin' && styles.navLabelActive,
            ]}
          >
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onSaved={fetchInitialMatch}
      />

      {/* Match Picker Modal */}
      <Modal visible={isMatchPickerModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏏 Switch Fixture</Text>
              <TouchableOpacity onPress={() => setIsMatchPickerModalOpen(false)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {allMatches.map((m) => {
                const isSelected = m._id === activeMatchId;
                const isLive = m.status === 'Live';
                const teamA = m.teamA?.teamId as Team;
                const teamB = m.teamB?.teamId as Team;

                return (
                  <TouchableOpacity
                    key={m._id}
                    style={[styles.matchPickItem, isSelected && styles.matchPickItemActive]}
                    onPress={() => handleSelectMatch(m._id)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.matchPickHeader}>
                        <Text style={styles.matchPickTitle}>{m.title}</Text>
                        {isLive && (
                          <View style={styles.liveTag}>
                            <Text style={styles.liveTagText}>LIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.matchPickTeams}>
                        {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                      size={20}
                      color={isSelected ? '#38bdf8' : '#64748b'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#070b16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  scorerCenterTab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    flex: 1,
  },
  scorerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  scorerCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#34d399',
    shadowColor: '#059669',
  },
  noMatchSelectedBox: {
    margin: 20,
    padding: 30,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginTop: 40,
  },
  noMatchIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noMatchTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  noMatchSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  createBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  matchPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchPickItemActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  matchPickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchPickTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  liveTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveTagText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
  },
  matchPickTeams: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
});
