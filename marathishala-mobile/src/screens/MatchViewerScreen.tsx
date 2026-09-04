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
import { Ionicons } from '@expo/vector-icons';
import { LiveHeader } from '../components/viewer/LiveHeader';
import { CreaseCard } from '../components/scorer/CreaseCard';
import { OverTimeline } from '../components/scorer/OverTimeline';
import { ScorecardTabs } from '../components/viewer/ScorecardTabs';
import { CelebrationBanner } from '../components/scorer/CelebrationBanner';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { getMatches } from '../services/api';
import type { Match } from '../types';

interface MatchViewerScreenProps {
  selectedMatchId: string;
  onSelectMatch: (matchId: string) => void;
  onNavigateToScorer?: () => void;
  isAdminLoggedIn?: boolean;
}

export const MatchViewerScreen: React.FC<MatchViewerScreenProps> = ({
  selectedMatchId,
  onSelectMatch,
  onNavigateToScorer,
  isAdminLoggedIn = false,
}) => {
  const {
    match,
    deliveries,
    loading,
    error,
    refreshMatch,
    celebrationEvent,
    clearCelebration,
  } = useLiveMatch(selectedMatchId);

  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isMatchPickerOpen, setIsMatchPickerOpen] = useState(false);

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setAllMatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshMatch(), loadMatches()]);
    setRefreshing(false);
  };

  const currentInnings = match?.innings?.find(
    (i) => i.inningsNumber === match.currentInningsNumber
  );
  const currentDeliveries = (deliveries || []).filter(
    (d) => d.inningsNumber === match?.currentInningsNumber
  );

  if (loading && !match) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Connecting to MSCA Match Center...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏏</Text>
        <Text style={styles.emptyTitle}>No Live Match Selected</Text>
        <Text style={styles.emptyDesc}>
          Select a match from the fixtures list to view live scores and full commentary.
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadMatches}>
          <Text style={styles.refreshBtnText}>Browse Matches</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CelebrationBanner event={celebrationEvent} onDismiss={clearCelebration} />

      {/* Match Picker Bar */}
      {allMatches.length > 1 && (
        <View style={styles.selectorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchChips}>
            {allMatches.map((m) => {
              const isSelected = m._id === selectedMatchId;
              const isLive = m.status === 'Live';
              return (
                <TouchableOpacity
                  key={m._id}
                  style={[
                    styles.matchChip,
                    isSelected && styles.matchChipActive,
                    isLive && !isSelected && styles.matchChipLive,
                  ]}
                  onPress={() => onSelectMatch(m._id)}
                >
                  {isLive && <View style={styles.liveDot} />}
                  <Text
                    style={[
                      styles.matchChipText,
                      isSelected && styles.matchChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

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
        {/* Main Live Score Header */}
        <LiveHeader match={match} />

        {/* Live Admin Quick Edit Banner (if admin is logged in) */}
        {isAdminLoggedIn && match.status === 'Live' && onNavigateToScorer && (
          <TouchableOpacity style={styles.adminScorerBanner} onPress={onNavigateToScorer}>
            <Ionicons name="create-outline" size={16} color="#38bdf8" />
            <Text style={styles.adminScorerText}>Open Touch Scorer Console</Text>
            <Ionicons name="arrow-forward" size={14} color="#38bdf8" />
          </TouchableOpacity>
        )}

        {/* Crease Card (Live Striker, Non-Striker & Bowler) */}
        {match.status === 'Live' && (
          <View style={styles.sectionWrap}>
            <CreaseCard
              currentInnings={currentInnings}
              onOpenBatsmanModal={() => {}}
              onOpenBowlerModal={() => {}}
              onSwapStrike={() => {}}
              isReadOnly
            />
          </View>
        )}

        {/* Over Timeline */}
        {currentDeliveries.length > 0 && (
          <View style={styles.sectionWrap}>
            <OverTimeline deliveries={currentDeliveries} />
          </View>
        )}

        {/* Full Innings Scorecard & Breakdown */}
        <View style={styles.sectionWrap}>
          <ScorecardTabs match={match} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  selectorBar: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  matchChips: {
    flexDirection: 'row',
    gap: 8,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchChipActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  matchChipLive: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  matchChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 160,
  },
  matchChipTextActive: {
    color: '#38bdf8',
  },
  scroll: {
    padding: 12,
  },
  sectionWrap: {
    marginBottom: 12,
  },
  adminScorerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0c2444',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
    marginBottom: 12,
  },
  adminScorerText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#080d1a',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  refreshBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
