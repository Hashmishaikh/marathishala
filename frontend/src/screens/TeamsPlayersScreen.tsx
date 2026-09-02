import React, { useState, useEffect } from 'react';
import { getTeams, createTeam, getPlayers, createPlayer, syncPlayerStats } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Users, UserPlus, Shield, Search, RefreshCw } from 'lucide-react';
import type { Team, Player } from '../types';

interface TeamsPlayersScreenProps {
  isAdminLoggedIn?: boolean;
}

export const TeamsPlayersScreen: React.FC<TeamsPlayersScreenProps> = ({ isAdminLoggedIn = false }) => {
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [isNewPlayerModalOpen, setIsNewPlayerModalOpen] = useState(false);

  // Team Form
  const [teamName, setTeamName] = useState('');
  const [teamShortCode, setTeamShortCode] = useState('');
  const [teamColorHex, setTeamColorHex] = useState('#0284c7');

  // Player Form
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'>('All-Rounder');
  const [battingStyle, setBattingStyle] = useState<'Right-hand' | 'Left-hand'>('Right-hand');
  const [bowlingStyle, setBowlingStyle] = useState<'Right-arm Fast' | 'Left-arm Fast' | 'Right-arm Spin' | 'Left-arm Spin' | 'None'>('Right-arm Fast');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, playersData] = await Promise.all([
        getTeams(),
        getPlayers({ search: searchQuery, role: roleFilter })
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
    } catch (err) {
      console.error('Error fetching teams/players:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, roleFilter]);

  const handleCreateTeam = async () => {
    if (!teamName || !teamShortCode) return;
    try {
      await createTeam({
        name: teamName,
        shortCode: teamShortCode.toUpperCase(),
        colorHex: teamColorHex
      });
      setIsNewTeamModalOpen(false);
      setTeamName('');
      setTeamShortCode('');
      fetchData();
    } catch (err) {
      console.error('Error creating team:', err);
    }
  };

  const handleCreatePlayer = async () => {
    if (!playerName) return;
    try {
      await createPlayer({
        name: playerName,
        role: playerRole,
        battingStyle,
        bowlingStyle
      });
      setIsNewPlayerModalOpen(false);
      setPlayerName('');
      fetchData();
    } catch (err) {
      console.error('Error creating player:', err);
    }
  };

  const handleSyncStats = async () => {
    try {
      await syncPlayerStats();
      fetchData();
      alert('Career statistics synchronized with completed matches!');
    } catch (err) {
      console.error('Error syncing stats:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>MSCA Teams & Player Pool</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global decoupled player pool with lifetime career stats & squad rosters
          </p>
        </div>

        {isAdminLoggedIn && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsNewTeamModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <Shield className="w-4 h-4 text-sky-400" />
              <span>+ Add Team</span>
            </button>

            <button
              onClick={() => setIsNewPlayerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Player</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'players'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏏 Global Player Pool ({players.length})
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'teams'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🛡️ Teams & Clubs ({teams.length})
        </button>
      </div>

      {/* PLAYERS VIEW */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : activeTab === 'players' ? (
        <div className="space-y-4">
          
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search player by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 flex-1 sm:flex-initial"
              >
                <option value="">All Roles</option>
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
              </select>

              {isAdminLoggedIn && (
                <button
                  onClick={handleSyncStats}
                  title="Synchronize career stats from completed fixtures"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
          </div>

          {/* Player Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p) => {
              const stats = p.stats || {
                matches: 0, innings: 0, runs: 0, ballsFaced: 0, highestScore: 0, wickets: 0, catches: 0
              };
              const strikeRate = stats.ballsFaced > 0 ? ((stats.runs / stats.ballsFaced) * 100).toFixed(1) : '0.0';

              return (
                <div key={p._id} className="glass-panel-interactive p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-300 font-black text-lg flex items-center justify-center shadow-lg">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">{p.name}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-white/5 text-emerald-400 border border-white/10 inline-block mt-0.5">
                          {p.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Batting:</span>
                      <strong className="text-slate-200">{p.battingStyle} (SR: {strikeRate})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Bowling:</span>
                      <strong className="text-slate-200">{p.bowlingStyle}</strong>
                    </div>
                  </div>

                  {/* Career Stats Matrix */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block">MAT</span>
                      <strong className="text-white text-xs">{stats.matches}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block">RUNS</span>
                      <strong className="text-sky-400 text-xs">{stats.runs}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block">WKTS</span>
                      <strong className="text-purple-400 text-xs">{stats.wickets}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block">HS</span>
                      <strong className="text-amber-400 text-xs">{stats.highestScore}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t._id} className="glass-panel-interactive p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl"
                  style={{ backgroundColor: t.colorHex || '#0284c7' }}
                >
                  {t.shortCode}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">{t.name}</h3>
                  <span className="text-xs font-mono text-slate-400">Code: {t.shortCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <span>Team Color:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colorHex || '#0284c7' }} />
                  <span className="font-mono">{t.colorHex}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      <Modal
        isOpen={isNewTeamModalOpen}
        onClose={() => setIsNewTeamModalOpen(false)}
        title="🛡️ Register New MSCA Team"
        subtitle="Create a custom club for tournaments & gully matches"
      >
        <div className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Team Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Shivaji Park Warriors"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Short Code (3-4 Chars)
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="SPW"
                value={teamShortCode}
                onChange={(e) => setTeamShortCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Theme Color
              </label>
              <input
                type="color"
                value={teamColorHex}
                onChange={(e) => setTeamColorHex(e.target.value)}
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-3">
            <button
              onClick={() => setIsNewTeamModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTeam}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md shadow-sky-500/20"
            >
              Create Team
            </button>
          </div>
        </div>
      </Modal>

      {/* CREATE PLAYER MODAL */}
      <Modal
        isOpen={isNewPlayerModalOpen}
        onClose={() => setIsNewPlayerModalOpen(false)}
        title="👤 Register New Player"
        subtitle="Add player to global MSCA decoupled repository"
      >
        <div className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Player Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Sachin Joshi"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Primary Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setPlayerRole(role)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    playerRole === role
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Batting Stance
              </label>
              <select
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Right-hand">Right-hand</option>
                <option value="Left-hand">Left-hand</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Bowling Style
              </label>
              <select
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Right-arm Fast">Right-arm Fast</option>
                <option value="Left-arm Fast">Left-arm Fast</option>
                <option value="Right-arm Spin">Right-arm Spin</option>
                <option value="Left-arm Spin">Left-arm Spin</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-3">
            <button
              onClick={() => setIsNewPlayerModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePlayer}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20"
            >
              Register Player
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
