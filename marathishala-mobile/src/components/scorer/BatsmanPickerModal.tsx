import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import type { Player, Match } from '../../types';
import { getId, getTeamBattingAndBowling } from '../../utils/helpers';

interface BatsmanPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  position: 'striker' | 'nonStriker';
  onSelectBatsman: (payload: {
    playerId: string;
    position?: 'striker' | 'nonStriker';
    isOppositeHand?: boolean;
    inningsAttempt?: number;
  }) => void;
}

export const BatsmanPickerModal: React.FC<BatsmanPickerModalProps> = ({
  isOpen,
  onClose,
  match,
  position,
  onSelectBatsman,
}) => {
  const currentInnings = match.innings?.find(
    (i) => i.inningsNumber === match.currentInningsNumber
  );
  const { battingSquad } = getTeamBattingAndBowling(match);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [isOppositeHand, setIsOppositeHand] = useState<boolean>(false);

  const strikerId = getId(currentInnings?.striker);
  const nonStrikerId = getId(currentInnings?.nonStriker);
  const allowDoubleBatting = match.customRules?.allowDoubleBatting || false;

  const handleConfirm = () => {
    if (!selectedPlayerId) return;

    // Calculate innings attempt if double batting
    const previousAttempts = (currentInnings?.batsmenStats || []).filter(
      (b) => getId(b.player) === selectedPlayerId
    ).length;

    onSelectBatsman({
      playerId: selectedPlayerId,
      position,
      isOppositeHand,
      inningsAttempt: previousAttempts + 1,
    });
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                🏏 Select {position === 'striker' ? 'Striker' : 'Non-Striker'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Choose next incoming batter from batting roster
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Opposite Hand Rule Toggle (if enabled) */}
          {match.customRules?.oppositeHandRule && (
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <FontAwesome5 name="hand-paper" size={14} color="#38bdf8" />
                <View>
                  <Text style={styles.optionTitle}>Opposite Hand Batting</Text>
                  <Text style={styles.optionSubtitle}>Player required to bat with opposite stance</Text>
                </View>
              </View>
              <Switch
                value={isOppositeHand}
                onValueChange={setIsOppositeHand}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={isOppositeHand ? '#38bdf8' : '#94a3b8'}
              />
            </View>
          )}

          {/* Players List */}
          <Text style={styles.sectionLabel}>AVAILABLE BATTERS</Text>
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {battingSquad.map((player) => {
              const pid = getId(player);
              const pObj = typeof player === 'object' ? (player as Player) : null;
              const isCurrentlyBatting = pid === strikerId || pid === nonStrikerId;
              const playerStats = (currentInnings?.batsmenStats || []).filter(
                (b) => getId(b.player) === pid
              );
              const isDismissed = playerStats.some((b) => b.isOut);
              const isDisabled = isCurrentlyBatting || (isDismissed && !allowDoubleBatting);
              const isSelected = selectedPlayerId === pid;

              return (
                <TouchableOpacity
                  key={pid}
                  style={[
                    styles.playerItem,
                    isSelected && styles.playerItemActive,
                    isDisabled && styles.playerItemDisabled,
                  ]}
                  onPress={() => !isDisabled && setSelectedPlayerId(pid)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerItemLeft}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelected && { backgroundColor: '#0284c7' },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {pObj?.name ? pObj.name.charAt(0).toUpperCase() : 'B'}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.playerName,
                          isSelected && styles.playerNameActive,
                          isDisabled && styles.playerNameDisabled,
                        ]}
                      >
                        {pObj?.name || 'Player'}
                      </Text>
                      <Text style={styles.playerMeta}>
                        {pObj?.role || 'Batter'} • {pObj?.battingStyle || 'Right-hand'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.playerItemRight}>
                    {isCurrentlyBatting && (
                      <Text style={styles.statusBadgeCrease}>At Crease</Text>
                    )}
                    {isDismissed && !isCurrentlyBatting && (
                      <Text style={styles.statusBadgeOut}>
                        Out ({playerStats[playerStats.length - 1]?.runs || 0}r)
                      </Text>
                    )}
                    {!isDisabled && (
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? '#38bdf8' : '#64748b'}
                      />
                    )}
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
              style={[styles.confirmBtn, !selectedPlayerId && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selectedPlayerId}
            >
              <Text style={styles.confirmBtnText}>Set as {position === 'striker' ? 'Striker' : 'Non-Striker'}</Text>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162032',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
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
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  playerItemDisabled: {
    opacity: 0.4,
  },
  playerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  playerNameActive: {
    color: '#38bdf8',
  },
  playerNameDisabled: {
    color: '#94a3b8',
  },
  playerMeta: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  playerItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadgeCrease: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeOut: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    backgroundColor: '#0284c7',
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
