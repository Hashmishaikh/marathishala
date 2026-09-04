import type { Match, Player, Team } from '../types';

/**
 * Safely extracts the string ID from a string, ObjectId, or populated document object
 */
export const getId = (entity: any): string => {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  if (typeof entity === 'object') {
    if (entity._id) return entity._id.toString();
    if (entity.id) return entity.id.toString();
  }
  return String(entity);
};

/**
 * Formats overs from decimal representation (e.g. 3.2 overs)
 */
export const formatOvers = (overs: number = 0): string => {
  const fullOvers = Math.floor(overs);
  const balls = Math.round((overs - fullOvers) * 10);
  return `${fullOvers}.${balls}`;
};

/**
 * Calculates current run rate (CRR)
 */
export const calculateRunRate = (runs: number = 0, overs: number = 0): string => {
  const fullOvers = Math.floor(overs);
  const balls = Math.round((overs - fullOvers) * 10);
  const totalBalls = fullOvers * 6 + balls;
  if (totalBalls === 0) return '0.00';
  return ((runs / totalBalls) * 6).toFixed(2);
};

/**
 * Calculates required run rate (RRR)
 */
export const calculateRequiredRunRate = (target: number, currentRuns: number, remainingBalls: number): string => {
  const runsNeeded = target - currentRuns;
  if (runsNeeded <= 0) return '0.00';
  if (remainingBalls <= 0) return '∞';
  return ((runsNeeded / remainingBalls) * 6).toFixed(2);
};

/**
 * Determines the batting and fielding teams and squads for the current or specified innings
 */
export const getTeamBattingAndBowling = (match: Match, inningsNumber?: number) => {
  const innNum = inningsNumber || match.currentInningsNumber;
  const currentInnings = match.innings?.find((i) => i.inningsNumber === innNum) || match.innings?.[0];

  const teamAId = getId(match.teamA?.teamId);
  const teamBId = getId(match.teamB?.teamId);

  const battingTeamId = currentInnings ? getId(currentInnings.battingTeam) : teamAId;
  const isTeamABatting = battingTeamId === teamAId;

  const battingTeam = (isTeamABatting ? match.teamA?.teamId : match.teamB?.teamId) as Team;
  const bowlingTeam = (isTeamABatting ? match.teamB?.teamId : match.teamA?.teamId) as Team;

  const battingSquad = (isTeamABatting ? match.teamA?.players : match.teamB?.players) as Player[] || [];
  const fieldingSquad = (isTeamABatting ? match.teamB?.players : match.teamA?.players) as Player[] || [];

  return {
    isTeamABatting,
    battingTeam,
    bowlingTeam,
    battingTeamId,
    bowlingTeamId: isTeamABatting ? teamBId : teamAId,
    battingSquad,
    fieldingSquad
  };
};
