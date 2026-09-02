export interface PlayerStats {
  matches: number;
  innings: number;
  runs: number;
  ballsFaced: number;
  highestScore: number;
  fifties: number;
  hundreds: number;
  notOuts: number;
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  bestBowling: {
    wickets: number;
    runs: number;
  };
  catches: number;
  stumpings: number;
  runOuts: number;
}

export interface Player {
  _id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  battingStyle: 'Right-hand' | 'Left-hand';
  bowlingStyle: 'Right-arm Fast' | 'Left-arm Fast' | 'Right-arm Spin' | 'Left-arm Spin' | 'None';
  avatar?: string;
  stats?: PlayerStats;
}

export interface Team {
  _id: string;
  name: string;
  shortCode: string;
  logoUrl?: string;
  colorHex?: string;
}

export interface CustomRules {
  widePenaltyRuns: number; // 0, 1, 2
  noBallPenaltyRuns: number; // 0, 1, 2
  allOutThresholdType: 'AllPlayersOut' | 'StandardPartnership';
  allowDoubleBatting: boolean;
  oppositeHandRule: boolean;
  lastManStandsAlone: boolean;
}

export interface TeamSquadConfig {
  teamId: Team | string;
  players: (Player | string)[];
  maxWickets: number;
}

export interface BatsmanInningsStat {
  player: Player | string;
  inningsAttempt: number;
  isOppositeHand: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal: string;
  bowler?: Player | string | null;
  fielder?: Player | string | null;
}

export interface BowlerInningsStat {
  player: Player | string;
  overs: number;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  playerOut: Player | string;
}

export interface Innings {
  inningsNumber: number;
  battingTeam: Team | string;
  bowlingTeam: Team | string;
  totalRuns: number;
  wickets: number;
  maxWicketsForInnings: number;
  overs: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  striker?: Player | string | null;
  nonStriker?: Player | string | null;
  currentBowler?: Player | string | null;
  batsmenStats: BatsmanInningsStat[];
  bowlerStats: BowlerInningsStat[];
  fallOfWickets: FallOfWicket[];
}

export interface MatchResult {
  winner?: Team | string | null;
  margin?: string;
  winType?: 'runs' | 'wickets' | 'tie' | 'draw' | 'no_result' | '';
}

export interface Match {
  _id: string;
  seriesId?: Series | string | null;
  title: string;
  venue?: string;
  totalOvers: number;
  customRules: CustomRules;
  teamA: TeamSquadConfig;
  teamB: TeamSquadConfig;
  status: 'Upcoming' | 'Live' | 'Innings Break' | 'Completed';
  currentInningsNumber: number;
  toss?: {
    winner?: Team | string | null;
    decision: 'bat' | 'bowl';
  };
  result?: MatchResult;
  innings: Innings[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryWicket {
  dismissalType: 'Bowled' | 'Caught' | 'Caught Behind' | 'Caught & Bowled' | 'LBW' | 'Stumped' | 'Run Out' | 'Hit Wicket' | 'Retired';
  playerOut: Player | string;
  bowlerCredit: boolean;
  primaryFielder?: Player | string | null;
  assistedBy?: Player | string | null;
}

export interface Delivery {
  _id: string;
  matchId: string;
  inningsNumber: number;
  overNumber: number;
  ballNumber: number;
  bowler: Player;
  striker: Player;
  nonStriker?: Player | null;
  runsOffBat: number;
  extraType: 'None' | 'Wide' | 'NoBall' | 'Bye' | 'LegBye';
  penaltyExtraRuns: number;
  runningExtraRuns: number;
  isWicket: boolean;
  wicket?: DeliveryWicket | null;
  createdAt: string;
}

export interface PointsTableEntry {
  team: Team;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  netRunRate: number;
}

export interface Series {
  _id: string;
  name: string;
  format: 'Gully Box' | 'T20' | 'ODI' | 'Custom Overs';
  defaultOvers: number;
  totalMatches?: number;
  description?: string;
  teams: (Team | string)[];
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  pointsTable: PointsTableEntry[];
  createdAt?: string;
}

export interface LeaderboardPlayerEntry {
  player: Player;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highestScore: number;
  fifties?: number;
  hundreds?: number;
  notOuts?: number;
  average: number;
  strikeRate: number;
  wickets: number;
  overs: string;
  ballsBowled?: number;
  maidens?: number;
  runsConceded?: number;
  bestBowling?: { wickets: number; runs: number };
  economy: number;
}

export interface SeriesLeaderboards {
  orangeCap: LeaderboardPlayerEntry | null;
  purpleCap: LeaderboardPlayerEntry | null;
  topBatsmen: LeaderboardPlayerEntry[];
  topBowlers: LeaderboardPlayerEntry[];
}

export interface SeriesSummary {
  series: Series;
  seriesStatusText: string;
  totalMatches: number;
  completedMatchesCount: number;
  liveMatchesCount: number;
  upcomingMatchesCount: number;
  teamWins: { [teamId: string]: number };
  matches: Match[];
  pointsTable: PointsTableEntry[];
  leaderboards: SeriesLeaderboards;
}
