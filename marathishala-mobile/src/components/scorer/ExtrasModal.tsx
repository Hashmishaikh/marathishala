import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExtra: (extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye', runningRuns?: number, runsOffBat?: number) => void;
}

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  isOpen,
  onClose,
  onConfirmExtra,
}) => {
  const [selectedExtra, setSelectedExtra] = useState<'Wide' | 'NoBall' | 'Bye' | 'LegBye'>('Wide');
  const [runningRuns, setRunningRuns] = useState<number>(0);
  const [runsOffBat, setRunsOffBat] = useState<number>(0);

  const handleConfirm = () => {
    onConfirmExtra(selectedExtra, runningRuns, runsOffBat);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>⚡ Extended Extras Console</Text>
              <Text style={styles.modalSubtitle}>Configure runs, penalty extras & boundaries</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Extra Type Picker */}
          <Text style={styles.sectionLabel}>EXTRA CATEGORY</Text>
          <View style={styles.tabRow}>
            {(['Wide', 'NoBall', 'Bye', 'LegBye'] as const).map((type) => {
              const isSelected = selectedExtra === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                  onPress={() => setSelectedExtra(type)}
                >
                  <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Runs Scored off Bat (for No Ball) */}
          {selectedExtra === 'NoBall' && (
            <>
              <Text style={styles.sectionLabel}>RUNS OFF BAT (HIT BY BATTER)</Text>
              <View style={styles.numRow}>
                {[0, 1, 2, 3, 4, 6].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.numBtn, runsOffBat === num && styles.numBtnActive]}
                    onPress={() => setRunsOffBat(num)}
                  >
                    <Text style={[styles.numText, runsOffBat === num && styles.numTextActive]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Additional Running / Overthrow Runs */}
          <Text style={styles.sectionLabel}>
            {selectedExtra === 'Wide' ? 'ADDITIONAL RUNS (BYES / OVERTHROW)' : 'RUNS RUN BETWEEN WICKETS'}
          </Text>
          <View style={styles.numRow}>
            {[0, 1, 2, 3, 4].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.numBtn, runningRuns === num && styles.numBtnActive]}
                onPress={() => setRunningRuns(num)}
              >
                <Text style={[styles.numText, runningRuns === num && styles.numTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total Delivery Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Delivery Impact:</Text>
            <Text style={styles.summaryValue}>
              {selectedExtra} + {runsOffBat + runningRuns} runs
            </Text>
          </View>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Apply Extra</Text>
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
    marginTop: 10,
    marginBottom: 6,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#fbbf24',
  },
  numRow: {
    flexDirection: 'row',
    gap: 6,
  },
  numBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  numBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  numText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
  },
  numTextActive: {
    color: '#ffffff',
  },
  summaryBox: {
    backgroundColor: '#162032',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '900',
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
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
