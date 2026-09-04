import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Match, Team, Player } from '../../types';
import { getId } from '../../utils/helpers';

interface TossModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onStartMatch: (tossData: {
    tossWinnerId: string;
    tossDecision: 'bat' | 'bowl';
    strikerId: string;
    nonStrikerId: string;
    openingBowlerId: string;
  }) => Promise<void>;
}

export const TossModal: React.FC<TossModalProps> = ({
  isOpen,
  onClose,
  match,
  onStartMatch,
}) => {
  const teamA = match.teamA?.teamId as Team;
  const teamB = match.teamB?.teamId as Team;
  const teamAId = getId(teamA);
  const teamBId = getId(teamB);

  const [tossWinnerId, setTossWinnerId] = useState<string>(teamAId);
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  // Openers state
  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [openingBowlerId, setOpeningBowlerId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Determine which team bats first
  const isTeamABatting =
    (tossWinnerId === teamAId && tossDecision === 'bat') ||
    (tossWinnerId === teamBId && tossDecision === 'bowl');

  const battingPlayers = (isTeamABatting ? match.teamA?.players : match.teamB?.players) as Player[] || [];
  const bowlingPlayers = (isTeamABatting ? match.teamB?.players : match.teamA?.players) as Player[] || [];
  const battingTeam = isTeamABatting ? teamA : teamB;
  const bowlingTeam = isTeamABatting ? teamB : teamA;

  const handleLaunch = async () => {
    if (!strikerId || !openingBowlerId) return;
    try {
      setLoading(true);
      await onStartMatch({
        tossWinnerId,
        tossDecision,
        strikerId,
        nonStrikerId: nonStrikerId || '',
        openingBowlerId,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>🪙 Toss & Match Launchpad</Text>
              <Text style={styles.modalSubtitle}>Conduct toss and assign opening players</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Toss Winner */}
            <Text style={styles.sectionLabel}>TOSS WON BY</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[styles.choiceBtn, tossWinnerId === teamAId && styles.choiceBtnActive]}
                onPress={() => setTossWinnerId(teamAId)}
              >
                <Text style={[styles.choiceBtnText, tossWinnerId === teamAId && styles.choiceBtnTextActive]}>
                  {teamA?.name || 'Team A'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, tossWinnerId === teamBId && styles.choiceBtnActive]}
                onPress={() => setTossWinnerId(teamBId)}
              >
                <Text style={[styles.choiceBtnText, tossWinnerId === teamBId && styles.choiceBtnTextActive]}>
                  {teamB?.name || 'Team B'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toss Decision */}
            <Text style={styles.sectionLabel}>ELECTED TO</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[styles.choiceBtn, tossDecision === 'bat' && styles.choiceBtnActive]}
                onPress={() => setTossDecision('bat')}
              >
                <Text style={[styles.choiceBtnText, tossDecision === 'bat' && styles.choiceBtnTextActive]}>
                  🏏 Bat First
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, tossDecision === 'bowl' && styles.choiceBtnActive]}
                onPress={() => setTossDecision('bowl')}
              >
                <Text style={[styles.choiceBtnText, tossDecision === 'bowl' && styles.choiceBtnTextActive]}>
                  🎳 Bowl First
                </Text>
              </TouchableOpacity>
            </View>

            {/* Batting / Bowling Summary */}
            <View style={styles.summaryBanner}>
              <Text style={styles.summaryBannerText}>
                <Text style={{ fontWeight: '800', color: '#38bdf8' }}>{battingTeam?.name || 'Batting Team'}</Text> is batting first.
              </Text>
            </View>

            {/* Striker Selector */}
            <Text style={styles.sectionLabel}>OPENING STRIKER ({battingTeam?.shortCode || 'BAT'})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {battingPlayers.map((p) => {
                const pid = getId(p);
                const isSelected = strikerId === pid;
                const pObj = typeof p === 'object' ? (p as Player) : null;
                return (
                  <TouchableOpacity
                    key={pid}
                    style={[styles.playerPill, isSelected && styles.playerPillActive]}
                    onPress={() => setStrikerId(pid)}
                  >
                    <Text style={[styles.playerPillText, isSelected && styles.playerPillTextActive]}>
                      {pObj?.name || 'Player'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Non-Striker Selector */}
            <Text style={styles.sectionLabel}>OPENING NON-STRIKER ({battingTeam?.shortCode || 'BAT'})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {battingPlayers
                .filter((p) => getId(p) !== strikerId)
                .map((p) => {
                  const pid = getId(p);
                  const isSelected = nonStrikerId === pid;
                  const pObj = typeof p === 'object' ? (p as Player) : null;
                  return (
                    <TouchableOpacity
                      key={pid}
                      style={[styles.playerPill, isSelected && styles.playerPillActive]}
                      onPress={() => setNonStrikerId(pid)}
                    >
                      <Text style={[styles.playerPillText, isSelected && styles.playerPillTextActive]}>
                        {pObj?.name || 'Player'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {/* Opening Bowler Selector */}
            <Text style={styles.sectionLabel}>OPENING BOWLER ({bowlingTeam?.shortCode || 'BOWL'})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {bowlingPlayers.map((p) => {
                const pid = getId(p);
                const isSelected = openingBowlerId === pid;
                const pObj = typeof p === 'object' ? (p as Player) : null;
                return (
                  <TouchableOpacity
                    key={pid}
                    style={[
                      styles.playerPill,
                      { borderColor: '#d97706' },
                      isSelected && { backgroundColor: '#d97706', borderColor: '#fbbf24' },
                    ]}
                    onPress={() => setOpeningBowlerId(pid)}
                  >
                    <Text style={[styles.playerPillText, isSelected && styles.playerPillTextActive]}>
                      {pObj?.name || 'Player'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!strikerId || !openingBowlerId || loading) && styles.confirmBtnDisabled,
              ]}
              onPress={handleLaunch}
              disabled={!strikerId || !openingBowlerId || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Start Live Match</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  choiceBtnActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  choiceBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  choiceBtnTextActive: {
    color: '#38bdf8',
  },
  summaryBanner: {
    backgroundColor: '#162032',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  summaryBannerText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  hScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  playerPill: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  playerPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  playerPillTextActive: {
    color: '#ffffff',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
