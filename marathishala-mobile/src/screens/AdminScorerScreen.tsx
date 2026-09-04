import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Keypad } from '../components/scorer/Keypad';
import { CreaseCard } from '../components/scorer/CreaseCard';
import { OverTimeline } from '../components/scorer/OverTimeline';
import { CelebrationBanner } from '../components/scorer/CelebrationBanner';
import { WicketModal } from '../components/scorer/WicketModal';
import { ExtrasModal } from '../components/scorer/ExtrasModal';
import { BatsmanPickerModal } from '../components/scorer/BatsmanPickerModal';
import { BowlerPickerModal } from '../components/scorer/BowlerPickerModal';
import { TossModal } from '../components/scorer/TossModal';
import { RulesConfigModal } from '../components/scorer/RulesConfigModal';
import { LiveHeader } from '../components/viewer/LiveHeader';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { useScorerActions } from '../hooks/useScorerActions';
import { startMatch, startSecondInnings, endMatch, updateMatch } from '../services/api';
import type { Delivery, Team, CustomRules } from '../types';
import { getId } from '../utils/helpers';

interface AdminScorerScreenProps {
  matchId: string;
  onNavigateToViewer?: () => void;
}

export const AdminScorerScreen: React.FC<AdminScorerScreenProps> = ({
  matchId,
  onNavigateToViewer,
}) => {
  const {
    match,
    deliveries,
    loading,
    error,
    refreshMatch,
    celebrationEvent,
    clearCelebration,
  } = useLiveMatch(matchId);

  const {
    submitting,
    actionError,
    setActionError,
    scoreBall,
    undoBall,
    swapEnds,
    selectBatsman,
    selectBowler,
    forceRebuild,
  } = useScorerActions(matchId);

  // Modals
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isBatsmanModalOpen, setIsBatsmanModalOpen] = useState(false);
  const [batsmanPosition, setBatsmanPosition] = useState<'striker' | 'nonStriker'>('striker');
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isTossModalOpen, setIsTossModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  if (loading && !match) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Live Match Scorer...</Text>
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#f43f5e" />
        <Text style={styles.errorTitle}>Error Loading Match</Text>
        <Text style={styles.errorSub}>{error || 'Match not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refreshMatch}>
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentInnings = match.innings?.find(
    (i) => i.inningsNumber === match.currentInningsNumber
  );

  // Determine last completed over bowler
  const currentInningsDeliveries = deliveries.filter(
    (d) => d.inningsNumber === match.currentInningsNumber
  );
  let legalBallCount = 0;
  currentInningsDeliveries.forEach((d) => {
    if (d.extraType !== 'Wide' && d.extraType !== 'NoBall') legalBallCount++;
  });
  const isOverJustFinished = legalBallCount > 0 && legalBallCount % 6 === 0;
  const lastDelivery = currentInningsDeliveries[currentInningsDeliveries.length - 1];
  const lastBowlerId = isOverJustFinished && lastDelivery ? getId(lastDelivery.bowler) : undefined;

  const checkBeforeScoring = () => {
    if (!currentInnings?.currentBowler) {
      setIsBowlerModalOpen(true);
      setActionError('Please select an active bowler before scoring a ball.');
      return false;
    }
    if (!currentInnings?.striker) {
      setBatsmanPosition('striker');
      setIsBatsmanModalOpen(true);
      setActionError('Please select a striker before scoring a ball.');
      return false;
    }
    return true;
  };

  const handlePostBallFlow = (res: any) => {
    if (!res || !res.match) return;
    if (res.match.status === 'Completed' || res.match.status === 'Innings Break') return;

    const inn = res.match.innings?.find(
      (i: any) => i.inningsNumber === res.match.currentInningsNumber
    );
    if (!inn) return;

    // Over finished prompt
    if (!inn.currentBowler) {
      setIsBowlerModalOpen(true);
    }
    // Dismissal prompt
    if (!inn.striker) {
      setBatsmanPosition('striker');
      setIsBatsmanModalOpen(true);
    } else if (!inn.nonStriker && !match.customRules?.lastManStandsAlone) {
      setBatsmanPosition('nonStriker');
      setIsBatsmanModalOpen(true);
    }
  };

  const handleScoreRuns = async (runs: number) => {
    if (!checkBeforeScoring()) return;
    const res = await scoreBall({ runsOffBat: runs });
    handlePostBallFlow(res);
  };

  const handleScoreExtra = async (
    extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye',
    runningRuns = 0,
    runsOffBat = 0
  ) => {
    if (!checkBeforeScoring()) return;
    const res = await scoreBall({
      extraType,
      runningExtraRuns: runningRuns,
      runsOffBat,
    });
    handlePostBallFlow(res);
  };

  const handleConfirmWicket = async (payload: any) => {
    if (!checkBeforeScoring()) return;
    const res = await scoreBall(payload);
    handlePostBallFlow(res);
  };

  const handleStartSecondInnings = async () => {
    try {
      await startSecondInnings(match._id, {});
      refreshMatch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message);
    }
  };

  const handleEndMatch = async () => {
    Alert.alert('Finish Match', 'Are you sure you want to conclude this fixture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish Match',
        style: 'destructive',
        onPress: async () => {
          try {
            await endMatch(match._id);
            refreshMatch();
          } catch (err: any) {
            setActionError(err.response?.data?.message || err.message);
          }
        },
      },
    ]);
  };

  const handleUpdateRules = async (newRules: CustomRules) => {
    await updateMatch(match._id, { customRules: newRules });
    refreshMatch();
  };

  return (
    <View style={styles.screen}>
      <CelebrationBanner event={celebrationEvent} onDismiss={clearCelebration} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Action Error Banner */}
        {actionError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color="#fbbf24" />
            <Text style={styles.errorBannerText}>{actionError}</Text>
            <TouchableOpacity onPress={() => setActionError(null)}>
              <Ionicons name="close-circle" size={16} color="#fbbf24" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Live Score Header */}
        <LiveHeader match={match} />

        {/* UPCOMING MATCH LAUNCHPAD */}
        {match.status === 'Upcoming' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>🪙</Text>
            <Text style={styles.stateTitle}>Match Not Started</Text>
            <Text style={styles.stateDesc}>
              Conduct the toss and select opening batters & bowler to commence the match.
            </Text>
            <TouchableOpacity
              style={styles.primaryLaunchBtn}
              onPress={() => setIsTossModalOpen(true)}
            >
              <MaterialCommunityIcons name="cricket" size={20} color="#fff" />
              <Text style={styles.primaryLaunchBtnText}>Conduct Toss & Launch Match</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INNINGS BREAK STATE */}
        {match.status === 'Innings Break' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>⏸️</Text>
            <Text style={styles.stateTitle}>Innings Break</Text>
            <Text style={styles.stateDesc}>
              First innings complete! Target set to {(match.innings[0]?.totalRuns || 0) + 1} runs.
            </Text>
            <TouchableOpacity
              style={[styles.primaryLaunchBtn, { backgroundColor: '#0284c7' }]}
              onPress={handleStartSecondInnings}
            >
              <Ionicons name="play-forward" size={18} color="#fff" />
              <Text style={styles.primaryLaunchBtnText}>Start 2nd Innings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMPLETED STATE */}
        {match.status === 'Completed' && (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>🏆</Text>
            <Text style={styles.stateTitle}>Match Completed</Text>
            <Text style={styles.stateDesc}>
              {match.result?.margin || 'Result finalized'}. All stats synced with player profiles.
            </Text>
            {onNavigateToViewer && (
              <TouchableOpacity
                style={[styles.primaryLaunchBtn, { backgroundColor: '#10b981' }]}
                onPress={onNavigateToViewer}
              >
                <Ionicons name="eye" size={18} color="#fff" />
                <Text style={styles.primaryLaunchBtnText}>View Full Scorecard</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ACTIVE LIVE SCORING CONSOLE */}
        {match.status === 'Live' && (
          <View style={styles.consoleContainer}>
            {/* Quick Action Bar (Rules, End Match, Rebuild) */}
            <View style={styles.topUtilityBar}>
              <TouchableOpacity
                style={styles.utilityBtn}
                onPress={() => setIsRulesModalOpen(true)}
              >
                <Ionicons name="settings-outline" size={14} color="#94a3b8" />
                <Text style={styles.utilityBtnText}>Gully Rules</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.utilityBtn}
                onPress={() => forceRebuild(match.currentInningsNumber)}
              >
                <Ionicons name="refresh" size={14} color="#94a3b8" />
                <Text style={styles.utilityBtnText}>Rebuild</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.utilityBtn, styles.endMatchBtn]}
                onPress={handleEndMatch}
              >
                <Ionicons name="stop-circle-outline" size={14} color="#f43f5e" />
                <Text style={[styles.utilityBtnText, { color: '#f43f5e' }]}>End Match</Text>
              </TouchableOpacity>
            </View>

            {/* Crease Card (Striker, Non-Striker, Bowler) */}
            <CreaseCard
              currentInnings={currentInnings}
              onOpenBatsmanModal={(pos) => {
                setBatsmanPosition(pos);
                setIsBatsmanModalOpen(true);
              }}
              onOpenBowlerModal={() => setIsBowlerModalOpen(true)}
              onSwapStrike={() => swapEnds(match.currentInningsNumber)}
            />

            {/* Over Timeline */}
            <OverTimeline deliveries={currentInningsDeliveries} />

            {/* Interactive Keypad */}
            <Keypad
              onScoreRuns={handleScoreRuns}
              onScoreExtra={handleScoreExtra}
              onOpenWicketModal={() => setIsWicketModalOpen(true)}
              onOpenExtrasModal={() => setIsExtrasModalOpen(true)}
              onUndo={() => undoBall(match.currentInningsNumber)}
              onSwapStrike={() => swapEnds(match.currentInningsNumber)}
              submitting={submitting}
            />
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <WicketModal
        isOpen={isWicketModalOpen}
        onClose={() => setIsWicketModalOpen(false)}
        match={match}
        onConfirmWicket={handleConfirmWicket}
      />

      <ExtrasModal
        isOpen={isExtrasModalOpen}
        onClose={() => setIsExtrasModalOpen(false)}
        onConfirmExtra={handleScoreExtra}
      />

      <BatsmanPickerModal
        isOpen={isBatsmanModalOpen}
        onClose={() => setIsBatsmanModalOpen(false)}
        match={match}
        position={batsmanPosition}
        onSelectBatsman={(payload) => selectBatsman(payload)}
      />

      <BowlerPickerModal
        isOpen={isBowlerModalOpen}
        onClose={() => setIsBowlerModalOpen(false)}
        match={match}
        lastBowlerId={lastBowlerId}
        onSelectBowler={(bowlerId) => selectBowler(bowlerId)}
      />

      <TossModal
        isOpen={isTossModalOpen}
        onClose={() => setIsTossModalOpen(false)}
        match={match}
        onStartMatch={async (tossData) => {
          await startMatch(match._id, tossData);
          refreshMatch();
        }}
      />

      <RulesConfigModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        match={match}
        onUpdateRules={handleUpdateRules}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  scroll: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#080d1a',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451a03',
    borderWidth: 1,
    borderColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
    gap: 8,
  },
  errorBannerText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  stateCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
  },
  stateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stateTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  stateDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  primaryLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryLaunchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  consoleContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  utilityBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  endMatchBtn: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
});
