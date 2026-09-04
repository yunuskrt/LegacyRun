// Metrics are non-null because rate-players.py drops unrateable (MP = 0) rows.
export type RatedPlayerSeason = {
  Season: string;
  Rank: number;
  PlayerName: string;
  Age: number;
  TeamSlug: string[];
  Position: string;
  GamesPlayed: number;
  MinutesPlayed: number;
  PlayerEfficiencyRating: number;
  BoxPlusMinus: number;
  ValueOverReplacementPlayer: number;
  WinSharesPer48Min: number;
  PlayerSlug: string;
  Rating: number;
};
