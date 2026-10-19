import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface KeypadProps {
  onScoreRuns: (runs: number) => void;
  onScoreExtra: (extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye', runningRuns?: number, runsOffBat?: number) => void;
  onOpenWicketModal: () => void;
  onOpenExtrasModal: () => void;
  onUndo: () => void;
  onSwapStrike: () => void;
  submitting?: boolean;
  widePenaltyRuns?: number;
  noBallPenaltyRuns?: number;
}

export const Keypad: React.FC<KeypadProps> = ({
  onScoreRuns,
  onScoreExtra,
  onOpenWicketModal,
  onOpenExtrasModal,
  onUndo,
  onSwapStrike,
  submitting = false,
  widePenaltyRuns = 1,
  noBallPenaltyRuns = 1,
}) => {
  const [activeExtraModal, setActiveExtraModal] = useState<'Wide' | 'NoBall' | 'Bye' | 'LegBye' | null>(null);

  const handleExtraClick = (type: 'Wide' | 'NoBall' | 'Bye' | 'LegBye') => {
    setActiveExtraModal((prev) => (prev === type ? null : type));
  };

  const handleSelectRuns = (runs: number) => {
    if (!activeExtraModal) return;
    if (activeExtraModal === 'Wide') {
      onScoreExtra('Wide', runs, 0);
    } else if (activeExtraModal === 'NoBall') {
      // For NoBall, runs could be runs off bat (like web app)
      onScoreExtra('NoBall', 0, runs);
    } else if (activeExtraModal === 'Bye') {
      onScoreExtra('Bye', runs, 0);
    } else if (activeExtraModal === 'LegBye') {
      onScoreExtra('LegBye', runs, 0);
    }
    setActiveExtraModal(null);
  };

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
          className={`flex-1 h-12 rounded-xl items-center justify-center border ${
            activeExtraModal === 'Wide'
              ? 'bg-amber-600/40 border-amber-400'
              : 'bg-amber-950/70 border-amber-500'
          }`}
          onPress={() => handleExtraClick('Wide')}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-amber-400 font-extrabold text-sm">WD</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">+{widePenaltyRuns} Wide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 h-12 rounded-xl items-center justify-center border ${
            activeExtraModal === 'NoBall'
              ? 'bg-yellow-600/40 border-yellow-400'
              : 'bg-yellow-950/70 border-yellow-500'
          }`}
          onPress={() => handleExtraClick('NoBall')}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-yellow-400 font-extrabold text-sm">NB</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">+{noBallPenaltyRuns} NoBall</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 h-12 rounded-xl items-center justify-center border ${
            activeExtraModal === 'Bye'
              ? 'bg-emerald-600/40 border-emerald-400'
              : 'bg-emerald-950/70 border-emerald-500'
          }`}
          onPress={() => handleExtraClick('Bye')}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-emerald-400 font-extrabold text-sm">BYE</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">Extra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 h-12 rounded-xl items-center justify-center border ${
            activeExtraModal === 'LegBye'
              ? 'bg-indigo-600/40 border-indigo-400'
              : 'bg-indigo-950/70 border-indigo-500'
          }`}
          onPress={() => handleExtraClick('LegBye')}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text className="text-indigo-400 font-extrabold text-sm">LB</Text>
          <Text className="text-slate-300 font-bold text-[9px] -mt-0.5">Extra</Text>
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

      {/* Extra Runs Quick Selector Modal/Overlay matching Web App */}
      {activeExtraModal && (
        <View className="p-3 bg-slate-900 border border-amber-400/40 rounded-2xl gap-2">
          <View className="flex-row items-center justify-between pb-1.5 border-b border-white/10">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <Ionicons
                name={activeExtraModal === 'Wide' ? 'warning' : 'flash'}
                size={14}
                color={activeExtraModal === 'Wide' ? '#f59e0b' : '#eab308'}
              />
              <Text className="text-xs font-bold text-amber-300 flex-1" numberOfLines={1}>
                {activeExtraModal === 'Wide' && `Wide (+${widePenaltyRuns} Penalty) + Additional Runs`}
                {activeExtraModal === 'NoBall' && `No-Ball (+${noBallPenaltyRuns} Penalty) + Runs Off Bat`}
                {activeExtraModal === 'Bye' && 'Byes Conceded'}
                {activeExtraModal === 'LegBye' && 'Leg-Byes Conceded'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveExtraModal(null)}
              className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700"
              activeOpacity={0.7}
            >
              <Text className="text-slate-400 font-bold text-[11px]">✕ Cancel</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between gap-1.5">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <TouchableOpacity
                key={r}
                className="flex-1 h-11 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center active:bg-sky-600"
                onPress={() => handleSelectRuns(r)}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text className="text-white font-mono font-black text-sm">+{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
