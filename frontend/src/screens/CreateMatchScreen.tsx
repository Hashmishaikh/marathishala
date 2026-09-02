import React, { useState, useEffect } from 'react';
import { getTeams, getPlayers, getSeriesList, createMatch } from '../services/api';
import { ArrowRight } from 'lucide-react';
import type { Team, Player, Series, CustomRules } from '../types';

interface CreateMatchScreenProps {
  onMatchCreated: (matchId: string) => void;
}

export const CreateMatchScreen: React.FC<CreateMatchScreenProps> = ({ onMatchCreated }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  const [seriesId, setSeriesId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('Marathishala Ground, Dadar');
  const [totalOvers, setTotalOvers] = useState(6);

  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');

  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>([]);

  const [customRules, setCustomRules] = useState<CustomRules>({
    widePenaltyRuns: 1,
    noBallPenaltyRuns: 1,
    allOutThresholdType: 'AllPlayersOut',
    allowDoubleBatting: true,
    oppositeHandRule: true,
    lastManStandsAlone: true
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTeams(), getPlayers(), getSeriesList()])
      .then(([teamsData, playersData, seriesData]) => {
        setTeams(teamsData);
        setPlayers(playersData);
        setSeriesList(seriesData);

        if (teamsData.length >= 2) {
          setTeamAId(teamsData[0]._id);
          setTeamBId(teamsData[1]._id);
          setTitle(`${teamsData[0].name} vs ${teamsData[1].name}`);
        }
        if (seriesData.length > 0) {
          setSeriesId(seriesData[0]._id);
        }

        // Pre-select some players if available
        if (playersData.length >= 10) {
          setTeamAPlayerIds(playersData.slice(0, 5).map(p => p._id));
          setTeamBPlayerIds(playersData.slice(5, 11).map(p => p._id));
        }
      })
      .catch(console.error);
  }, []);

  const handleTeamAChange = (id: string) => {
    setTeamAId(id);
    const tA = teams.find(t => t._id === id);
    const tB = teams.find(t => t._id === teamBId);
    if (tA && tB) setTitle(`${tA.name} vs ${tB.name}`);
  };

  const handleTeamBChange = (id: string) => {
    setTeamBId(id);
    const tA = teams.find(t => t._id === teamAId);
    const tB = teams.find(t => t._id === id);
    if (tA && tB) setTitle(`${tA.name} vs ${tB.name}`);
  };

  const togglePlayerSelection = (pId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (teamAPlayerIds.includes(pId)) {
        setTeamAPlayerIds(prev => prev.filter(id => id !== pId));
      } else {
        // Remove from Team B if present
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId || !teamBId) {
      setError('Please select both teams');
      return;
    }
    if (teamAId === teamBId) {
      setError('Team A and Team B cannot be the same');
      return;
    }
    if (teamAPlayerIds.length === 0 || teamBPlayerIds.length === 0) {
      setError('Both teams must have at least 1 player in squad');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const payload = {
        seriesId: seriesId || null,
        title: title || 'MSCA Gully Match',
        venue,
        totalOvers,
        customRules,
        teamA: {
          teamId: teamAId,
          players: teamAPlayerIds,
          maxWickets: customRules.allOutThresholdType === 'AllPlayersOut' ? teamAPlayerIds.length : Math.max(1, teamAPlayerIds.length - 1)
        },
        teamB: {
          teamId: teamBId,
          players: teamBPlayerIds,
          maxWickets: customRules.allOutThresholdType === 'AllPlayersOut' ? teamBPlayerIds.length : Math.max(1, teamBPlayerIds.length - 1)
        }
      };

      const newMatch = await createMatch(payload);
      onMatchCreated(newMatch._id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create fixture');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <span>🏏 Create New MSCA Match Fixture</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Dynamic Squad Sizing (3v3 to 11v11) & Custom Gully Rules Engine
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        
        {/* Basic Match Meta */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">
            1. Match Metadata & Venue
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Match Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400 font-semibold"
                placeholder="Match 1: SPW vs MST"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tournament / Series (Optional)
              </label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                <option value="">Standalone Friendly Match</option>
                {seriesList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.format})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Total Overs per Innings
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalOvers}
                onChange={(e) => setTotalOvers(parseInt(e.target.value, 10) || 6)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Squad Sizing (Team A vs Team B) */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                2. Dynamic Squad Sizing & Teams
              </h3>
              <p className="text-xs text-slate-400">
                Supports uneven squads (e.g. 5 vs 6). Select players for each team.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Team A Selection */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
              <label className="block text-xs font-bold uppercase text-sky-400">
                Team A
              </label>
              <select
                value={teamAId}
                onChange={(e) => handleTeamAChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
              >
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.shortCode})
                  </option>
                ))}
              </select>

              <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-xs font-mono">
                <span className="text-slate-400">Selected Squad: </span>
                <strong className="text-sky-300">{teamAPlayerIds.length} Players</strong>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  All-Out Limit: {customRules.allOutThresholdType === 'AllPlayersOut' ? teamAPlayerIds.length : teamAPlayerIds.length - 1} Wickets
                </span>
              </div>
            </div>

            {/* Team B Selection */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
              <label className="block text-xs font-bold uppercase text-orange-400">
                Team B
              </label>
              <select
                value={teamBId}
                onChange={(e) => handleTeamBChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
              >
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.shortCode})
                  </option>
                ))}
              </select>

              <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/30 text-xs font-mono">
                <span className="text-slate-400">Selected Squad: </span>
                <strong className="text-orange-300">{teamBPlayerIds.length} Players</strong>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  All-Out Limit: {customRules.allOutThresholdType === 'AllPlayersOut' ? teamBPlayerIds.length : teamBPlayerIds.length - 1} Wickets
                </span>
              </div>
            </div>
          </div>

          {/* Player Roster Selection Matrix */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Assign Players to Squads:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {players.map((p) => {
                const isTeamA = teamAPlayerIds.includes(p._id);
                const isTeamB = teamBPlayerIds.includes(p._id);

                return (
                  <div
                    key={p._id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isTeamA
                        ? 'bg-sky-950/40 border-sky-500/50 text-white'
                        : isTeamB
                        ? 'bg-orange-950/40 border-orange-500/50 text-white'
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-xs block text-white truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{p.role}</span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePlayerSelection(p._id, 'A')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isTeamA ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Team A
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePlayerSelection(p._id, 'B')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isTeamB ? 'bg-orange-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
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
        </div>

        {/* MSCA Custom Rules */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            3. MSCA Gully Rules Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Wide Penalty Runs
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomRules({ ...customRules, widePenaltyRuns: val })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      customRules.widePenaltyRuns === val
                        ? 'bg-amber-600/30 text-amber-200 border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    +{val} Run{val !== 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                No-Ball Penalty Runs
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomRules({ ...customRules, noBallPenaltyRuns: val })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      customRules.noBallPenaltyRuns === val
                        ? 'bg-yellow-600/30 text-yellow-200 border-yellow-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    +{val} Run{val !== 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">True Total All-Out (5/5 or 6/6)</span>
                <span className="text-[11px] text-slate-400">All players in dynamic squad must be dismissed</span>
              </div>
              <input
                type="checkbox"
                checked={customRules.allOutThresholdType === 'AllPlayersOut'}
                onChange={(e) => setCustomRules({ ...customRules, allOutThresholdType: e.target.checked ? 'AllPlayersOut' : 'StandardPartnership' })}
                className="rounded border-sky-500 text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Double-Batting with Opposite Hand Rule</span>
                <span className="text-[11px] text-slate-400">Uneven squad player unlocks 2nd turn batting opposite stance</span>
              </div>
              <input
                type="checkbox"
                checked={customRules.allowDoubleBatting}
                onChange={(e) => setCustomRules({ ...customRules, allowDoubleBatting: e.target.checked })}
                className="rounded border-purple-500 text-purple-500 focus:ring-purple-500 w-4 h-4 bg-slate-900"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={creating}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-sky-500 hover:from-orange-400 hover:to-sky-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <span>Create Fixture & Open Scorer</span>
          <ArrowRight className="w-5 h-5" />
        </button>

      </form>
    </div>
  );
};
