import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface HeaderProps {
  activeMatchTitle?: string;
  isLive?: boolean;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenConnectionModal: () => void;
  onOpenMatchPicker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMatchTitle,
  isLive,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenConnectionModal,
  onOpenMatchPicker,
}) => {
  return (
    <View style={styles.container} className="bg-[#080d1a] px-4 pt-3 pb-2 border-b border-white/10">
      {/* Top Main Row */}
      <View style={styles.topRow} className="flex-row items-center justify-between">
        {/* Brand & Badge */}
        <View style={styles.brandRow} className="flex-row items-center gap-2">
          <Text style={styles.brandLogo} className="text-white text-lg font-black tracking-wide">
            🏏 MSCA
          </Text>
          <View style={styles.badgePro} className="bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500">
            <Text style={styles.badgeProText} className="text-sky-400 text-[10px] font-black tracking-wider">
              GULLY PRO
            </Text>
          </View>
        </View>

        {/* Action Buttons Right */}
        <View style={styles.actionsRow} className="flex-row items-center gap-2">
          {/* Server Connection Settings Button (Dev mode only) */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.iconBtn}
              className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center border border-slate-700"
              onPress={onOpenConnectionModal}
              activeOpacity={0.7}
            >
              <Ionicons name="wifi-outline" size={18} color="#38bdf8" />
            </TouchableOpacity>
          )}

          {/* Admin Lock / Unlock Status Button */}
          {isAdminLoggedIn ? (
            <TouchableOpacity
              style={styles.adminUnlockedBtn}
              className="flex-row items-center gap-1.5 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500"
              onPress={onLogoutAdmin}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="shield-check" size={16} color="#10b981" />
              <Text style={styles.adminUnlockedText} className="text-emerald-400 text-xs font-black">
                Admin
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              className="flex-row items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
              onPress={onOpenAdminLogin}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="shield-lock-outline" size={16} color="#94a3b8" />
              <Text style={styles.adminLoginText} className="text-slate-300 text-xs font-bold">
                Admin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Match Banner Bar */}
      {activeMatchTitle ? (
        <TouchableOpacity
          style={styles.matchBar}
          className="flex-row items-center justify-between bg-[#0f172a] mt-2 px-3 py-2 rounded-xl border border-white/10"
          onPress={onOpenMatchPicker}
          activeOpacity={0.8}
        >
          <View style={styles.matchBarLeft} className="flex-row items-center gap-2 flex-1 mr-2">
            {isLive ? (
              <View style={styles.liveBadge} className="flex-row items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500">
                <View style={styles.liveDot} className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <Text style={styles.liveText} className="text-red-500 text-[10px] font-black">
                  LIVE
                </Text>
              </View>
            ) : (
              <View style={styles.matchIconBox} className="w-5 h-5 rounded bg-slate-800 items-center justify-center">
                <Text style={{ fontSize: 10 }}>⚡</Text>
              </View>
            )}
            <Text style={styles.matchTitle} className="text-slate-200 text-xs font-bold flex-1" numberOfLines={1}>
              {activeMatchTitle}
            </Text>
          </View>
          {onOpenMatchPicker && (
            <View style={styles.switchPill} className="flex-row items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md">
              <Text style={styles.switchText} className="text-sky-400 text-[10px] font-bold">Switch</Text>
              <Ionicons name="chevron-down" size={12} color="#38bdf8" />
            </View>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080d1a',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badgePro: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  badgeProText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminUnlockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  adminUnlockedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
  },
  adminLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminLoginText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  matchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  matchBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
  },
  matchIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  switchText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
});
