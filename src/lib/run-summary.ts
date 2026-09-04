import { ROUND_LABELS } from "@/lib/bracket";
import { MAX_SERIES_GAMES } from "@/lib/match";
import {
  ROUND_PHRASE,
  opponentOf,
  roundIndexOf,
  seriesFor,
  squadGameScore,
  squadPath,
  squadSeriesScore,
  squadSideOf,
} from "@/lib/tournament-view";
import type { Bracket, BracketOpponent, BracketRoundId } from "@/types/bracket";
import type { GameResult, MatchSideId, SeriesState } from "@/types/match";

// Every recap figure derives from these rows, so the bracket is traversed once.
export type RunPathRow = {
  round: BracketRoundId;
  label: string;
  opponent: BracketOpponent | null;
  squadSide: MatchSideId;
  squadWins: number;
  opponentWins: number;
  won: boolean;
  games: readonly GameResult[];
};

// Decided series only — an in-flight or unreached round is absent, not greyed.
export const runPath = (
  bracket: Bracket,
  series: readonly SeriesState[]
): RunPathRow[] => {
  const rows: RunPathRow[] = [];

  for (const entry of squadPath(bracket)) {
    if (!entry.matchup) continue;

    const played = seriesFor(series, entry.matchup.id);
    if (!played?.winner) continue;

    const squadSide = squadSideOf(entry.matchup);
    const { squadWins, opponentWins } = squadSeriesScore(entry.matchup, played);

    rows.push({
      round: entry.round,
      label: ROUND_LABELS[entry.round],
      opponent: opponentOf(entry.matchup),
      squadSide,
      squadWins,
      opponentWins,
      won: played.winner === squadSide,
      games: played.games,
    });
  }

  return rows;
};

// The round that ended the run, or `null` if the squad was never beaten.
export const eliminationRow = (
  path: readonly RunPathRow[]
): RunPathRow | null => path.find((row) => !row.won) ?? null;

export type PlayoffRecord = {
  wins: number;
  losses: number;
};

export const playoffRecord = (path: readonly RunPathRow[]): PlayoffRecord =>
  path.reduce(
    (record, row) => ({
      wins: record.wins + row.squadWins,
      losses: record.losses + row.opponentWins,
    }),
    { wins: 0, losses: 0 }
  );

export const recordLabel = ({ wins, losses }: PlayoffRecord): string =>
  `${wins}-${losses}`;

export const gamesPlayed = (path: readonly RunPathRow[]): number =>
  path.reduce((total, row) => total + row.games.length, 0);

export type ScoringLeader = {
  playerSeasonId: string;
  playerName: string;
  points: number;
  gamesPlayed: number;
  pointsPerGame: number;
};

// Points are the only stat in the database, so PPG is the only rate available.
export const runScoringLeader = (
  path: readonly RunPathRow[]
): ScoringLeader | null => {
  const totals = new Map<string, { name: string; points: number }>();

  for (const row of path) {
    for (const game of row.games) {
      for (const line of game.scoring) {
        if (line.side !== row.squadSide) continue;

        const current = totals.get(line.playerSeasonId);

        if (current) current.points += line.points;
        else
          totals.set(line.playerSeasonId, {
            name: line.playerName,
            points: line.points,
          });
      }
    }
  }

  const played = gamesPlayed(path);
  let leader: ScoringLeader | null = null;

  for (const [playerSeasonId, { name, points }] of totals) {
    if (leader && points <= leader.points) continue;

    leader = {
      playerSeasonId,
      playerName: name,
      points,
      gamesPlayed: played,
      // Every drafted player plays every game, so squad games is the right divisor.
      pointsPerGame: played === 0 ? 0 : Math.round((points / played) * 10) / 10,
    };
  }

  return leader;
};

export type SignatureGame = {
  key: string;
  gameNumber: number;
  round: BracketRoundId;
  label: string;
  squadPoints: number;
  opponentPoints: number;
  opponent: BracketOpponent | null;
  scorerName: string;
  scorerPoints: number;
};

const marginOf = (row: RunPathRow, game: GameResult): number => {
  const { squadPoints, opponentPoints } = squadGameScore(row.squadSide, game);

  return squadPoints - opponentPoints;
};

// Wins only ("over the ..."), ranked by round, then game 7, then margin, then game.
const isBetterSignature = (
  candidate: RunPathRow,
  candidateGame: GameResult,
  best: RunPathRow,
  bestGame: GameResult
): boolean => {
  const rank = (row: RunPathRow, game: GameResult): number[] => [
    roundIndexOf(row.round),
    game.gameNumber === MAX_SERIES_GAMES ? 1 : 0,
    marginOf(row, game),
    game.gameNumber,
  ];

  const left = rank(candidate, candidateGame);
  const right = rank(best, bestGame);

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }

  return false;
};

export const signatureGame = (
  path: readonly RunPathRow[]
): SignatureGame | null => {
  let bestRow: RunPathRow | null = null;
  let bestGame: GameResult | null = null;

  for (const row of path) {
    for (const game of row.games) {
      if (game.winner !== row.squadSide) continue;

      if (
        !bestRow ||
        !bestGame ||
        isBetterSignature(row, game, bestRow, bestGame)
      ) {
        bestRow = row;
        bestGame = game;
      }
    }
  }

  if (!bestRow || !bestGame) return null;

  const top = bestGame.scoring
    .filter((line) => line.side === bestRow.squadSide)
    .reduce<{ playerName: string; points: number } | null>(
      (best, line) => (best && line.points <= best.points ? best : line),
      null
    );

  return {
    key: bestGame.seed,
    gameNumber: bestGame.gameNumber,
    round: bestRow.round,
    label: bestRow.label,
    ...squadGameScore(bestRow.squadSide, bestGame),
    opponent: bestRow.opponent,
    scorerName: top?.playerName ?? "",
    scorerPoints: top?.points ?? 0,
  };
};

export const opponentLabel = (opponent: BracketOpponent | null): string =>
  opponent ? `${opponent.seasonYear} ${opponent.teamName}` : "Opponent";

export const CHAMPION_OVERLINE = "THE RUN IS COMPLETE";

// From ROUND_PHRASE, never the bare label — concatenating an article gives "THE ROUND 1".
export const eliminationHeadline = (row: RunPathRow | null): string =>
  `ELIMINATED IN ${(row ? ROUND_PHRASE[row.round] : "the playoffs").toUpperCase()}`;

// The one line that reads opponent-first — it is the opponent's sentence.
export const defeatSubtitle = (row: RunPathRow): string =>
  `${opponentLabel(row.opponent)} won the series ${row.opponentWins}-${row.squadWins}`;

// Built here so an unresolved opponent drops the clause instead of doubling the article.
export const signatureLine = (signature: SignatureGame): string => {
  const score = `${signature.squadPoints}-${signature.opponentPoints}`;
  const over = signature.opponent
    ? ` over the ${opponentLabel(signature.opponent)}`
    : "";

  return `Game ${signature.gameNumber} · ${signature.label} · ${score}${over}`;
};
