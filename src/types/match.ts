// The two slots of a bracket matchup, fixed for the whole series. Sides are not
// "squad" and "opponent" because the far half plays itself out — both sides of
// those matchups are historical teams. `GameResult.hostSide` says which slot is
// at home for one game; 2-2-1-1-1 alternates it.
export type MatchSideId = "HOME" | "AWAY";

export type MatchPlayer = {
  playerSeasonId: string;
  playerName: string;
  minutesPlayed: number;
  boxPlusMinus: number | null;
  playerEfficiencyRating: number | null;
};

// `kind` decides how the roster is rated: a real team-season is a minutes-
// weighted mean, a drafted squad is redundancy-weighted and compressed.
export type MatchTeam = {
  kind: "SQUAD" | "OPPONENT";
  id: string;
  name: string;
  players: MatchPlayer[];
};

// No field for rebounds, assists, or shot attempts — the database holds none of
// them, and inventing them next to real players is what the data rules forbid.
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
