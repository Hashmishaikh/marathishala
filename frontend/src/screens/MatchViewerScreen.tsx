import React, { useState, useEffect } from 'react';
import { LiveHeader } from '../components/viewer/LiveHeader';
import { CreaseCard } from '../components/viewer/CreaseCard';
import { OverTimeline } from '../components/viewer/OverTimeline';
import { ScorecardTabs } from '../components/viewer/ScorecardTabs';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { getMatches } from '../services/api';
import { Radio, RefreshCw, Trophy, PlusCircle, Users, ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import type { Match, Team } from '../types';

interface MatchViewerScreenProps {
  selectedMatchId?: string;
  onSelectMatch: (matchId: string) => void;
  onNavigate?: (tab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin') => void;
  isAdminLoggedIn?: boolean;
}

export const MatchViewerScreen: React.FC<MatchViewerScreenProps> = ({
  selectedMatchId,
  onSelectMatch,
  onNavigate,
  isAdminLoggedIn = false
}) => {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [showAllMatchDrawer, setShowAllMatchDrawer] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      const data = await getMatches();
      setAllMatches(data);
      if (!selectedMatchId && data.length > 0) {
        // Prefer live match, or latest
        const live = data.find((m: Match) => m.status === 'Live') || data[0];
        onSelectMatch(live._id);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const { match, deliveries, loading } = useLiveMatch(selectedMatchId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Top Match Bar & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className="text-xl font-black text-white tracking-tight">
              MSCA Match Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time spectator broadcast & live ball-by-ball analysis
          </p>
        </div>

        {/* Fixture Match Dropdown & Match List Drawer Toggle */}
        {allMatches.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAllMatchDrawer(!showAllMatchDrawer)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <span>All Matches ({allMatches.length})</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllMatchDrawer ? 'rotate-180' : ''}`} />
            </button>

            <select
              value={selectedMatchId || ''}
              onChange={(e) => onSelectMatch(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500 max-w-[240px] truncate"
            >
              {allMatches.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} ({m.status})
                </option>
              ))}
            </select>

            <button
              onClick={fetchMatches}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh match list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMatches ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Expandable Match Summary Strip for Spectators */}
      {showAllMatchDrawer && allMatches.length > 0 && (
        <div className="glass-panel p-4 border-sky-500/30 bg-slate-950/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <span className="font-bold text-white uppercase tracking-wider">
              All Match Fixtures & Live Results
            </span>
            <span className="text-slate-400">Click any fixture to view scorecard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allMatches.map((m: any) => {
              const tA = m.teamA?.teamId as Team;
              const tB = m.teamB?.teamId as Team;
              const inn1 = m.innings?.[0];
              const inn2 = m.innings?.[1];
              const isSelected = m._id === selectedMatchId;

              return (
                <div
                  key={m._id}
                  onClick={() => {
                    onSelectMatch(m._id);
                    setShowAllMatchDrawer(false);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-400 truncate max-w-[140px]">{m.title}</span>
                    {m.status === 'Live' ? (
                      <span className="text-[10px] font-bold text-rose-400 flex items-center space-x-1 animate-pulse">
                        <Radio className="w-3 h-3" />
                        <span>LIVE</span>
                      </span>
                    ) : m.status === 'Completed' ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DONE</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>UPCOMING</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-0.5 font-mono">
                    <div className="flex justify-between">
                      <span className="font-sans font-semibold text-white">{tA?.shortCode || tA?.name || 'Team A'}</span>
                      <span>{inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans font-semibold text-white">{tB?.shortCode || tB?.name || 'Team B'}</span>
                      <span>{inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : '-'}</span>
                    </div>
                  </div>

                  {m.result?.margin && (
                    <div className="text-[10px] text-amber-300 font-semibold truncate pt-1 border-t border-white/5">
                      {m.result.winner?.name ? `${m.result.winner.name} won by ${m.result.margin}` : m.result.margin}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loadingMatches ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-sm font-semibold">Connecting to MSCA Match Center...</span>
        </div>
      ) : allMatches.length === 0 ? (
        /* Empty State Screen when 0 matches exist */
        <div className="glass-panel p-10 sm:p-14 text-center space-y-6 max-w-2xl mx-auto border-white/10 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-sky-500/10">
            <span className="text-4xl">🏏</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              NO MATCHES SCHEDULED
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
              No Matches Yet
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              There are currently no live or scheduled matches in the system. Create a new fixture in the Admin console to start scoring and streaming ball-by-ball.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onNavigate && (
              <>
                {isAdminLoggedIn && (
                  <button
                    onClick={() => onNavigate('create')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Match Fixture</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigate('teams')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>View Team Rosters</span>
                </button>
              </>
            )}

            <button
              onClick={fetchMatches}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs border border-white/5 transition-colors flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Again</span>
            </button>
          </div>
        </div>
      ) : loading && !match ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-sm font-semibold">Loading Live Match Scorecard...</span>
        </div>
      ) : match ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main Scorecard Header */}
          <LiveHeader match={match} />

          {/* Active Crease card */}
          {match.status === 'Live' && (
            <CreaseCard match={match} isScorerMode={false} />
          )}

          {/* Color-coded ball strip */}
          <OverTimeline deliveries={deliveries} canEdit={false} />

          {/* Complete Batting & Bowling Scorecards */}
          <ScorecardTabs match={match} />

        </div>
      ) : (
        <div className="glass-panel p-12 text-center space-y-3">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">No Match Selected</h3>
          <p className="text-xs text-slate-400">Select a fixture from the dropdown above to view live scorecard</p>
        </div>
      )}

    </div>
  );
};
