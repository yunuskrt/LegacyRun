// Matchup slots, not squad/opponent — the far half has two historical sides.
export type MatchSideId = "HOME" | "AWAY";

export type MatchPlayer = {
  playerSeasonId: string;
  playerName: string;
  minutesPlayed: number;
  boxPlusMinus: number | null;
  playerEfficiencyRating: number | null;
};

// `kind` picks the rating rule: minutes-weighted for a team, compressed for a squad.
export type MatchTeam = {
  kind: "SQUAD" | "OPPONENT";
  id: string;
  name: string;
  players: MatchPlayer[];
};

// Points only — the database holds no other stat, and inventing one is forbidden.
export type MatchEvent = {
  possession: number;
  period: number;
  clock: string;
  side: MatchSideId;
  playerSeasonId: string;
  playerName: string;
  points: 2 | 3;
  andOne: boolean;
  homeScore: number;
  awayScore: number;
};

export type PeriodScore = {
  period: number;
  home: number;
  away: number;
};

export type ScoringLine = {
  side: MatchSideId;
  playerSeasonId: string;
  playerName: string;
  points: number;
};

export type GameResult = {
  gameNumber: number;
  seed: string;
  hostSide: MatchSideId;
  homeScore: number;
  awayScore: number;
  periodScores: PeriodScore[];
  winner: MatchSideId;
  events: MatchEvent[];
  scoring: ScoringLine[];
};

export type SeriesState = {
  matchupId: string;
  homeWins: number;
  awayWins: number;
  winner: MatchSideId | null;
  games: GameResult[];
};

export type OpponentRoster = {
  teamSeasonId: string;
  players: MatchPlayer[];
};

export type MatchData = {
  squad: MatchPlayer[];
  opponents: OpponentRoster[];
};
