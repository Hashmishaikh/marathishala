import axios from 'axios';
import { Platform } from 'react-native';
import type { 
  Team, 
  Player, 
  Match, 
  Series, 
  Delivery, 
  SeriesLeaderboards 
} from '../types';

const getDefaultHost = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001';
  }
  return 'http://localhost:5001';
};

let currentBaseUrl = process.env.EXPO_PUBLIC_API_URL || `${getDefaultHost()}/api`;
let currentSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || getDefaultHost();

export const getApiBaseUrl = () => currentBaseUrl;
export const getSocketUrl = () => currentSocketUrl;

export const setApiBaseUrl = (newUrl: string) => {
  let cleaned = newUrl.trim().replace(/\/$/, '');
  if (!cleaned.endsWith('/api')) {
    currentSocketUrl = cleaned;
    currentBaseUrl = `${cleaned}/api`;
  } else {
    currentBaseUrl = cleaned;
    currentSocketUrl = cleaned.replace(/\/api$/, '');
  }
  apiClient.defaults.baseURL = currentBaseUrl;
};

export const apiClient = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Teams API
export const getTeams = async (): Promise<Team[]> => {
  const res = await apiClient.get('/teams');
  return res.data;
};

export const createTeam = async (data: Partial<Team>): Promise<Team> => {
  const res = await apiClient.post('/teams', data);
  return res.data;
};

export const updateTeam = async (id: string, data: Partial<Team>): Promise<Team> => {
  const res = await apiClient.put(`/teams/${id}`, data);
  return res.data;
};

export const deleteTeam = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/teams/${id}`);
  return res.data;
};

// Players API
export const getPlayers = async (params?: { search?: string; role?: string }): Promise<Player[]> => {
  const res = await apiClient.get('/players', { params });
  return res.data;
};

export const getPlayerById = async (id: string): Promise<Player> => {
  const res = await apiClient.get(`/players/${id}`);
  return res.data;
};

export const createPlayer = async (data: Partial<Player>): Promise<Player> => {
  const res = await apiClient.post('/players', data);
  return res.data;
};

export const updatePlayer = async (id: string, data: Partial<Player>): Promise<Player> => {
  const res = await apiClient.put(`/players/${id}`, data);
  return res.data;
};

export const deletePlayer = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/players/${id}`);
  return res.data;
};

export const syncPlayerStats = async (): Promise<{ message: string }> => {
  const res = await apiClient.post('/players/sync-stats');
  return res.data;
};

// Series / Tournaments API
export const getSeriesList = async (): Promise<Series[]> => {
  const res = await apiClient.get('/series');
  return res.data;
};

export const getSeriesById = async (id: string): Promise<Series> => {
  const res = await apiClient.get(`/series/${id}`);
  return res.data;
};

export const createSeries = async (data: Partial<Series>): Promise<Series> => {
  const res = await apiClient.post('/series', data);
  return res.data;
};

export const updateSeries = async (id: string, data: Partial<Series>): Promise<Series> => {
  const res = await apiClient.put(`/series/${id}`, data);
  return res.data;
};

export const getSeriesPointsTable = async (id: string): Promise<{ seriesName: string; pointsTable: any[] }> => {
  const res = await apiClient.get(`/series/${id}/points-table`);
  return res.data;
};

export const getSeriesLeaderboards = async (id: string): Promise<SeriesLeaderboards> => {
  const res = await apiClient.get(`/series/${id}/leaderboards`);
  return res.data;
};

export const getSeriesSummary = async (id: string): Promise<any> => {
  const res = await apiClient.get(`/series/${id}/summary`);
  return res.data;
};

export const generateSeriesMatches = async (id: string, payload: any): Promise<{ message: string; matches: Match[] }> => {
  const res = await apiClient.post(`/series/${id}/generate-matches`, payload);
  return res.data;
};

export const addSeriesMatch = async (id: string, payload: any): Promise<{ message: string; match: Match }> => {
  const res = await apiClient.post(`/series/${id}/add-match`, payload);
  return res.data;
};

// Matches API
export const getMatches = async (params?: { seriesId?: string; status?: string }): Promise<Match[]> => {
  const res = await apiClient.get('/matches', { params });
  return res.data;
};

export const getMatchById = async (id: string): Promise<Match> => {
  const res = await apiClient.get(`/matches/${id}`);
  return res.data;
};

export const createMatch = async (data: any): Promise<Match> => {
  const res = await apiClient.post('/matches', data);
  return res.data;
};

export const startMatch = async (id: string, data: any): Promise<Match> => {
  const res = await apiClient.post(`/matches/${id}/start`, data);
  return res.data;
};

export const startSecondInnings = async (id: string, data: any): Promise<Match> => {
  const res = await apiClient.post(`/matches/${id}/start-second-innings`, data);
  return res.data;
};

export const updateMatch = async (id: string, data: any): Promise<Match> => {
  const res = await apiClient.put(`/matches/${id}`, data);
  return res.data;
};

export const endMatch = async (id: string, data?: any): Promise<{ message: string; match: Match }> => {
  const res = await apiClient.post(`/matches/${id}/end-match`, data || {});
  return res.data;
};

export const deleteMatch = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/matches/${id}`);
  return res.data;
};

// Touch Scoring API
export const getDeliveries = async (matchId: string, inningsNumber?: number): Promise<Delivery[]> => {
  const res = await apiClient.get(`/score/${matchId}/deliveries`, {
    params: { inningsNumber }
  });
  return res.data;
};

export const recordBall = async (matchId: string, payload: any): Promise<{ match: Match; delivery: Delivery }> => {
  const res = await apiClient.post(`/score/${matchId}/ball`, payload);
  return res.data;
};

export const undoLastBall = async (matchId: string, inningsNumber?: number): Promise<{ match: Match; undoneDelivery: Delivery }> => {
  const res = await apiClient.post(`/score/${matchId}/undo`, { inningsNumber });
  return res.data;
};

export const editDelivery = async (deliveryId: string, payload: any): Promise<{ match: Match; delivery: Delivery }> => {
  const res = await apiClient.put(`/score/delivery/${deliveryId}`, payload);
  return res.data;
};

export const swapStrike = async (matchId: string, inningsNumber?: number): Promise<Match> => {
  const res = await apiClient.post(`/score/${matchId}/swap-strike`, { inningsNumber });
  return res.data;
};

export const setIncomingBatsman = async (
  matchId: string, 
  payload: { playerId: string; position?: 'striker' | 'nonStriker'; isOppositeHand?: boolean; inningsAttempt?: number }
): Promise<Match> => {
  const res = await apiClient.post(`/score/${matchId}/set-batsman`, payload);
  return res.data;
};

export const setActiveBowler = async (matchId: string, bowlerId: string): Promise<Match> => {
  const res = await apiClient.post(`/score/${matchId}/set-bowler`, { bowlerId });
  return res.data;
};

export const rebuildInnings = async (matchId: string, inningsNumber: number): Promise<{ match: Match; deliveries: Delivery[] }> => {
  const res = await apiClient.post(`/score/${matchId}/rebuild`, { inningsNumber });
  return res.data;
};

export default apiClient;
