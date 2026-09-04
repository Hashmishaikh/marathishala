import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface KeypadProps {
  onScoreRuns: (runs: number) => void;
  onScoreExtra: (extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye', runningRuns?: number) => void;
  onOpenWicketModal: () => void;
  onOpenExtrasModal: () => void;
  onUndo: () => void;
  onSwapStrike: () => void;
  submitting?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onScoreRuns,
  onScoreExtra,
  onOpenWicketModal,
  onOpenExtrasModal,
  onUndo,
  onSwapStrike,
  submitting = false,
}) => {
  const runButtons = [
    { label: '0', sub: 'Dot', runs: 0, bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400' },
    { label: '1', sub: 'Single', runs: 1, bg: 'bg-sky-950/60', border: 'border-sky-600', text: 'text-sky-400' },
    { label: '2', sub: 'Double', runs: 2, bg: 'bg-sky-950/60', border: 'border-sky-600', text: 'text-sky-400' },
    { label: '3', sub: 'Triple', runs: 3, bg: 'bg-sky-950/60', border: 'border-sky-600', text: 'text-sky-400' },
    { label: '4', sub: 'Boundary', runs: 4, bg: 'bg-blue-950', border: 'border-blue-500', text: 'text-blue-400', special: true },
    { label: '6', sub: 'Sixer', runs: 6, bg: 'bg-purple-950', border: 'border-purple-500', text: 'text-purple-400', special: true },
  ];

  return (
    <View className="bg-[#0b1120] rounded-3xl p-3.5 border border-white/10 gap-3">
      {/* Run Scoring Grid */}
      <View className="flex-row flex-wrap justify-between gap-2">
        {runButtons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            className={`w-[31.5%] h-16 rounded-2xl border-2 items-center justify-center ${btn.bg} ${btn.border} ${
              btn.special ? 'shadow-md shadow-black' : ''
            }`}
            onPress={() => onScoreRuns(btn.runs)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text className={`text-2xl font-black ${btn.text}`}>{btn.label}</Text>
            <Text className="text-[10px] font-bold text-slate-500 uppercase -mt-0.5">{btn.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Extras Quick Row */}
      <View className="flex-row justify-between gap-1.5">
        <TouchableOpacity
          className="flex-1 h-12 rounded-xl bg-amber-950/70 border border-amber-500 items-center justify-center"
          onPress={() => onScoreExtra('Wide', 0)}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-amber-400 font-extrabold text-sm">WD</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">+1 Wide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 h-12 rounded-xl bg-amber-950/70 border border-amber-500 items-center justify-center"
          onPress={() => onScoreExtra('NoBall', 0)}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-amber-400 font-extrabold text-sm">NB</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">+1 NoBall</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 h-12 rounded-xl bg-emerald-950/70 border border-emerald-500 items-center justify-center"
          onPress={() => onScoreExtra('Bye', 1)}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-emerald-400 font-extrabold text-sm">BYE</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">1 Run</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 h-12 rounded-xl bg-emerald-950/70 border border-emerald-500 items-center justify-center"
          onPress={() => onScoreExtra('LegBye', 1)}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-emerald-400 font-extrabold text-sm">LB</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">1 Run</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 h-12 rounded-xl bg-slate-800 border border-slate-600 items-center justify-center"
          onPress={onOpenExtrasModal}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={18} color="#94a3b8" />
          <Text className="text-slate-400 font-bold text-[9px] -mt-0.5">More</Text>
        </TouchableOpacity>
      </View>

      {/* Main Action Bar (Undo, Swap Strike, Wicket) */}
      <View className="flex-row items-center gap-2 mt-0.5">
        <TouchableOpacity
          className="flex-1 h-14 bg-slate-800 rounded-xl border border-slate-700 items-center justify-center flex-row gap-1"
          onPress={onUndo}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-undo-outline" size={20} color="#cbd5e1" />
          <Text className="text-slate-200 text-xs font-bold">Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-[1.2] h-14 bg-sky-950/80 rounded-xl border border-sky-500 items-center justify-center flex-row gap-1"
          onPress={onSwapStrike}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="swap-horizontal-bold" size={20} color="#38bdf8" />
          <Text className="text-sky-400 text-xs font-black">Swap Ends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-[2] h-14 bg-rose-600 rounded-xl border border-rose-400 items-center justify-center flex-row gap-1.5 shadow-lg shadow-rose-950"
          onPress={onOpenWicketModal}
          disabled={submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="target-account" size={22} color="#fff" />
              <Text className="text-white text-sm font-black tracking-wide">OUT / WICKET</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
