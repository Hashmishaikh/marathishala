import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { Delivery } from '../../types';

interface OverTimelineProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
}

export const OverTimeline: React.FC<OverTimelineProps> = ({
  deliveries,
  onSelectDelivery,
}) => {
  if (!deliveries || deliveries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No deliveries yet in this innings</Text>
      </View>
    );
  }

  // Group deliveries into overs
  const oversMap = new Map<number, Delivery[]>();
  deliveries.forEach((d) => {
    const over = d.overNumber || 0;
    if (!oversMap.has(over)) {
      oversMap.set(over, []);
    }
    oversMap.get(over)!.push(d);
  });

  const getBallBadgeStyle = (d: Delivery) => {
    if (d.isWicket) {
      return { bg: '#e11d48', border: '#f43f5e', text: '#fff' };
    }
    if (d.runsOffBat === 6) {
      return { bg: '#7c3aed', border: '#a855f7', text: '#fff' };
    }
    if (d.runsOffBat === 4) {
      return { bg: '#0284c7', border: '#38bdf8', text: '#fff' };
    }
    if (d.extraType === 'Wide' || d.extraType === 'NoBall') {
      return { bg: '#b45309', border: '#f59e0b', text: '#fff' };
    }
    if (d.extraType === 'Bye' || d.extraType === 'LegBye') {
      return { bg: '#047857', border: '#10b981', text: '#fff' };
    }
    if (d.runsOffBat === 0) {
      return { bg: '#1e293b', border: '#334155', text: '#94a3b8' };
    }
    return { bg: '#0f2744', border: '#0284c7', text: '#38bdf8' };
  };

  const getBallText = (d: Delivery) => {
    if (d.isWicket) return 'W';
    if (d.extraType === 'Wide') {
      const extra = (d.penaltyExtraRuns || 1) + (d.runningExtraRuns || 0);
      return extra > 1 ? `${extra}Wd` : 'Wd';
    }
    if (d.extraType === 'NoBall') {
      const runs = (d.runsOffBat || 0) + (d.penaltyExtraRuns || 1) + (d.runningExtraRuns || 0);
      return runs > 1 ? `${runs}Nb` : 'Nb';
    }
    if (d.extraType === 'Bye') return `${d.runningExtraRuns || 1}B`;
    if (d.extraType === 'LegBye') return `${d.runningExtraRuns || 1}LB`;
    return `${d.runsOffBat || 0}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>THIS OVER / TIMELINE</Text>
        <Text style={styles.totalBallsText}>{deliveries.length} balls bowled</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {Array.from(oversMap.entries())
          .slice(-4) // show recent 4 overs
          .map(([overNum, overDeliveries]) => {
            const overRuns = overDeliveries.reduce((sum, d) => {
              return sum + (d.runsOffBat || 0) + (d.penaltyExtraRuns || 0) + (d.runningExtraRuns || 0);
            }, 0);

            return (
              <View key={overNum} style={styles.overGroup}>
                <View style={styles.overGroupHeader}>
                  <Text style={styles.overGroupLabel}>Over {overNum + 1}</Text>
                  <Text style={styles.overGroupRuns}>{overRuns} runs</Text>
                </View>
                <View style={styles.ballsRow}>
                  {overDeliveries.map((d) => {
                    const badge = getBallBadgeStyle(d);
                    return (
                      <TouchableOpacity
                        key={d._id}
                        style={[
                          styles.ballPill,
                          { backgroundColor: badge.bg, borderColor: badge.border },
                        ]}
                        onPress={() => onSelectDelivery && onSelectDelivery(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.ballPillText, { color: badge.text }]}>
                          {getBallText(d)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0b1120',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalBallsText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  overGroup: {
    backgroundColor: '#131d31',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  overGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  overGroupLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  overGroupRuns: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  ballsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ballPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
