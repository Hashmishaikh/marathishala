import React, { useState, useEffect } from 'react';
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
import { getId, getTeamBattingAndBowling } from '../../utils/helpers';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onConfirmWicket: (wicketPayload: any) => void;
}

const DISMISSAL_TYPES = [
  'Bowled',
  'Caught',
  'Caught Behind',
  'Caught & Bowled',
  'LBW',
  'Stumped',
  'Run Out',
  'Hit Wicket',
  'Retired',
] as const;

export const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  onClose,
  match,
  onConfirmWicket,
}) => {
  const currentInnings = match.innings?.find(
    (i) => i.inningsNumber === match.currentInningsNumber
  );
  const { fieldingSquad } = getTeamBattingAndBowling(match);

  const striker = typeof currentInnings?.striker === 'object' ? (currentInnings.striker as Player) : null;
  const nonStriker = typeof currentInnings?.nonStriker === 'object' ? (currentInnings.nonStriker as Player) : null;
  const bowler = typeof currentInnings?.currentBowler === 'object' ? (currentInnings.currentBowler as Player) : null;

  const [dismissalType, setDismissalType] = useState<typeof DISMISSAL_TYPES[number]>('Bowled');
  const [playerOutId, setPlayerOutId] = useState<string>('');
  const [primaryFielderId, setPrimaryFielderId] = useState<string>('');
  const [assistedById, setAssistedById] = useState<string>('');
  const [runsCompleted, setRunsCompleted] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setPlayerOutId(getId(currentInnings?.striker));
      setDismissalType('Bowled');
      setPrimaryFielderId('');
      setAssistedById('');
      setRunsCompleted(0);
    }
  }, [isOpen, currentInnings?.striker]);

  const needsFielder = ['Caught', 'Caught Behind', 'Stumped', 'Run Out'].includes(dismissalType);
  const needsAssistantFielder = dismissalType === 'Run Out';
  const bowlerGetsCredit = !['Run Out', 'Retired'].includes(dismissalType);

  const handleConfirm = () => {
    const finalPlayerOut = playerOutId || getId(currentInnings?.striker);

    onConfirmWicket({
      runsOffBat: runsCompleted,
      extraType: 'None',
      runningExtraRuns: 0,
      isWicket: true,
      wicket: {
        dismissalType,
        playerOut: finalPlayerOut,
        bowlerCredit: bowlerGetsCredit,
        primaryFielder: needsFielder && primaryFielderId ? primaryFielderId : null,
        assistedBy: needsAssistantFielder && assistedById ? assistedById : null,
      },
    });
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>🚨 Record Wicket</Text>
              <Text style={styles.modalSubtitle}>
                Innings #{match.currentInningsNumber} • Total: {currentInnings?.wickets || 0}/
                {currentInnings?.maxWicketsForInnings || 10}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Dismissal Method */}
            <Text style={styles.sectionLabel}>DISMISSAL METHOD</Text>
            <View style={styles.typesGrid}>
              {DISMISSAL_TYPES.map((type) => {
                const isSelected = dismissalType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                    onPress={() => {
                      setDismissalType(type);
                      if (type === 'Caught & Bowled' && bowler) {
                        setPrimaryFielderId(getId(bowler));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Who is Out? */}
            <Text style={styles.sectionLabel}>WHO IS OUT?</Text>
            <View style={styles.outRow}>
              <TouchableOpacity
                style={[
                  styles.outBtn,
                  (!playerOutId || playerOutId === getId(currentInnings?.striker)) && styles.outBtnActive,
                ]}
                onPress={() => setPlayerOutId(getId(currentInnings?.striker))}
                activeOpacity={0.7}
              >
                <Text style={styles.outBtnRole}>STRIKER</Text>
                <Text style={styles.outBtnName} numberOfLines={1}>
                  {striker?.name || 'Striker'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.outBtn,
                  playerOutId === getId(currentInnings?.nonStriker) && styles.outBtnActive,
                ]}
                onPress={() => setPlayerOutId(getId(currentInnings?.nonStriker))}
                activeOpacity={0.7}
              >
                <Text style={styles.outBtnRole}>NON-STRIKER</Text>
                <Text style={styles.outBtnName} numberOfLines={1}>
                  {nonStriker?.name || 'Non-Striker'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fielder Selection */}
            {needsFielder && (
              <>
                <Text style={styles.sectionLabel}>
                  {dismissalType === 'Caught Behind' || dismissalType === 'Stumped'
                    ? 'WICKET-KEEPER / CATCHER'
                    : 'PRIMARY FIELDER / CATCHER'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fielderScroll}>
                  {fieldingSquad.map((p) => {
                    const pid = getId(p);
                    const isSelected = primaryFielderId === pid;
                    const pObj = typeof p === 'object' ? (p as Player) : null;
                    return (
                      <TouchableOpacity
                        key={pid}
                        style={[styles.fielderPill, isSelected && styles.fielderPillActive]}
                        onPress={() => setPrimaryFielderId(isSelected ? '' : pid)}
                      >
                        <Text style={[styles.fielderPillText, isSelected && styles.fielderPillTextActive]}>
                          {pObj?.name || 'Player'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Assistant Fielder for Run Out */}
            {needsAssistantFielder && (
              <>
                <Text style={styles.sectionLabel}>ASSISTED BY (THROWER / RELAY)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fielderScroll}>
                  {fieldingSquad.map((p) => {
                    const pid = getId(p);
                    const isSelected = assistedById === pid;
                    const pObj = typeof p === 'object' ? (p as Player) : null;
                    return (
                      <TouchableOpacity
                        key={pid}
                        style={[styles.fielderPill, isSelected && styles.fielderPillActive]}
                        onPress={() => setAssistedById(isSelected ? '' : pid)}
                      >
                        <Text style={[styles.fielderPillText, isSelected && styles.fielderPillTextActive]}>
                          {pObj?.name || 'Player'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Runs Completed */}
            <Text style={styles.sectionLabel}>RUNS COMPLETED BEFORE DISMISSAL</Text>
            <View style={styles.runsRow}>
              {[0, 1, 2, 3].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.runOptionBtn, runsCompleted === r && styles.runOptionBtnActive]}
                  onPress={() => setRunsCompleted(r)}
                >
                  <Text style={[styles.runOptionText, runsCompleted === r && styles.runOptionTextActive]}>
                    {r} {r === 1 ? 'Run' : 'Runs'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bowler Credit */}
            <View style={styles.creditBox}>
              <Text style={styles.creditLabel}>Bowler Credit:</Text>
              <Text style={[styles.creditValue, { color: bowlerGetsCredit ? '#34d399' : '#94a3b8' }]}>
                {bowlerGetsCredit ? `✅ ${bowler?.name || 'Bowler'} gets wicket` : '❌ No bowler credit'}
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm Wicket</Text>
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
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBtn: {
    width: '31.5%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#881337',
    borderColor: '#f43f5e',
  },
  typeBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  outRow: {
    flexDirection: 'row',
    gap: 8,
  },
  outBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  outBtnActive: {
    backgroundColor: '#0c2444',
    borderColor: '#0284c7',
  },
  outBtnRole: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  outBtnName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  fielderScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fielderPill: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fielderPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  fielderPillText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  fielderPillTextActive: {
    color: '#ffffff',
  },
  runsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  runOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  runOptionBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  runOptionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  runOptionTextActive: {
    color: '#ffffff',
  },
  creditBox: {
    backgroundColor: '#162032',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  creditLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  creditValue: {
    fontSize: 11,
    fontWeight: '800',
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
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
