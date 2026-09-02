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
