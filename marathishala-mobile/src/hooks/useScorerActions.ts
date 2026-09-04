import { useState } from 'react';
import {
  recordBall,
  undoLastBall,
  swapStrike,
  setIncomingBatsman,
  setActiveBowler,
  editDelivery,
  rebuildInnings
} from '../services/api';
import type { Match, Delivery } from '../types';

export function useScorerActions(matchId: string | undefined, onSuccess?: (match: Match) => void) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = async <T,>(actionFn: () => Promise<T>): Promise<T | null> => {
    if (!matchId) return null;
    try {
      setSubmitting(true);
      setActionError(null);
      const res = await actionFn();
      return res;
    } catch (err: any) {
      console.error('Scorer Action Error:', err);
      const msg = err.response?.data?.message || err.message || 'Action failed';
      setActionError(msg);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const scoreBall = async (payload: {
    runsOffBat?: number;
    extraType?: 'None' | 'Wide' | 'NoBall' | 'Bye' | 'LegBye';
    runningExtraRuns?: number;
    isWicket?: boolean;
    wicket?: any;
    bowlerId?: string;
    strikerId?: string;
    nonStrikerId?: string;
    customPenaltyRuns?: number;
  }) => {
    const res = await handleAction(() => recordBall(matchId!, payload));
    if (res && onSuccess) onSuccess(res.match);
    return res;
  };

  const undoBall = async (inningsNumber?: number) => {
    const res = await handleAction(() => undoLastBall(matchId!, inningsNumber));
    if (res && onSuccess) onSuccess(res.match);
    return res;
  };

  const swapEnds = async (inningsNumber?: number) => {
    const res = await handleAction(() => swapStrike(matchId!, inningsNumber));
    if (res && onSuccess) onSuccess(res);
    return res;
  };

  const selectBatsman = async (payload: {
    playerId: string;
    position?: 'striker' | 'nonStriker';
    isOppositeHand?: boolean;
    inningsAttempt?: number;
  }) => {
    const res = await handleAction(() => setIncomingBatsman(matchId!, payload));
    if (res && onSuccess) onSuccess(res);
    return res;
  };

  const selectBowler = async (bowlerId: string) => {
    const res = await handleAction(() => setActiveBowler(matchId!, bowlerId));
    if (res && onSuccess) onSuccess(res);
    return res;
  };

  const updateHistoricalDelivery = async (deliveryId: string, payload: Partial<Delivery>) => {
    const res = await handleAction(() => editDelivery(deliveryId, payload));
    if (res && onSuccess) onSuccess(res.match);
    return res;
  };

  const forceRebuild = async (inningsNumber: number) => {
    const res = await handleAction(() => rebuildInnings(matchId!, inningsNumber));
    if (res && onSuccess) onSuccess(res.match);
    return res;
  };

  return {
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
  };
}
