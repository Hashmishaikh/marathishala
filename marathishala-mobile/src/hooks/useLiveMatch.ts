import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMatchById, getDeliveries, getSocketUrl } from '../services/api';
import type { Match, Delivery } from '../types';

export function useLiveMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(matchId));
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [celebrationEvent, setCelebrationEvent] = useState<{ type: 'FOUR' | 'SIX' | 'WICKET' | 'COMPLETED'; text: string } | null>(null);

  const fetchMatchDetails = useCallback(async () => {
    if (!matchId) {
      setLoading(false);
      setMatch(null);
      setDeliveries([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getMatchById(matchId);
      setMatch(data);

      const delData = await getDeliveries(matchId, data.currentInningsNumber);
      setDeliveries(delData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching match details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatchDetails();
  }, [fetchMatchDetails]);

  useEffect(() => {
    if (!matchId) return;

    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_match', matchId);
    });

    newSocket.on('score_updated', (data: { match: Match; delivery: Delivery }) => {
      setMatch(data.match);
      setDeliveries(prev => [...prev, data.delivery]);

      if (data.delivery?.isWicket) {
        setCelebrationEvent({ type: 'WICKET', text: 'WICKET OUT!' });
      } else if (data.delivery?.runsOffBat === 6) {
        setCelebrationEvent({ type: 'SIX', text: 'MAXIMUM SIX! 💥' });
      } else if (data.delivery?.runsOffBat === 4) {
        setCelebrationEvent({ type: 'FOUR', text: 'CRACKING FOUR! ⚡' });
      }
    });

    newSocket.on('ball_undone', (data: { match: Match; undoneDelivery: Delivery }) => {
      setMatch(data.match);
      setDeliveries(prev => prev.filter(d => d._id !== data.undoneDelivery._id));
    });

    newSocket.on('delivery_edited', (data: { match: Match; delivery: Delivery }) => {
      setMatch(data.match);
      setDeliveries(prev => prev.map(d => d._id === data.delivery._id ? data.delivery : d));
    });

    newSocket.on('match_started', (updatedMatch: Match) => {
      setMatch(updatedMatch);
    });

    newSocket.on('second_innings_started', (updatedMatch: Match) => {
      setMatch(updatedMatch);
      getDeliveries(matchId, 2).then(setDeliveries).catch(console.error);
    });

    newSocket.on('strike_swapped', (updatedMatch: Match) => {
      setMatch(updatedMatch);
    });

    newSocket.on('batsman_set', (updatedMatch: Match) => {
      setMatch(updatedMatch);
    });

    newSocket.on('bowler_set', (updatedMatch: Match) => {
      setMatch(updatedMatch);
    });

    newSocket.on('match_completed', (updatedMatch: Match) => {
      setMatch(updatedMatch);
      setCelebrationEvent({ type: 'COMPLETED', text: 'MATCH FINISHED! 🏆' });
    });

    return () => {
      newSocket.emit('leave_match', matchId);
      newSocket.disconnect();
    };
  }, [matchId]);

  return {
    match,
    deliveries,
    loading,
    error,
    refreshMatch: fetchMatchDetails,
    socket,
    celebrationEvent,
    clearCelebration: () => setCelebrationEvent(null)
  };
}
