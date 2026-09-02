import React, { useState } from 'react';
import { Keypad } from '../components/scorer/Keypad';
import { ExtrasGrid } from '../components/scorer/ExtrasGrid';
import { WicketModal } from '../components/scorer/WicketModal';
import { BatsmanPickerModal } from '../components/scorer/BatsmanPickerModal';
import { BowlerPickerModal } from '../components/scorer/BowlerPickerModal';
import { EditBallDrawer } from '../components/scorer/EditBallDrawer';
import { RulesConfigModal } from '../components/scorer/RulesConfigModal';
import { LiveHeader } from '../components/viewer/LiveHeader';
import { CreaseCard } from '../components/viewer/CreaseCard';
import { OverTimeline } from '../components/viewer/OverTimeline';
import { ScorecardTabs } from '../components/viewer/ScorecardTabs';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { useScorerActions } from '../hooks/useScorerActions';
import { startMatch, startSecondInnings, endMatch, updateMatch } from '../services/api';
import { Sliders, RefreshCw, PlayCircle, FastForward, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import type { Delivery, Team, CustomRules } from '../types';
import { getId } from '../utils/helpers';

interface AdminScorerScreenProps {
  matchId: string;
  onMatchSelect?: (matchId: string) => void;
}

export const AdminScorerScreen: React.FC<AdminScorerScreenProps> = ({ matchId }) => {
  const { match, deliveries, loading, error, refreshMatch } = useLiveMatch(matchId);
  const {
    submitting,
    actionError,
    setActionError,
    scoreBall,
    undoBall,
    swapEnds,
    selectBatsman,
    selectBowler,
    updateHistoricalDelivery,
    forceRebuild
  } = useScorerActions(matchId);

  // Modal States
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isBatsmanModalOpen, setIsBatsmanModalOpen] = useState(false);
  const [batsmanPosition, setBatsmanPosition] = useState<'striker' | 'nonStriker'>('striker');
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedDeliveryToEdit, setSelectedDeliveryToEdit] = useState<Delivery | null>(null);

  // Toss & Start State
  const [tossWinnerId, setTossWinnerId] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  if (loading && !match) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-sm font-semibold">Loading Live Match Scoring Console...</span>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-2xl mx-auto p-6 glass-panel text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Error Loading Match</h3>
        <p className="text-sm text-slate-400">{error || 'Match not found'}</p>
        <button
          onClick={refreshMatch}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const teamA = match.teamA.teamId as Team;
  const teamB = match.teamB.teamId as Team;
  const currentInnings = match.innings.find(i => i.inningsNumber === match.currentInningsNumber);

  // Determine last completed over's bowler to prevent consecutive overs
  const currentInningsDeliveries = deliveries.filter(d => d.inningsNumber === match.currentInningsNumber);
  let legalBallCount = 0;
  currentInningsDeliveries.forEach(d => {
    if (d.extraType !== 'Wide' && d.extraType !== 'NoBall') legalBallCount++;
  });
  const isOverJustFinished = legalBallCount > 0 && (legalBallCount % 6 === 0);
  const lastDelivery = currentInningsDeliveries[currentInningsDeliveries.length - 1];
  const lastBowlerId = (isOverJustFinished && lastDelivery) ? getId(lastDelivery.bowler) : undefined;

  // Validation before scoring a delivery
  const checkBeforeScoring = () => {
    if (!currentInnings?.currentBowler) {
      setIsBowlerModalOpen(true);
      setActionError('Please select an active bowler for this over before scoring a delivery.');
      return false;
    }
    if (!currentInnings?.striker) {
      setBatsmanPosition('striker');
      setIsBatsmanModalOpen(true);
      setActionError('Please select a striker batsman before scoring a delivery.');
      return false;
    }
    return true;
  };

  const handlePostBallFlow = (res: any) => {
    if (!res || !res.match) return;
    if (res.match.status === 'Completed' || res.match.status === 'Innings Break') return;

    const inn = res.match.innings.find((i: any) => i.inningsNumber === res.match.currentInningsNumber);
    if (!inn) return;

    // Over completed! Prompt for next bowler
    if (!inn.currentBowler) {
      setIsBowlerModalOpen(true);
    }

    // Dismissal occurred! Prompt for next batsman
    if (!inn.striker) {
      setBatsmanPosition('striker');
      setIsBatsmanModalOpen(true);
    } else if (!inn.nonStriker && !match.customRules?.lastManStandsAlone) {
      setBatsmanPosition('nonStriker');
      setIsBatsmanModalOpen(true);
    }
  };

  // Handlers
  const handleScoreRuns = async (runs: number) => {
    if (!checkBeforeScoring()) return;
    const res = await scoreBall({ runsOffBat: runs });
    handlePostBallFlow(res);
  };

  const handleScoreExtra = async (extraType: 'Wide' | 'NoBall' | 'Bye' | 'LegBye', runningRuns = 0, runsOffBat = 0) => {
    if (!checkBeforeScoring()) return;
    const res = await scoreBall({
      extraType,
      runningExtraRuns: runningRuns,
      runsOffBat
    });
    handlePostBallFlow(res);
  };

  const handleConfirmWicket = async (payload: any) => {
    if (!checkBeforeScoring()) return;
    const res = await scoreBall(payload);
    setIsWicketModalOpen(false);
    handlePostBallFlow(res);
  };

  const handleStartMatch = async () => {
    try {
      const tWinner = tossWinnerId || getId(match.teamA.teamId);
      await startMatch(match._id, {
        tossWinnerId: tWinner,
        tossDecision
      });
      refreshMatch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to start match');
    }
  };

  const handleStart2ndInnings = async () => {
    try {
      await startSecondInnings(match._id, {});
      refreshMatch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to start 2nd innings');
    }
  };

  const handleEndMatch = async () => {
    if (window.confirm('Are you sure you want to conclude this match and update standings?')) {
      try {
        await endMatch(match._id);
        refreshMatch();
      } catch (err: any) {
        setActionError(err.response?.data?.message || err.message || 'Failed to end match');
      }
    }
  };

  const handleSaveRules = async (updatedRules: CustomRules, totalOvers?: number) => {
    try {
      await updateMatch(match._id, { 
        customRules: updatedRules,
        ...(totalOvers ? { totalOvers } : {})
      });
      refreshMatch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update rules');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Top Action Bar & Rules Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Scorer Control Console
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            ADMIN
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>MSCA Rules</span>
          </button>

          <button
            onClick={() => forceRebuild(match.currentInningsNumber)}
            title="Recalculate innings from raw ball stream"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Replay Sync</span>
          </button>
        </div>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-between text-xs text-rose-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-white px-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Match Scoreboard Header */}
      <LiveHeader match={match} />

      {/* UPCOMING MATCH / TOSS SETUP VIEW */}
      {match.status === 'Upcoming' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">🏏 Match Toss & Opening Lineup</h2>
            <p className="text-xs text-slate-400">Conduct the coin toss and elect to bat or bowl</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Toss Winner
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTossWinnerId(getId(teamA))}
                  className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                    tossWinnerId === getId(teamA) || !tossWinnerId
                      ? 'bg-sky-600/30 text-sky-200 border-sky-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {teamA?.name || 'Team A'}
                </button>
                <button
                  type="button"
                  onClick={() => setTossWinnerId(getId(teamB))}
                  className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                    tossWinnerId === getId(teamB)
                      ? 'bg-sky-600/30 text-sky-200 border-sky-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {teamB?.name || 'Team B'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Elected To
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTossDecision('bat')}
                  className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                    tossDecision === 'bat'
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Bat First
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision('bowl')}
                  className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                    tossDecision === 'bowl'
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Bowl First
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartMatch}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Match (1st Innings)</span>
            </button>
          </div>
        </div>
      )}

      {/* INNINGS BREAK VIEW */}
      {match.status === 'Innings Break' && (
        <div className="glass-panel p-6 space-y-4 text-center">
          <h2 className="text-xl font-bold text-amber-300">☕ 1st Innings Completed</h2>
          <p className="text-sm text-slate-300">
            {teamA?.name} scored <strong>{match.innings[0]?.totalRuns}/{match.innings[0]?.wickets}</strong> in {match.innings[0]?.overs} overs.
            Target: <strong>{match.innings[0]?.totalRuns + 1} runs</strong>.
          </p>
          <button
            onClick={handleStart2ndInnings}
            className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 inline-flex items-center space-x-2"
          >
            <FastForward className="w-4 h-4" />
            <span>Start 2nd Innings</span>
          </button>
        </div>
      )}

      {/* ACTIVE SCORING CONTROLS (When LIVE) */}
      {match.status === 'Live' && (
        <div className="space-y-6">
          
          {/* Active Crease Batsmen & Bowler Spell */}
          <CreaseCard
            match={match}
            isScorerMode={true}
            onSelectStriker={() => {
              setBatsmanPosition('striker');
              setIsBatsmanModalOpen(true);
            }}
            onSelectNonStriker={() => {
              setBatsmanPosition('nonStriker');
              setIsBatsmanModalOpen(true);
            }}
            onSelectBowler={() => setIsBowlerModalOpen(true)}
          />

          {/* Over Finished / Need Bowler Alert Banner */}
          {!currentInnings?.currentBowler && (
            <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-indigo-200 animate-in fade-in">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="font-bold">
                  {legalBallCount > 0 ? '🎉 Over completed!' : '🚀 New innings started!'} Please choose the bowler for the next over.
                </span>
              </div>
              <button
                onClick={() => setIsBowlerModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shrink-0 shadow-md shadow-indigo-500/30"
              >
                Select Bowler
              </button>
            </div>
          )}

          {/* Touch Scoring Keypad & Extras Controls */}
          <div className="glass-panel p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                ⚡ TOUCH SCORING KEYPAD
              </span>
              <span className="text-xs text-slate-400">
                Tap number to score runs off bat
              </span>
            </div>

            {/* Big Run Buttons */}
            <Keypad onScoreRuns={handleScoreRuns} disabled={submitting} />

            {/* Extras, Wicket & Undo Actions */}
            <ExtrasGrid
              onScoreExtra={handleScoreExtra}
              onOpenWicketModal={() => setIsWicketModalOpen(true)}
              onUndo={() => undoBall(match.currentInningsNumber)}
              onSwapStrike={() => swapEnds(match.currentInningsNumber)}
              disabled={submitting}
            />
          </div>

          {/* Over Timeline with historical tap-to-edit */}
          <OverTimeline
            deliveries={deliveries}
            canEdit={true}
            onSelectDelivery={(del) => setSelectedDeliveryToEdit(del)}
          />

          {/* End Match Option */}
          <div className="flex justify-end">
            <button
              onClick={handleEndMatch}
              className="px-4 py-2 rounded-xl border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-300 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Conclude Match Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Complete Scorecard Tables */}
      <ScorecardTabs match={match} />

      {/* MODALS */}
      <WicketModal
        isOpen={isWicketModalOpen}
        onClose={() => setIsWicketModalOpen(false)}
        match={match}
        onConfirmWicket={handleConfirmWicket}
      />

      <BatsmanPickerModal
        isOpen={isBatsmanModalOpen}
        onClose={() => setIsBatsmanModalOpen(false)}
        match={match}
        position={batsmanPosition}
        onSelectBatsman={selectBatsman}
      />

      <BowlerPickerModal
        isOpen={isBowlerModalOpen}
        onClose={() => setIsBowlerModalOpen(false)}
        match={match}
        lastBowlerId={lastBowlerId}
        title={!currentInnings?.currentBowler && isOverJustFinished ? "🎉 Over Complete! Select Next Bowler" : undefined}
        onSelectBowler={selectBowler}
      />

      <EditBallDrawer
        isOpen={!!selectedDeliveryToEdit}
        onClose={() => setSelectedDeliveryToEdit(null)}
        delivery={selectedDeliveryToEdit}
        match={match}
        onSaveEdit={updateHistoricalDelivery}
      />

      <RulesConfigModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        match={match}
        onSaveRules={handleSaveRules}
      />

    </div>
  );
};
