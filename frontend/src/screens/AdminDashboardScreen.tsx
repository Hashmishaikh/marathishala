import { useState, useEffect } from 'react';
import { getMatches, getTeams, getPlayers, getSeriesList } from '../services/api';
import { 
  Activity, 
  PlusCircle, 
  Trophy, 
  Users, 
  Radio, 
  LogOut, 
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Eye,
  Settings2
} from 'lucide-react';
import type { Match, Team, Player, Series } from '../types';

interface AdminDashboardScreenProps {
  onNavigate: (tab: 'scorer' | 'viewer' | 'series' | 'teams' | 'create') => void;
  onSelectMatch: (matchId: string) => void;
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onNavigate,
  onSelectMatch,
  onLogout
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchFilter, setMatchFilter] = useState<'active' | 'completed' | 'all'>('active');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [mData, tData, pData, sData] = await Promise.all([
        getMatches(),
        getTeams(),
        getPlayers(),
        getSeriesList()
      ]);
      setMatches(mData);
      setTeams(tData);
      setPlayers(pData);
      setSeriesList(sData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const liveMatches = matches.filter(m => m.status === 'Live' || m.status === 'Innings Break');
  const upcomingMatches = matches.filter(m => m.status === 'Upcoming' || !m.status);
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const activeAndUpcoming = [...liveMatches, ...upcomingMatches];

  const displayedMatches = matchFilter === 'active' 
    ? activeAndUpcoming 
    : matchFilter === 'completed' 
    ? completedMatches 
    : matches;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-12">
      
      {/* Admin Header Banner */}
      <div className="glass-panel p-5 sm:p-6 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl font-bold shadow-lg shadow-amber-500/20">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MSCA Admin & Scorer Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AUTHORIZED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Umpire scoring controls, fixture creation & tournament operations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Live Matches
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400 flex items-center justify-center space-x-1.5">
            {liveMatches.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>}
            <span>{liveMatches.length}</span>
          </span>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Upcoming Fixtures
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {upcomingMatches.length}
          </span>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Completed Matches
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {completedMatches.length}
          </span>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Clubs / Teams
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-400">
            {teams.length}
          </span>
        </div>

        <div className="glass-panel p-4 text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Tournaments
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
            {seriesList.length}
          </span>
        </div>
      </div>

      {/* Core Action Command Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Touch Scorer */}
        <div 
          onClick={() => onNavigate('scorer')}
          className="glass-panel-interactive p-5 space-y-3 cursor-pointer border-sky-500/30 hover:border-sky-400 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white group-hover:text-sky-300 transition-colors">
              Touch Scorer Console
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Real-time delivery keypad, wide/no-ball extras, double batting & undo controls.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-sky-400 pt-1">
            <span>Open Scorer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Create Match */}
        <div 
          onClick={() => onNavigate('create')}
          className="glass-panel-interactive p-5 space-y-3 cursor-pointer border-orange-500/30 hover:border-orange-400 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white group-hover:text-orange-300 transition-colors">
              Create New Fixture
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Dynamic squads (3v3 to 11v11, 5 vs 6), custom gully rules & all-out limits.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-orange-400 pt-1">
            <span>Configure Match</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. Tournaments */}
        <div 
          onClick={() => onNavigate('series')}
          className="glass-panel-interactive p-5 space-y-3 cursor-pointer border-amber-500/30 hover:border-amber-400 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white group-hover:text-amber-300 transition-colors">
              Tournaments & NRR
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Manage MSCA Trophy cups, Net Run Rate standings, and Orange/Purple caps.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 pt-1">
            <span>Manage Cups</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Roster & Players */}
        <div 
          onClick={() => onNavigate('teams')}
          className="glass-panel-interactive p-5 space-y-3 cursor-pointer border-emerald-500/30 hover:border-emerald-400 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white group-hover:text-emerald-300 transition-colors">
              Roster & Player Pool
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Register teams, add global players ({players.length} in pool), and synchronize stats.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-emerald-400 pt-1">
            <span>Manage Roster</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Match Fixture Management Section */}
      <div className="glass-panel p-5 sm:p-6 space-y-5">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
              <span>🏏 Match Fixture Management</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select active matches to launch scoring console, or review concluded scorecards
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setMatchFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  matchFilter === 'active'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Active & Upcoming ({activeAndUpcoming.length})</span>
              </button>

              <button
                onClick={() => setMatchFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  matchFilter === 'completed'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed ({completedMatches.length})</span>
              </button>

              <button
                onClick={() => setMatchFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  matchFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>All ({matches.length})</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('create')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ New Match</span>
            </button>
          </div>
        </div>

        {/* Matches List / Table View */}
        {displayedMatches.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3 glass-panel p-8 border-white/5">
            <span className="text-4xl block">
              {matchFilter === 'completed' ? '🏆' : '🏏'}
            </span>
            <h4 className="text-base font-bold text-white">
              {matchFilter === 'completed'
                ? 'No Concluded Matches Yet'
                : matchFilter === 'active'
                ? 'No Active or Upcoming Matches'
                : 'No Matches Found in Database'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {matchFilter === 'completed'
                ? 'When live fixtures finish and declare a winner, their concluded records will appear here.'
                : 'Create a new match fixture to start real-time ball-by-ball scoring.'}
            </p>
            {matchFilter !== 'completed' && (
              <button
                onClick={() => onNavigate('create')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold shadow-md shadow-orange-500/20"
              >
                + Create Match Fixture
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedMatches.map((m) => {
              const tA = m.teamA?.teamId as Team;
              const tB = m.teamB?.teamId as Team;
              const isLive = m.status === 'Live' || m.status === 'Innings Break';
              const isCompleted = m.status === 'Completed';
              const inn1 = m.innings?.[0];
              const inn2 = m.innings?.[1];

              return (
                <div 
                  key={m._id} 
                  className={`p-4 rounded-2xl transition-all border ${
                    isLive
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : isCompleted
                      ? 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left Info Column */}
                    <div className="space-y-2 flex-1">
                      
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-white">
                          {m.title}
                        </span>

                        {isLive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1 animate-pulse">
                            <Radio className="w-3 h-3" />
                            <span>LIVE SCORING</span>
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>COMPLETED</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-white/10 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>SCHEDULED</span>
                          </span>
                        )}

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                          {m.totalOvers || 8} OVERS
                        </span>

                        {m.venue && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            📍 {m.venue}
                          </span>
                        )}
                      </div>

                      {/* Teams & Scores Comparison */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-300">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: tA?.colorHex || '#38bdf8' }} 
                          />
                          <span className="font-bold text-white">{tA?.name || 'Team A'}</span>
                          {inn1 && (
                            <span className="font-mono font-bold text-sky-300">
                              {inn1.totalRuns}/{inn1.wickets} <span className="text-[10px] text-slate-400">({inn1.overs} ov)</span>
                            </span>
                          )}
                        </div>

                        <span className="text-slate-500 font-bold hidden sm:inline">vs</span>

                        <div className="flex items-center space-x-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: tB?.colorHex || '#f97316' }} 
                          />
                          <span className="font-bold text-white">{tB?.name || 'Team B'}</span>
                          {inn2 && (
                            <span className="font-mono font-bold text-orange-300">
                              {inn2.totalRuns}/{inn2.wickets} <span className="text-[10px] text-slate-400">({inn2.overs} ov)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Result / Status Note */}
                      {isCompleted ? (
                        <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5 pt-0.5">
                          <Trophy className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {m.result?.winner 
                              ? `${(m.result.winner as Team)?.name || 'Winner'} won by ${m.result.margin || ''}`
                              : m.result?.margin || 'Match Concluded'}
                          </span>
                        </div>
                      ) : isLive ? (
                        <p className="text-xs text-rose-300 font-medium">
                          ⚡ Currently In-Play — Current Innings: #{m.currentInningsNumber || 1}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">
                          ⏳ Ready for toss and scoring
                        </p>
                      )}

                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      
                      {/* If match is Live or Scheduled, show Score Match as primary */}
                      {!isCompleted ? (
                        <>
                          <button
                            onClick={() => {
                              onSelectMatch(m._id);
                              onNavigate('scorer');
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-1.5 transition-all ${
                              isLive
                                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>{isLive ? 'Resume Scoring' : 'Score Match'}</span>
                          </button>

                          <button
                            onClick={() => {
                              onSelectMatch(m._id);
                              onNavigate('viewer');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
                            title="Spectator live match stream"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Live</span>
                          </button>
                        </>
                      ) : (
                        /* If match is Completed, show View Scorecard as primary and Re-open Scorer as secondary */
                        <>
                          <button
                            onClick={() => {
                              onSelectMatch(m._id);
                              onNavigate('viewer');
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Scorecard</span>
                          </button>

                          <button
                            onClick={() => {
                              onSelectMatch(m._id);
                              onNavigate('scorer');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1"
                            title="Audit or re-open match scoring console"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit / Audit</span>
                          </button>
                        </>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
