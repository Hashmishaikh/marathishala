import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Player, Match } from '../../types';
import { getId, getTeamBattingAndBowling, formatOvers } from '../../utils/helpers';

interface BowlerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  lastBowlerId?: string;
  onSelectBowler: (bowlerId: string) => void;
}

export const BowlerPickerModal: React.FC<BowlerPickerModalProps> = ({
  isOpen,
  onClose,
  match,
  lastBowlerId,
  onSelectBowler,
}) => {
  const currentInnings = match.innings?.find(
    (i) => i.inningsNumber === match.currentInningsNumber
  );
  const { fieldingSquad } = getTeamBattingAndBowling(match);

  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');

  const currentBowlerId = getId(currentInnings?.currentBowler);

  const handleConfirm = () => {
    if (!selectedBowlerId) return;
    onSelectBowler(selectedBowlerId);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>🎳 Assign Active Bowler</Text>
              <Text style={styles.modalSubtitle}>Select bowler for the upcoming over / spell</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>BOWLING SQUAD ROSTER</Text>
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {fieldingSquad.map((player) => {
              const pid = getId(player);
              const pObj = typeof player === 'object' ? (player as Player) : null;
              const isLastBowler = lastBowlerId === pid;
              const isCurrent = currentBowlerId === pid;
              const isSelected = selectedBowlerId === pid;

              const bowlerStat = (currentInnings?.bowlerStats || []).find(
                (b) => getId(b.player) === pid
              );

              return (
                <TouchableOpacity
                  key={pid}
                  style={[
                    styles.playerItem,
                    isSelected && styles.playerItemActive,
                    isCurrent && !isSelected && styles.playerItemCurrent,
                  ]}
                  onPress={() => setSelectedBowlerId(pid)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerItemLeft}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelected && { backgroundColor: '#d97706' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="cricket"
                        size={16}
                        color={isSelected ? '#fff' : '#fbbf24'}
                      />
                    </View>
                    <View>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.playerName,
                            isSelected && styles.playerNameActive,
                          ]}
                        >
                          {pObj?.name || 'Player'}
                        </Text>
                        {isLastBowler && (
                          <Text style={styles.lastBowlerBadge}>Last Over</Text>
                        )}
                        {isCurrent && (
                          <Text style={styles.currentBowlerBadge}>Active</Text>
                        )}
                      </View>
                      <Text style={styles.playerMeta}>
                        {pObj?.bowlingStyle || 'Bowler'} • {pObj?.role || 'All-Rounder'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.playerItemRight}>
                    {bowlerStat ? (
                      <View style={styles.statsBox}>
                        <Text style={styles.statsWicketsRuns}>
                          {bowlerStat.wickets}-{bowlerStat.runsConceded}
                        </Text>
                        <Text style={styles.statsOvers}>
                          {formatOvers(bowlerStat.overs)} ov
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.yetToBowlText}>Yet to bowl</Text>
                    )}
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? '#fbbf24' : '#64748b'}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedBowlerId && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selectedBowlerId}
            >
              <Text style={styles.confirmBtnText}>Assign Bowler</Text>
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
    maxHeight: '85%',
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
  sectionLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 8,
  },
  scrollBody: {
    maxHeight: 280,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerItemActive: {
    backgroundColor: '#27170a',
    borderColor: '#f59e0b',
  },
  playerItemCurrent: {
    backgroundColor: '#1a1f2e',
  },
  playerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  playerNameActive: {
    color: '#fbbf24',
  },
  playerMeta: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  lastBowlerBadge: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentBowlerBadge: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsBox: {
    alignItems: 'flex-end',
  },
  statsWicketsRuns: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statsOvers: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  yetToBowlText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
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
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
