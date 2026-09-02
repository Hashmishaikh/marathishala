import React, { useState, useEffect } from 'react';
import { 
  getSeriesList, 
  getSeriesSummary, 
  createSeries, 
  generateSeriesMatches,
  addSeriesMatch,
  updateMatch,
  getTeams,
  getPlayers,
  createPlayer
} from '../services/api';
import { Modal } from '../components/common/Modal';
import { 
  Trophy, 
  Plus, 
  RefreshCw, 
  Calendar, 
  Radio, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Target,
  Sparkles,
  PlusCircle,
  Settings2,
  Users,
  Search,
  UserPlus,
  Trash2,
  Edit3,
  ShieldAlert
} from 'lucide-react';
import type { Series, SeriesSummary, Team, Match, Player, CustomRules } from '../types';

interface SeriesHubScreenProps {
  onSelectMatch?: (matchId: string) => void;
  onNavigateTab?: (tab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin') => void;
  isAdminLoggedIn?: boolean;
}

export const SeriesHubScreen: React.FC<SeriesHubScreenProps> = ({ 
  onSelectMatch,
  onNavigateTab,
  isAdminLoggedIn = false
}) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [seriesSummary, setSeriesSummary] = useState<SeriesSummary | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'squads' | 'batting' | 'bowling' | 'standings'>('matches');

  // New Series Modal State
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesFormat, setNewSeriesFormat] = useState<'Gully Box' | 'T20' | 'ODI' | 'Custom Overs'>('Gully Box');
  const [newSeriesOvers, setNewSeriesOvers] = useState(8);
  const [newSeriesTotalMatches, setNewSeriesTotalMatches] = useState<number>(4);
  const [selectedTeamAId, setSelectedTeamAId] = useState('');
  const [selectedTeamBId, setSelectedTeamBId] = useState('');
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [autoGenerateFixtures, setAutoGenerateFixtures] = useState(true);
  const [creatingSeries, setCreatingSeries] = useState(false);
  const [addingMatch, setAddingMatch] = useState(false);

  // Gully Rules State for New Series
  const [newSeriesRules, setNewSeriesRules] = useState<CustomRules>({
    widePenaltyRuns: 1,
    noBallPenaltyRuns: 1,
    allOutThresholdType: 'AllPlayersOut',
    allowDoubleBatting: true,
    oppositeHandRule: true,
    lastManStandsAlone: true,
  });

  // Quick Register Player in Modal
  const [showQuickAddPlayer, setShowQuickAddPlayer] = useState(false);
  const [quickPlayerName, setQuickPlayerName] = useState('');
  const [quickPlayerRole, setQuickPlayerRole] = useState<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'>('All-Rounder');
  const [quickPlayerTeamAssign, setQuickPlayerTeamAssign] = useState<'A' | 'B'>('A');

  // Edit Match Overs / Squad / Rules Modal State
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [editMatchTitle, setEditMatchTitle] = useState('');
  const [editMatchOvers, setEditMatchOvers] = useState<number>(8);
  const [editMatchVenue, setEditMatchVenue] = useState('');
  const [editTeamAPlayerIds, setEditTeamAPlayerIds] = useState<string[]>([]);
  const [editTeamBPlayerIds, setEditTeamBPlayerIds] = useState<string[]>([]);
  const [editMatchRules, setEditMatchRules] = useState<CustomRules>({
    widePenaltyRuns: 1,
    noBallPenaltyRuns: 1,
    allOutThresholdType: 'AllPlayersOut',
    allowDoubleBatting: true,
    oppositeHandRule: true,
    lastManStandsAlone: true,
  });
  const [editSquadSearchQuery, setEditSquadSearchQuery] = useState('');
  const [showEditQuickAdd, setShowEditQuickAdd] = useState(false);
  const [editQuickName, setEditQuickName] = useState('');
  const [editQuickRole, setEditQuickRole] = useState<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'>('All-Rounder');
  const [editQuickTeam, setEditQuickTeam] = useState<'A' | 'B'>('A');
  const [savingMatchEdit, setSavingMatchEdit] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [list, teams, players] = await Promise.all([
        getSeriesList(),
        getTeams(),
        getPlayers()
      ]);
      setSeriesList(list);
      setAvailableTeams(teams);
      setAvailablePlayers(players);

      if (teams.length >= 2) {
        setSelectedTeamAId(teams[0]._id);
        setSelectedTeamBId(teams[1]._id);
      }

      // Default distribute players
      if (players.length >= 6) {
        setTeamAPlayerIds(players.slice(0, Math.floor(players.length / 2)).map(p => p._id));
        setTeamBPlayerIds(players.slice(Math.floor(players.length / 2)).map(p => p._id));
      }

      const targetId = selectedSeriesId || (list.length > 0 ? list[0]._id : '');
      if (targetId) {
        setSelectedSeriesId(targetId);
        const summary = await getSeriesSummary(targetId);
        setSeriesSummary(summary);
      }
    } catch (err) {
      console.error('Error fetching series data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (seriesId: string) => {
    if (!seriesId) return;
    try {
      setLoading(true);
      const summary = await getSeriesSummary(seriesId);
      setSeriesSummary(summary);
    } catch (err) {
      console.error('Error fetching series summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectSeries = (id: string) => {
    setSelectedSeriesId(id);
    fetchSummary(id);
  };

  const togglePlayerAssignment = (pId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (teamAPlayerIds.includes(pId)) {
        setTeamAPlayerIds(prev => prev.filter(id => id !== pId));
      } else {
        setTeamBPlayerIds(prev => prev.filter(id => id !== pId));
        setTeamAPlayerIds(prev => [...prev, pId]);
      }
    } else {
      if (teamBPlayerIds.includes(pId)) {
        setTeamBPlayerIds(prev => prev.filter(id => id !== pId));
      } else {
        setTeamAPlayerIds(prev => prev.filter(id => id !== pId));
        setTeamBPlayerIds(prev => [...prev, pId]);
      }
    }
  };

  const getLeaderboardPlayerName = (playerObj: any) => {
    if (playerObj && typeof playerObj === 'object' && playerObj.name && playerObj.name !== 'Unknown' && playerObj.name !== 'Player') {
      return playerObj.name;
    }
    const pId = typeof playerObj === 'object' ? (playerObj._id || playerObj.id) : playerObj;
    if (pId) {
      const found = availablePlayers.find(pl => pl._id.toString() === String(pId));
      if (found) return found.name;
    }
    return playerObj?.name || 'Player';
  };

  const getLeaderboardPlayerRole = (playerObj: any, defaultRole = 'Player') => {
    if (playerObj && typeof playerObj === 'object' && playerObj.role) {
      return playerObj.role;
    }
    const pId = typeof playerObj === 'object' ? (playerObj._id || playerObj.id) : playerObj;
    if (pId) {
      const found = availablePlayers.find(pl => pl._id.toString() === String(pId));
      if (found) return found.role || found.bowlingStyle || defaultRole;
    }
    return defaultRole;
  };

  const handleQuickAddPlayer = async () => {
    if (!quickPlayerName.trim()) return;
    try {
      const created = await createPlayer({
        name: quickPlayerName.trim(),
        role: quickPlayerRole,
        battingStyle: 'Right-hand',
        bowlingStyle: 'Right-arm Fast'
      });
      setAvailablePlayers(prev => [created, ...prev]);
      if (quickPlayerTeamAssign === 'A') {
        setTeamAPlayerIds(prev => [...prev, created._id]);
      } else {
        setTeamBPlayerIds(prev => [...prev, created._id]);
      }
      setQuickPlayerName('');
      setShowQuickAddPlayer(false);
    } catch (err) {
      console.error('Error adding quick player:', err);
    }
  };

  const handleEditQuickAddPlayer = async () => {
    if (!editQuickName.trim()) return;
    try {
      const created = await createPlayer({
        name: editQuickName.trim(),
        role: editQuickRole,
        battingStyle: 'Right-hand',
        bowlingStyle: 'Right-arm Fast'
      });
      setAvailablePlayers(prev => [created, ...prev]);
      if (editQuickTeam === 'A') {
        setEditTeamAPlayerIds(prev => [...prev, created._id]);
      } else {
        setEditTeamBPlayerIds(prev => [...prev, created._id]);
      }
      setEditQuickName('');
      setShowEditQuickAdd(false);
    } catch (err) {
      console.error('Error adding quick player in edit modal:', err);
    }
  };

  const handleCreateSeries = async () => {
    if (!newSeriesName) return;
    try {
      setCreatingSeries(true);
      const participatingTeams = [selectedTeamAId, selectedTeamBId].filter(Boolean);
      const count = Math.max(1, parseInt(String(newSeriesTotalMatches), 10) || 4);

      const created = await createSeries({
        name: newSeriesName,
        format: newSeriesFormat,
        defaultOvers: newSeriesOvers,
        totalMatches: count,
        teams: participatingTeams,
        status: 'Ongoing'
      });

      if (autoGenerateFixtures && selectedTeamAId && selectedTeamBId) {
        await generateSeriesMatches(created._id, {
          matchCount: count,
          teamAId: selectedTeamAId,
          teamBId: selectedTeamBId,
          teamAPlayerIds,
          teamBPlayerIds,
          totalOvers: newSeriesOvers,
          customRules: newSeriesRules
        });
      }

      setIsNewSeriesModalOpen(false);
      setNewSeriesName('');
      setSelectedSeriesId(created._id);
      
      const updatedList = await getSeriesList();
      setSeriesList(updatedList);
      fetchSummary(created._id);
    } catch (err) {
      console.error('Error creating series:', err);
    } finally {
      setCreatingSeries(false);
    }
  };

  const handleAddNextMatch = async () => {
    if (!selectedSeriesId || !seriesSummary) return;
    try {
      setAddingMatch(true);
      const tA = seriesSummary.series.teams?.[0];
      const tB = seriesSummary.series.teams?.[1];

      await addSeriesMatch(selectedSeriesId, {
        teamAId: tA ? (typeof tA === 'object' ? tA._id : tA) : undefined,
        teamBId: tB ? (typeof tB === 'object' ? tB._id : tB) : undefined,
        teamAPlayerIds,
        teamBPlayerIds,
        totalOvers: seriesSummary.series.defaultOvers || 8,
        customRules: newSeriesRules
      });

      fetchSummary(selectedSeriesId);
    } catch (err) {
      console.error('Error adding match to series:', err);
    } finally {
      setAddingMatch(false);
    }
  };

  const handleOpenEditMatchModal = (m: Match, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMatchToEdit(m);
    setEditMatchTitle(m.title);
    setEditMatchOvers(m.totalOvers || 8);
    setEditMatchVenue(m.venue || 'MSCA Arena');

    const tAPlayers = (m.teamA?.players || []).map((p: any) => typeof p === 'object' ? (p._id || p.id) : p).filter(Boolean);
    const tBPlayers = (m.teamB?.players || []).map((p: any) => typeof p === 'object' ? (p._id || p.id) : p).filter(Boolean);
    setEditTeamAPlayerIds(tAPlayers);
    setEditTeamBPlayerIds(tBPlayers);

    setEditMatchRules({
      widePenaltyRuns: m.customRules?.widePenaltyRuns ?? 1,
      noBallPenaltyRuns: m.customRules?.noBallPenaltyRuns ?? 1,
      allOutThresholdType: m.customRules?.allOutThresholdType ?? 'AllPlayersOut',
      allowDoubleBatting: m.customRules?.allowDoubleBatting ?? true,
      oppositeHandRule: m.customRules?.oppositeHandRule ?? true,
      lastManStandsAlone: m.customRules?.lastManStandsAlone ?? true,
    });

    setEditSquadSearchQuery('');
  };

  const handleRemovePlayerFromEditSquad = (pId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      setEditTeamAPlayerIds(prev => prev.filter(id => id !== pId));
    } else {
      setEditTeamBPlayerIds(prev => prev.filter(id => id !== pId));
    }
  };

  const handleAddPlayerToEditSquad = (pId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      setEditTeamBPlayerIds(prev => prev.filter(id => id !== pId));
      if (!editTeamAPlayerIds.includes(pId)) {
        setEditTeamAPlayerIds(prev => [...prev, pId]);
      }
    } else {
      setEditTeamAPlayerIds(prev => prev.filter(id => id !== pId));
      if (!editTeamBPlayerIds.includes(pId)) {
        setEditTeamBPlayerIds(prev => [...prev, pId]);
      }
    }
  };

  const handleSaveMatchEdit = async () => {
    if (!matchToEdit) return;
    try {
      setSavingMatchEdit(true);
      await updateMatch(matchToEdit._id, {
        title: editMatchTitle,
        totalOvers: editMatchOvers,
        venue: editMatchVenue,
        customRules: editMatchRules,
        teamA: { players: editTeamAPlayerIds },
        teamB: { players: editTeamBPlayerIds }
      });
      setMatchToEdit(null);
      if (selectedSeriesId) {
        fetchSummary(selectedSeriesId);
      }
    } catch (err) {
      console.error('Error updating match settings and squad:', err);
    } finally {
      setSavingMatchEdit(false);
    }
  };

  const handleMatchClick = (matchId: string) => {
    if (onSelectMatch) {
      onSelectMatch(matchId);
    }
    if (onNavigateTab) {
      onNavigateTab('viewer');
    }
  };

  const filteredModalPlayers = availablePlayers.filter(p => 
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  const filteredEditSquadPlayers = availablePlayers.filter(p => 
    p.name.toLowerCase().includes(editSquadSearchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(editSquadSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header & Series Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              MSCA Tournament & Series Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Flexible series scorelines (1-0, 2-0, 2-2), uneven squad double-batting with opposite hand rules, and tournament leaderboards
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {seriesList.length > 0 && (
            <select
              value={selectedSeriesId}
              onChange={(e) => handleSelectSeries(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 max-w-[240px] truncate"
            >
              {seriesList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.format} - {s.totalMatches || 3}M)
                </option>
              ))}
            </select>
          )}

          {isAdminLoggedIn && (
            <button
              onClick={() => setIsNewSeriesModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Custom Series</span>
            </button>
          )}
        </div>
      </div>

      {loading && !seriesSummary ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm font-semibold">Loading Series Statistics & Standings...</span>
        </div>
      ) : seriesList.length === 0 ? (
        /* Empty State */
        <div className="glass-panel p-10 sm:p-14 text-center space-y-5 max-w-xl mx-auto border-white/10 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">No Series or Tournaments Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Create a custom series with any number of matches, select participating team player squads, substitute players between matches, and track real-time scorelines (1-0, 2-0, 2-2).
            </p>
          </div>
          {isAdminLoggedIn && (
            <button
              onClick={() => setIsNewSeriesModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Series</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* HERO SERIES SCORELINE BANNER */}
          {seriesSummary && (
            <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Left: Series Title & Scoreline */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {seriesSummary.series.format} • {seriesSummary.totalMatches} MATCHES
                    </span>
                    {seriesSummary.completedMatchesCount >= seriesSummary.totalMatches ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        SERIES CONCLUDED
                      </span>
                    ) : seriesSummary.liveMatchesCount > 0 ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                        LIVE MATCH ONGOING
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        SERIES IN PROGRESS
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {seriesSummary.series.name}
                  </h2>

                  {/* High Visibility Scoreline Text */}
                  <p className="text-sm sm:text-base font-bold text-amber-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{seriesSummary.seriesStatusText}</span>
                  </p>
                </div>

                {/* Right: Bilateral Team Score Boxes */}
                {seriesSummary.series.teams && seriesSummary.series.teams.length === 2 && (
                  <div className="flex items-center space-x-3 sm:space-x-4 bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 shrink-0 font-mono">
                    {seriesSummary.series.teams.map((team: any, idx: number) => {
                      const wins = seriesSummary.teamWins[team._id] || 0;
                      return (
                        <React.Fragment key={team._id}>
                          <div className="text-center px-3 py-1">
                            <span 
                              className="text-xs font-bold block truncate max-w-[100px]"
                              style={{ color: team.colorHex || '#38bdf8' }}
                            >
                              {team.shortCode || team.name}
                            </span>
                            <span className="text-3xl sm:text-4xl font-black text-white">
                              {wins}
                            </span>
                            <span className="text-[10px] text-slate-400 block">WINS</span>
                          </div>
                          {idx === 0 && <span className="text-2xl font-bold text-slate-600">-</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ORANGE CAP & PURPLE CAP SPOTLIGHT CARDS */}
          {seriesSummary?.leaderboards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Orange Cap Spotlight */}
              <div className="glass-panel p-6 relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      🏏
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white tracking-tight">ORANGE CAP</h3>
                      <span className="text-[10px] text-amber-400 font-semibold uppercase">Series Leading Run Scorer</span>
                    </div>
                  </div>
                  <span className="text-xl">👑</span>
                </div>

                {seriesSummary.leaderboards.orangeCap ? (
                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {getLeaderboardPlayerName(seriesSummary.leaderboards.orangeCap.player)}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {getLeaderboardPlayerRole(seriesSummary.leaderboards.orangeCap.player, 'Batsman')} • Strike Rate: <strong className="text-sky-400 font-mono">{seriesSummary.leaderboards.orangeCap.strikeRate}</strong>
                      </p>
                      <div className="flex space-x-3 text-xs text-slate-300 font-mono pt-1">
                        <span>{seriesSummary.leaderboards.orangeCap.fours} x 4s</span>
                        <span>•</span>
                        <span>{seriesSummary.leaderboards.orangeCap.sixes} x 6s</span>
                        <span>•</span>
                        <span>HS: {seriesSummary.leaderboards.orangeCap.highestScore}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl sm:text-5xl font-black font-mono gradient-text-orange">
                        {seriesSummary.leaderboards.orangeCap.runs}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Runs</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 pt-6 italic">No match batting statistics recorded yet</p>
                )}
              </div>

              {/* Purple Cap Spotlight */}
              <div className="glass-panel p-6 relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white tracking-tight">PURPLE CAP</h3>
                      <span className="text-[10px] text-purple-400 font-semibold uppercase">Series Leading Wicket Taker</span>
                    </div>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>

                {seriesSummary.leaderboards.purpleCap ? (
                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {getLeaderboardPlayerName(seriesSummary.leaderboards.purpleCap.player)}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {getLeaderboardPlayerRole(seriesSummary.leaderboards.purpleCap.player, 'Bowler')} • Economy: <strong className="text-amber-400 font-mono">{seriesSummary.leaderboards.purpleCap.economy}</strong>
                      </p>
                      <div className="flex space-x-3 text-xs text-slate-300 font-mono pt-1">
                        <span>{seriesSummary.leaderboards.purpleCap.overs} Overs Bowled</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl sm:text-5xl font-black font-mono gradient-text-purple">
                        {seriesSummary.leaderboards.purpleCap.wickets}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Wickets</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 pt-6 italic">No bowling statistics recorded yet</p>
                )}
              </div>

            </div>
          )}

          {/* SUB-SECTION TABS */}
          <div className="flex items-center space-x-2 border-b border-white/10 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shrink-0 ${
                activeTab === 'matches'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Series Matches ({seriesSummary?.matches.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('squads')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shrink-0 ${
                activeTab === 'squads'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Player Squads</span>
            </button>

            <button
              onClick={() => setActiveTab('batting')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shrink-0 ${
                activeTab === 'batting'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Top Run Scorers Rank</span>
            </button>

            <button
              onClick={() => setActiveTab('bowling')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shrink-0 ${
                activeTab === 'bowling'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Top Wicket Takers Rank</span>
            </button>

            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shrink-0 ${
                activeTab === 'standings'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Points Table</span>
            </button>
          </div>

          {/* TAB 1: ALL MATCH SUMMARIES & FIXTURES */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  Showing {seriesSummary?.matches.length || 0} fixtures in this {seriesSummary?.totalMatches || 4}-match series
                </span>

                {isAdminLoggedIn && (
                  <button
                    onClick={handleAddNextMatch}
                    disabled={addingMatch}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    title="Add the next fixture to this series dynamically"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{addingMatch ? 'Adding...' : '+ Add Next Match'}</span>
                  </button>
                )}
              </div>

              {seriesSummary?.matches && seriesSummary.matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seriesSummary.matches.map((m: any, index: number) => {
                    const teamAObj = m.teamA?.teamId as Team;
                    const teamBObj = m.teamB?.teamId as Team;
                    const inn1 = m.innings?.[0];
                    const inn2 = m.innings?.[1];

                    return (
                      <div 
                        key={m._id}
                        onClick={() => handleMatchClick(m._id)}
                        className="glass-panel-interactive p-5 space-y-3 cursor-pointer group relative"
                      >
                        {/* Match Card Top Bar */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-300 font-mono">
                              Match {index + 1}
                            </span>
                            {/* Prominent Match Overs Badge */}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              {m.totalOvers || 8} OVERS
                            </span>
                            {m.teamA?.players && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({m.teamA.players.length}v{m.teamB?.players?.length || 0})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {m.status === 'Live' ? (
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1 animate-pulse">
                                <Radio className="w-3 h-3" />
                                <span>LIVE NOW</span>
                              </span>
                            ) : m.status === 'Completed' ? (
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>COMPLETED</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-700 text-slate-300 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>SCHEDULED</span>
                              </span>
                            )}

                            {/* Edit Match Overs / Squad Button */}
                            {isAdminLoggedIn && (
                              <button
                                onClick={(e) => handleOpenEditMatchModal(m, e)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-white/5 transition-colors"
                                title="Edit overs, squads & players for this match"
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Teams & Scores */}
                        <div className="space-y-2 py-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: teamAObj?.colorHex || '#38bdf8' }}
                              />
                              <span className="font-bold text-sm text-white">{teamAObj?.name || 'Team A'}</span>
                            </div>
                            <span className="font-mono font-bold text-sm text-slate-200">
                              {inn1 ? `${inn1.totalRuns}/${inn1.wickets} (${inn1.overs} ov)` : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: teamBObj?.colorHex || '#f97316' }}
                              />
                              <span className="font-bold text-sm text-white">{teamBObj?.name || 'Team B'}</span>
                            </div>
                            <span className="font-mono font-bold text-sm text-slate-200">
                              {inn2 ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.overs} ov)` : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Match Result Summary & Location */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="text-amber-300 font-semibold truncate max-w-[280px]">
                            {m.status === 'Completed'
                              ? (m.result?.winner ? `${(m.result.winner as Team).name || 'Winner'} won by ${m.result.margin}` : m.result?.margin || 'Match Concluded')
                              : m.status === 'Live'
                              ? '⚡ Match in progress — Click for ball-by-ball'
                              : `⏳ ${m.venue || 'MSCA Ground'} — Click to score`}
                          </span>
                          <span className="text-sky-400 group-hover:translate-x-1 transition-transform font-bold text-[11px] shrink-0">
                            Scorecard &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel p-8 text-center text-slate-400 space-y-2">
                  <p className="text-sm">No matches created for this series yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SQUADS SECTION WITH SQUAD MANAGEMENT */}
          {activeTab === 'squads' && (
            <div className="space-y-6">
              {seriesSummary?.matches && seriesSummary.matches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-white/10">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        Series Squads & Player Roster
                      </h3>
                      <p className="text-xs text-slate-400">
                        Player availability and substitutions for upcoming and active series fixtures
                      </p>
                    </div>

                    {isAdminLoggedIn && (
                      <button
                        onClick={() => handleOpenEditMatchModal(seriesSummary.matches[0])}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manage / Substitute Players</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team A Squad */}
                    {(() => {
                      const firstMatch = seriesSummary.matches[0];
                      const tA = firstMatch.teamA?.teamId as Team;
                      const squadA = (firstMatch.teamA?.players || []) as any[];

                      return (
                        <div className="glass-panel p-5 space-y-4 border-sky-500/20">
                          <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: tA?.colorHex || '#38bdf8' }}
                              />
                              <h3 className="text-base font-extrabold text-white">
                                {tA?.name || 'Team A'} Squad
                              </h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                              {squadA.length} Players
                            </span>
                          </div>

                          <div className="space-y-2">
                            {squadA.map((p: any, idx: number) => {
                              let pName = `Player ${idx + 1}`;
                              let pRole = 'Player';

                              if (p && typeof p === 'object' && p.name) {
                                pName = p.name;
                                pRole = p.role || 'Player';
                              } else {
                                const pId = typeof p === 'object' ? (p?._id || p?.id) : p;
                                const found = availablePlayers.find(pl => pl._id.toString() === String(pId));
                                if (found) {
                                  pName = found.name;
                                  pRole = found.role || 'Player';
                                }
                              }

                              return (
                                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                                  <div className="flex items-center space-x-2.5">
                                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-sm text-white">{pName}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/5">
                                    {pRole}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Team B Squad */}
                    {(() => {
                      const firstMatch = seriesSummary.matches[0];
                      const tB = firstMatch.teamB?.teamId as Team;
                      const squadB = (firstMatch.teamB?.players || []) as any[];

                      return (
                        <div className="glass-panel p-5 space-y-4 border-orange-500/20">
                          <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: tB?.colorHex || '#f97316' }}
                              />
                              <h3 className="text-base font-extrabold text-white">
                                {tB?.name || 'Team B'} Squad
                              </h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                              {squadB.length} Players
                            </span>
                          </div>

                          <div className="space-y-2">
                            {squadB.map((p: any, idx: number) => {
                              let pName = `Player ${idx + 1}`;
                              let pRole = 'Player';

                              if (p && typeof p === 'object' && p.name) {
                                pName = p.name;
                                pRole = p.role || 'Player';
                              } else {
                                const pId = typeof p === 'object' ? (p?._id || p?.id) : p;
                                const found = availablePlayers.find(pl => pl._id.toString() === String(pId));
                                if (found) {
                                  pName = found.name;
                                  pRole = found.role || 'Player';
                                }
                              }

                              return (
                                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                                  <div className="flex items-center space-x-2.5">
                                    <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-300 font-bold text-xs flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-sm text-white">{pName}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/5">
                                    {pRole}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="glass-panel p-8 text-center text-slate-400">
                  <p>No squads available for this series yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOP RUN SCORERS RANK LIST */}
          {activeTab === 'batting' && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>🏏 Top Run Scorers Ranking List</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Highest batting aggregations in {seriesSummary?.series.name}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold font-mono">
                      <th className="py-3 px-2">Rank</th>
                      <th className="py-3 px-2">Player</th>
                      <th className="py-3 px-2 text-center">Inn</th>
                      <th className="py-3 px-2 text-right font-bold text-amber-400">Runs</th>
                      <th className="py-3 px-2 text-right">Balls</th>
                      <th className="py-3 px-2 text-right">SR</th>
                      <th className="py-3 px-2 text-right">4s</th>
                      <th className="py-3 px-2 text-right">6s</th>
                      <th className="py-3 px-2 text-right">HS</th>
                      <th className="py-3 px-2 text-right">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {seriesSummary?.leaderboards.topBatsmen && seriesSummary.leaderboards.topBatsmen.length > 0 ? (
                      seriesSummary.leaderboards.topBatsmen.map((b, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 font-bold text-slate-400">
                            {idx === 0 ? '👑 #1' : `#${idx + 1}`}
                          </td>
                          <td className="py-3 px-2 font-sans font-bold text-white">
                            {getLeaderboardPlayerName(b.player)}
                            <span className="text-[10px] text-slate-400 block font-normal">{getLeaderboardPlayerRole(b.player, 'Batsman')}</span>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">{b.innings}</td>
                          <td className="py-3 px-2 text-right font-black text-amber-300 text-sm">{b.runs}</td>
                          <td className="py-3 px-2 text-right text-slate-400">{b.balls}</td>
                          <td className="py-3 px-2 text-right font-bold text-sky-400">{b.strikeRate}</td>
                          <td className="py-3 px-2 text-right text-slate-300">{b.fours}</td>
                          <td className="py-3 px-2 text-right text-purple-300">{b.sixes}</td>
                          <td className="py-3 px-2 text-right font-bold text-slate-200">{b.highestScore}</td>
                          <td className="py-3 px-2 text-right text-slate-300">{b.average}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500 italic">
                          No batting records found for this series yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TOP WICKET TAKERS RANK LIST */}
          {activeTab === 'bowling' && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>🎯 Top Wicket Takers Ranking List</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Highest wicket takers & best bowling economies in {seriesSummary?.series.name}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold font-mono">
                      <th className="py-3 px-2">Rank</th>
                      <th className="py-3 px-2">Bowler</th>
                      <th className="py-3 px-2 text-right font-bold text-purple-400">Wkts</th>
                      <th className="py-3 px-2 text-right">Overs</th>
                      <th className="py-3 px-2 text-right">Runs Conceded</th>
                      <th className="py-3 px-2 text-right">Maidens</th>
                      <th className="py-3 px-2 text-right font-bold text-amber-400">Economy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {seriesSummary?.leaderboards.topBowlers && seriesSummary.leaderboards.topBowlers.length > 0 ? (
                      seriesSummary.leaderboards.topBowlers.map((bw, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 font-bold text-slate-400">
                            {idx === 0 ? '🏆 #1' : `#${idx + 1}`}
                          </td>
                          <td className="py-3 px-2 font-sans font-bold text-white">
                            {getLeaderboardPlayerName(bw.player)}
                            <span className="text-[10px] text-slate-400 block font-normal">{getLeaderboardPlayerRole(bw.player, 'Bowler')}</span>
                          </td>
                          <td className="py-3 px-2 text-right font-black text-purple-300 text-sm">{bw.wickets}</td>
                          <td className="py-3 px-2 text-right text-slate-300">{bw.overs}</td>
                          <td className="py-3 px-2 text-right text-slate-400">{bw.runsConceded}</td>
                          <td className="py-3 px-2 text-right text-slate-300">{bw.maidens}</td>
                          <td className="py-3 px-2 text-right font-bold text-amber-400">{bw.economy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                          No bowling records found for this series yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: POINTS TABLE */}
          {activeTab === 'standings' && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">
                    📊 Points Standings & Net Run Rate
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ranked by Points $\rightarrow$ Net Run Rate (NRR) $\rightarrow$ Matches Won
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold font-mono">
                      <th className="py-3 px-2">#</th>
                      <th className="py-3 px-2">Team</th>
                      <th className="py-3 px-2 text-center">P</th>
                      <th className="py-3 px-2 text-center">W</th>
                      <th className="py-3 px-2 text-center">L</th>
                      <th className="py-3 px-2 text-center">T</th>
                      <th className="py-3 px-2 text-center font-bold text-sky-400">PTS</th>
                      <th className="py-3 px-2 text-right">Runs / Ov (For)</th>
                      <th className="py-3 px-2 text-right">Runs / Ov (Against)</th>
                      <th className="py-3 px-2 text-right font-bold text-emerald-400">NRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {seriesSummary?.pointsTable && seriesSummary.pointsTable.length > 0 ? (
                      seriesSummary.pointsTable.map((entry, idx) => {
                        const team = entry.team as Team;
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-2 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-2 font-sans font-bold text-white flex items-center space-x-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: team?.colorHex || '#0284c7' }} 
                              />
                              <span>{team?.name || 'Team'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({team?.shortCode})</span>
                            </td>
                            <td className="py-3.5 px-2 text-center text-slate-300">{entry.played}</td>
                            <td className="py-3.5 px-2 text-center text-emerald-400 font-bold">{entry.won}</td>
                            <td className="py-3.5 px-2 text-center text-rose-400">{entry.lost}</td>
                            <td className="py-3.5 px-2 text-center text-amber-400">{entry.tied}</td>
                            <td className="py-3.5 px-2 text-center text-sky-400 font-black text-base">{entry.points}</td>
                            <td className="py-3.5 px-2 text-right text-xs text-slate-300">
                              {entry.runsScored} / {entry.oversFaced?.toFixed(1)}
                            </td>
                            <td className="py-3.5 px-2 text-right text-xs text-slate-300">
                              {entry.runsConceded} / {entry.oversBowled?.toFixed(1)}
                            </td>
                            <td className={`py-3.5 px-2 text-right font-black ${entry.netRunRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {entry.netRunRate >= 0 ? `+${entry.netRunRate.toFixed(3)}` : entry.netRunRate.toFixed(3)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500 italic">
                          No standings recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: EDIT MATCH OVERS, SQUAD & MSCA OPPOSITE HAND RULES */}
      <Modal
        isOpen={!!matchToEdit}
        onClose={() => setMatchToEdit(null)}
        title="⚙️ Customize Match Overs, Squad & Rules"
        subtitle="Add/remove players, configure uneven squad double-batting with opposite hand rules"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Match Title
              </label>
              <input
                type="text"
                value={editMatchTitle}
                onChange={(e) => setEditMatchTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Venue / Location
              </label>
              <input
                type="text"
                value={editMatchVenue}
                onChange={(e) => setEditMatchVenue(e.target.value)}
                placeholder="e.g. Shivaji Park Pitch 3"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Custom Overs Picker for this Match */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-sky-400">
                Match Overs Per Innings
              </label>
              <span className="text-xs font-mono font-bold text-white bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                {editMatchOvers} Overs
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="50"
                value={editMatchOvers}
                onChange={(e) => setEditMatchOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white font-bold focus:outline-none focus:border-sky-400"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((ov) => (
                  <button
                    key={ov}
                    type="button"
                    onClick={() => setEditMatchOvers(ov)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      editMatchOvers === ov
                        ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {ov} Ov
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SQUADS & SUBSTITUTIONS MANAGEMENT */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">
                👥 Match Playing Squads & Substitutions
              </span>
              <button
                type="button"
                onClick={() => setShowEditQuickAdd(!showEditQuickAdd)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-500/30"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Quick Add Player</span>
              </button>
            </div>

            {/* Inline Quick Add Player for Match */}
            {showEditQuickAdd && (
              <div className="p-3 rounded-xl bg-slate-800 border border-emerald-500/30 space-y-2 animate-in fade-in">
                <span className="text-xs font-bold text-emerald-300 block">Register New Player for this Match:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={editQuickName}
                    onChange={(e) => setEditQuickName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <select
                    value={editQuickRole}
                    onChange={(e) => setEditQuickRole(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </select>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setEditQuickTeam('A')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        editQuickTeam === 'A' ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      Team A
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditQuickTeam('B')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        editQuickTeam === 'B' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      Team B
                    </button>
                    <button
                      type="button"
                      onClick={handleEditQuickAddPlayer}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Current Active Squads (Team A vs Team B) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Team A Playing Squad */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-xs font-extrabold text-sky-400">
                    Team A Squad ({editTeamAPlayerIds.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    All-Out: {editTeamAPlayerIds.length}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {editTeamAPlayerIds.map((pId) => {
                    const pl = availablePlayers.find(p => p._id.toString() === pId);
                    const pName = pl?.name || 'Player';
                    const pRole = pl?.role || 'Player';

                    return (
                      <div key={pId} className="p-1.5 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-between text-xs">
                        <div className="truncate mr-1">
                          <span className="font-bold text-white block truncate">{pName}</span>
                          <span className="text-[10px] text-slate-400">{pRole}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerFromEditSquad(pId, 'A')}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 text-[10px] font-bold transition-colors shrink-0"
                          title="Remove player from Team A squad"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {editTeamAPlayerIds.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">No players assigned</p>
                  )}
                </div>
              </div>

              {/* Team B Playing Squad */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-orange-500/30 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-xs font-extrabold text-orange-400">
                    Team B Squad ({editTeamBPlayerIds.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    All-Out: {editTeamBPlayerIds.length}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {editTeamBPlayerIds.map((pId) => {
                    const pl = availablePlayers.find(p => p._id.toString() === pId);
                    const pName = pl?.name || 'Player';
                    const pRole = pl?.role || 'Player';

                    return (
                      <div key={pId} className="p-1.5 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-between text-xs">
                        <div className="truncate mr-1">
                          <span className="font-bold text-white block truncate">{pName}</span>
                          <span className="text-[10px] text-slate-400">{pRole}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerFromEditSquad(pId, 'B')}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 text-[10px] font-bold transition-colors shrink-0"
                          title="Remove player from Team B squad"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {editTeamBPlayerIds.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">No players assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Add Available Players from Global Pool */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                Add Available Players into Match Squad:
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter available players..."
                  value={editSquadSearchQuery}
                  onChange={(e) => setEditSquadSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                {filteredEditSquadPlayers
                  .filter(p => !editTeamAPlayerIds.includes(p._id) && !editTeamBPlayerIds.includes(p._id))
                  .map((p) => (
                    <div key={p._id} className="p-2 rounded-lg bg-slate-800/60 border border-white/5 flex items-center justify-between text-xs">
                      <div className="truncate mr-1">
                        <span className="font-bold text-white block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.role}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddPlayerToEditSquad(p._id, 'A')}
                          className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 text-[10px] font-bold border border-sky-500/30 transition-all"
                        >
                          + Team A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPlayerToEditSquad(p._id, 'B')}
                          className="px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-slate-950 text-[10px] font-bold border border-orange-500/30 transition-all"
                        >
                          + Team B
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* MSCA GULLY RULES & OPPOSITE-HAND SETTINGS */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
            <div className="flex items-start space-x-2">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-purple-200 block uppercase">
                  🏏 MSCA Uneven Squad & Opposite Hand Rule
                </span>
                <span className="text-[11px] text-purple-300/80">
                  If one team has 1 less player, a dismissed batsman is eligible to bat a second turn batting with their opposite hand (Right $\leftrightarrow$ Left).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editMatchRules.allowDoubleBatting}
                  onChange={(e) => setEditMatchRules({ ...editMatchRules, allowDoubleBatting: e.target.checked })}
                  className="rounded border-purple-500 text-purple-500 focus:ring-purple-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-200">
                  Enable Double Batting (Uneven Squads)
                </span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editMatchRules.oppositeHandRule}
                  onChange={(e) => setEditMatchRules({ ...editMatchRules, oppositeHandRule: e.target.checked })}
                  className="rounded border-purple-500 text-purple-500 focus:ring-purple-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-200">
                  Must Bat with Opposite Hand (RHB $\leftrightarrow$ LHB)
                </span>
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => setMatchToEdit(null)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMatchEdit}
              disabled={savingMatchEdit}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {savingMatchEdit ? 'Updating Fixture & Squad...' : 'Save Match Overs & Squad'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: NEW TOURNAMENT / SERIES & SQUAD SELECTION MODAL */}
      <Modal
        isOpen={isNewSeriesModalOpen}
        onClose={() => setIsNewSeriesModalOpen(false)}
        title="🏆 Create Custom Series & Select Team Squads"
        subtitle="Configure matches, pick participating teams, and select players for each squad"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Series Title
            </label>
            <input
              type="text"
              placeholder="e.g. MSCA 4-Match Bilateral Cup (SPW vs MST)"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Match Format
              </label>
              <select
                value={newSeriesFormat}
                onChange={(e) => setNewSeriesFormat(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Gully Box">Gully Box</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Custom Overs">Custom Overs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Default Overs Per Innings
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newSeriesOvers}
                onChange={(e) => setNewSeriesOvers(parseInt(e.target.value, 10) || 8)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Number of Matches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Number of Matches in Series
              </label>
              <span className="text-xs font-bold font-mono text-amber-400">
                {newSeriesTotalMatches} Matches
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="50"
                value={newSeriesTotalMatches}
                onChange={(e) => setNewSeriesTotalMatches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewSeriesTotalMatches(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      newSeriesTotalMatches === num
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {num}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Team A & Team B Selection */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-sky-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-sky-400">
                  Team A Club
                </label>
                <span className="text-[11px] font-mono font-bold text-sky-300">
                  {teamAPlayerIds.length} Players
                </span>
              </div>
              <select
                value={selectedTeamAId}
                onChange={(e) => setSelectedTeamAId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
              >
                {availableTeams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-orange-400">
                  Team B Club
                </label>
                <span className="text-[11px] font-mono font-bold text-orange-300">
                  {teamBPlayerIds.length} Players
                </span>
              </div>
              <select
                value={selectedTeamBId}
                onChange={(e) => setSelectedTeamBId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
              >
                {availableTeams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.shortCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SQUAD / PLAYER SELECTION MATRIX */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                  Assign Players to Series Squads
                </span>
                <span className="text-[11px] text-slate-400">
                  Select which players will represent Team A and Team B in this series
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickAddPlayer(!showQuickAddPlayer)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-500/30"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Quick Add</span>
              </button>
            </div>

            {/* Quick Add Player Inline Form */}
            {showQuickAddPlayer && (
              <div className="p-3 rounded-xl bg-slate-800 border border-emerald-500/30 space-y-2.5 animate-in fade-in">
                <span className="text-xs font-bold text-emerald-300 block">Register New Player & Assign:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Player Full Name"
                    value={quickPlayerName}
                    onChange={(e) => setQuickPlayerName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <select
                    value={quickPlayerRole}
                    onChange={(e) => setQuickPlayerRole(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </select>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setQuickPlayerTeamAssign('A')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        quickPlayerTeamAssign === 'A' ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      Team A
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickPlayerTeamAssign('B')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        quickPlayerTeamAssign === 'B' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      Team B
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddPlayer}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search player pool..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Players List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredModalPlayers.map((p) => {
                const isA = teamAPlayerIds.includes(p._id);
                const isB = teamBPlayerIds.includes(p._id);

                return (
                  <div
                    key={p._id}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isA
                        ? 'bg-sky-950/40 border-sky-500/50 text-white'
                        : isB
                        ? 'bg-orange-950/40 border-orange-500/50 text-white'
                        : 'bg-slate-950/40 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-white block truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{p.role}</span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePlayerAssignment(p._id, 'A')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isA ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Team A
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePlayerAssignment(p._id, 'B')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isB ? 'bg-orange-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Team B
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MSCA GULLY RULES TOGGLES FOR NEW SERIES */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
            <div className="flex items-start space-x-2">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-purple-200 block uppercase">
                  🏏 MSCA Uneven Squad & Opposite Hand Rule
                </span>
                <span className="text-[11px] text-purple-300/80">
                  If one team has 1 less player (e.g. 5 vs 6), the dismissed batsman unlocks a second turn batting with the opposite hand.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSeriesRules.allowDoubleBatting}
                  onChange={(e) => setNewSeriesRules({ ...newSeriesRules, allowDoubleBatting: e.target.checked })}
                  className="rounded border-purple-500 text-purple-500 focus:ring-purple-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-200">
                  Enable Double Batting (Uneven Squads)
                </span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSeriesRules.oppositeHandRule}
                  onChange={(e) => setNewSeriesRules({ ...newSeriesRules, oppositeHandRule: e.target.checked })}
                  className="rounded border-purple-500 text-purple-500 focus:ring-purple-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-200">
                  Must Bat with Opposite Hand (RHB $\leftrightarrow$ LHB)
                </span>
              </label>
            </div>
          </div>

          {/* Auto-generate Matches Checkbox */}
          <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={autoGenerateFixtures}
              onChange={(e) => setAutoGenerateFixtures(e.target.checked)}
              className="rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-900"
            />
            <div>
              <span className="text-xs font-bold text-amber-200 block">
                Auto-generate all {newSeriesTotalMatches} match fixtures with selected squads & rules
              </span>
              <span className="text-[11px] text-slate-400">
                Creates Match 1 to Match {newSeriesTotalMatches} ready to score immediately
              </span>
            </div>
          </label>

          <div className="flex space-x-3 pt-3">
            <button
              onClick={() => setIsNewSeriesModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSeries}
              disabled={creatingSeries || !newSeriesName}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {creatingSeries ? 'Creating Series & Squads...' : `Create ${newSeriesTotalMatches}-Match Series`}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
