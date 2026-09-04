import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import type { Player, Innings } from '../../types';
import { getId, formatOvers } from '../../utils/helpers';

interface CreaseCardProps {
  currentInnings?: Innings;
  onOpenBatsmanModal: (position: 'striker' | 'nonStriker') => void;
  onOpenBowlerModal: () => void;
  onSwapStrike: () => void;
  isReadOnly?: boolean;
}

export const CreaseCard: React.FC<CreaseCardProps> = ({
  currentInnings,
  onOpenBatsmanModal,
  onOpenBowlerModal,
  onSwapStrike,
  isReadOnly = false,
}) => {
  if (!currentInnings) return null;

  const strikerId = getId(currentInnings.striker);
  const nonStrikerId = getId(currentInnings.nonStriker);
  const currentBowlerId = getId(currentInnings.currentBowler);

  const strikerStat = currentInnings.batsmenStats?.find(
    (b) => getId(b.player) === strikerId && !b.isOut
  );
  const nonStrikerStat = currentInnings.batsmenStats?.find(
    (b) => getId(b.player) === nonStrikerId && !b.isOut
  );
  const bowlerStat = currentInnings.bowlerStats?.find(
    (b) => getId(b.player) === currentBowlerId
  );

  const strikerObj = typeof currentInnings.striker === 'object' ? (currentInnings.striker as Player) : null;
  const nonStrikerObj = typeof currentInnings.nonStriker === 'object' ? (currentInnings.nonStriker as Player) : null;
  const bowlerObj = typeof currentInnings.currentBowler === 'object' ? (currentInnings.currentBowler as Player) : null;

  const calculateSR = (runs = 0, balls = 0) => {
    if (balls === 0) return '0.0';
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEcon = (runs = 0, overs = 0) => {
    const full = Math.floor(overs);
    const balls = Math.round((overs - full) * 10);
    const totalBalls = full * 6 + balls;
    if (totalBalls === 0) return '0.00';
    return ((runs / totalBalls) * 6).toFixed(2);
  };

  return (
    <View className="bg-slate-900 rounded-3xl p-3.5 border border-white/10 gap-2">
      {/* Batting Section Header */}
      <View className="flex-row items-center justify-between mb-0.5">
        <View className="flex-row items-center gap-1.5">
          <FontAwesome5 name="baseball-ball" size={12} color="#38bdf8" />
          <Text className="text-sky-400 text-[11px] font-black tracking-wider">CURRENT BATTERS</Text>
        </View>
        {!isReadOnly && (
          <TouchableOpacity
            className="flex-row items-center gap-1 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-500"
            onPress={onSwapStrike}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={14} color="#38bdf8" />
            <Text className="text-sky-400 text-[10px] font-bold">Swap Ends</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Striker Card */}
      <TouchableOpacity
        className="bg-[#0c2444] rounded-2xl px-3 py-2.5 flex-row items-center justify-between border border-sky-500 shadow-sm"
        onPress={() => !isReadOnly && onOpenBatsmanModal('striker')}
        disabled={isReadOnly}
        activeOpacity={0.8}
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-sky-500 items-center justify-center">
              <Text className="text-xs">🏏</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-black" numberOfLines={1}>
                {strikerObj?.name || (strikerStat?.player as Player)?.name || (strikerId ? 'Striker' : 'Select Striker')}
              </Text>
              <Text className="text-slate-400 text-[10px] font-semibold mt-0.5">
                On Strike {strikerStat?.isOppositeHand ? '• Opposite Hand' : ''}
              </Text>
            </View>
          </View>
        </View>

        {strikerStat ? (
          <View className="items-end">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-sky-400 text-lg font-black">{strikerStat.runs}</Text>
              <Text className="text-slate-400 text-xs font-semibold">({strikerStat.balls})</Text>
            </View>
            <Text className="text-slate-500 text-[10px] font-bold mt-0.5">
              SR {calculateSR(strikerStat.runs, strikerStat.balls)} • 4s:{strikerStat.fours || 0} 6s:{strikerStat.sixes || 0}
            </Text>
          </View>
        ) : (
          !isReadOnly && (
            <View className="flex-row items-center gap-1 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500">
              <Ionicons name="person-add" size={12} color="#38bdf8" />
              <Text className="text-sky-400 text-xs font-bold">Set Batter</Text>
            </View>
          )
        )}
      </TouchableOpacity>

      {/* Non-Striker Card */}
      <TouchableOpacity
        className="bg-slate-800/80 rounded-2xl px-3 py-2.5 flex-row items-center justify-between border border-slate-700"
        onPress={() => !isReadOnly && onOpenBatsmanModal('nonStriker')}
        disabled={isReadOnly}
        activeOpacity={0.8}
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-slate-700 items-center justify-center">
              <Ionicons name="ellipse" size={8} color="#94a3b8" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-bold" numberOfLines={1}>
                {nonStrikerObj?.name || (nonStrikerStat?.player as Player)?.name || (nonStrikerId ? 'Non-Striker' : 'Select Non-Striker')}
              </Text>
              <Text className="text-slate-400 text-[10px] font-semibold mt-0.5">
                Runner {nonStrikerStat?.isOppositeHand ? '• Opposite Hand' : ''}
              </Text>
            </View>
          </View>
        </View>

        {nonStrikerStat ? (
          <View className="items-end">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-white text-lg font-black">{nonStrikerStat.runs}</Text>
              <Text className="text-slate-400 text-xs font-semibold">({nonStrikerStat.balls})</Text>
            </View>
            <Text className="text-slate-500 text-[10px] font-bold mt-0.5">
              SR {calculateSR(nonStrikerStat.runs, nonStrikerStat.balls)} • 4s:{nonStrikerStat.fours || 0} 6s:{nonStrikerStat.sixes || 0}
            </Text>
          </View>
        ) : (
          !isReadOnly && (
            <View className="flex-row items-center gap-1 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500">
              <Ionicons name="person-add" size={12} color="#38bdf8" />
              <Text className="text-sky-400 text-xs font-bold">Set Batter</Text>
            </View>
          )
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="h-px bg-white/5 my-1" />

      {/* Bowler Section Header */}
      <View className="flex-row items-center justify-between mb-0.5">
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="bowling" size={14} color="#f59e0b" />
          <Text className="text-amber-400 text-[11px] font-black tracking-wider">CURRENT BOWLER</Text>
        </View>
        {!isReadOnly && (
          <TouchableOpacity
            className="flex-row items-center gap-1 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500"
            onPress={onOpenBowlerModal}
          >
            <Ionicons name="repeat" size={14} color="#fbbf24" />
            <Text className="text-amber-400 text-[10px] font-bold">Change Bowler</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Bowler Card */}
      <TouchableOpacity
        className="bg-[#27170a] rounded-2xl px-3 py-2.5 flex-row items-center justify-between border border-amber-600 shadow-sm"
        onPress={() => !isReadOnly && onOpenBowlerModal()}
        disabled={isReadOnly}
        activeOpacity={0.8}
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-amber-900 items-center justify-center">
              <MaterialCommunityIcons name="cricket" size={14} color="#fbbf24" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-black" numberOfLines={1}>
                {bowlerObj?.name || (bowlerStat?.player as Player)?.name || (currentBowlerId ? 'Active Bowler' : 'Select Active Bowler')}
              </Text>
              <Text className="text-slate-400 text-[10px] font-semibold mt-0.5">
                {bowlerObj?.bowlingStyle || 'Bowler'}
              </Text>
            </View>
          </View>
        </View>

        {bowlerStat ? (
          <View className="items-end">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-amber-400 text-lg font-black">
                {bowlerStat.wickets}-{bowlerStat.runsConceded}
              </Text>
              <Text className="text-slate-400 text-xs font-semibold">({formatOvers(bowlerStat.overs)} ov)</Text>
            </View>
            <Text className="text-slate-500 text-[10px] font-bold mt-0.5">
              Econ {calculateEcon(bowlerStat.runsConceded, bowlerStat.overs)} • M:{bowlerStat.maidens || 0}
            </Text>
          </View>
        ) : (
          !isReadOnly && (
            <View className="flex-row items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500">
              <Ionicons name="person-add" size={12} color="#fbbf24" />
              <Text className="text-amber-400 text-xs font-bold">Assign Bowler</Text>
            </View>
          )
        )}
      </TouchableOpacity>
    </View>
  );
};
