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
import { Ionicons } from '@expo/vector-icons';
import type { Match, CustomRules } from '../../types';

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onUpdateRules: (rules: CustomRules) => Promise<void>;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({
  isOpen,
  onClose,
  match,
  onUpdateRules,
}) => {
  const [rules, setRules] = useState<CustomRules>(
    match.customRules || {
      widePenaltyRuns: 1,
      noBallPenaltyRuns: 1,
      allOutThresholdType: 'AllPlayersOut',
      allowDoubleBatting: false,
      oppositeHandRule: false,
      lastManStandsAlone: false,
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdateRules(rules);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>⚙️ Gully Match Rules</Text>
              <Text style={styles.modalSubtitle}>Custom rules & penalty point system</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Wide Penalty Runs */}
            <Text style={styles.sectionLabel}>WIDE BALL PENALTY RUNS</Text>
            <View style={styles.rowChoices}>
              {[0, 1, 2].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.choiceBtn, rules.widePenaltyRuns === r && styles.choiceBtnActive]}
                  onPress={() => setRules({ ...rules, widePenaltyRuns: r })}
                >
                  <Text style={[styles.choiceBtnText, rules.widePenaltyRuns === r && styles.choiceBtnTextActive]}>
                    +{r} Runs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* No-Ball Penalty Runs */}
            <Text style={styles.sectionLabel}>NO-BALL PENALTY RUNS</Text>
            <View style={styles.rowChoices}>
              {[0, 1, 2].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.choiceBtn, rules.noBallPenaltyRuns === r && styles.choiceBtnActive]}
                  onPress={() => setRules({ ...rules, noBallPenaltyRuns: r })}
                >
                  <Text style={[styles.choiceBtnText, rules.noBallPenaltyRuns === r && styles.choiceBtnTextActive]}>
                    +{r} Runs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Double Batting Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Allow Double Batting</Text>
                <Text style={styles.toggleSub}>Dismissed batters can re-enter when wickets fall</Text>
              </View>
              <Switch
                value={rules.allowDoubleBatting}
                onValueChange={(val) => setRules({ ...rules, allowDoubleBatting: val })}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={rules.allowDoubleBatting ? '#38bdf8' : '#94a3b8'}
              />
            </View>

            {/* Opposite Hand Rule */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Opposite Hand Rule</Text>
                <Text style={styles.toggleSub}>Batters can switch to opposite batting stance</Text>
              </View>
              <Switch
                value={rules.oppositeHandRule}
                onValueChange={(val) => setRules({ ...rules, oppositeHandRule: val })}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={rules.oppositeHandRule ? '#38bdf8' : '#94a3b8'}
              />
            </View>

            {/* Last Man Stands Alone */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Last Man Stands Alone</Text>
                <Text style={styles.toggleSub}>Single batter can continue alone after last wicket</Text>
              </View>
              <Switch
                value={rules.lastManStandsAlone}
                onValueChange={(val) => setRules({ ...rules, lastManStandsAlone: val })}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={rules.lastManStandsAlone ? '#38bdf8' : '#94a3b8'}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.confirmBtnText}>{saving ? 'Saving...' : 'Save Rules'}</Text>
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
  rowChoices: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: '700',
  },
  choiceBtnTextActive: {
    color: '#38bdf8',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#162032',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
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
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
