import { squadRatingOf } from "@/lib/run";
import { squadGameScore, squadSideOf } from "@/lib/tournament-view";
import type { ReplaySpeed } from "@/lib/replay";
import type { BracketMatchup } from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { GameResult, SeriesState } from "@/types/match";

export type ReplayMode = "MANUAL" | "AUTOMATIC";

export const REPLAY_SPEEDS: readonly ReplaySpeed[] = ["SLOW", "NORMAL", "FAST"];
export const REPLAY_MODES: readonly ReplayMode[] = ["MANUAL", "AUTOMATIC"];

export const DEFAULT_SPEED: ReplaySpeed = "NORMAL";
export const DEFAULT_MODE: ReplayMode = "MANUAL";

// Outside the run of play, so speed deliberately does not scale them.
export const FACE_OFF_MS = 2000;
export const NEXT_GAME_MS = 2000;
export const SERIES_CARD_MS = 2500;

export type SeriesStage =
  "FACE_OFF" | "GAME" | "GAME_FINAL" | "SERIES_WON" | "SERIES_LOST";

// `NONE` advances itself — the replay's event timer owns the run of play.
export type StageAdvance =
  { kind: "AUTO"; delayMs: number } | { kind: "CLICK" } | { kind: "NONE" };

export const stageAdvance = (
  stage: SeriesStage,
  mode: ReplayMode
): StageAdvance => {
  switch (stage) {
    case "FACE_OFF":
      return { kind: "AUTO", delayMs: FACE_OFF_MS };
    case "GAME":
      return { kind: "NONE" };
    case "GAME_FINAL":
      return mode === "AUTOMATIC"
        ? { kind: "AUTO", delayMs: NEXT_GAME_MS }
        : { kind: "CLICK" };
    case "SERIES_WON":
      return mode === "AUTOMATIC"
        ? { kind: "AUTO", delayMs: SERIES_CARD_MS }
        : { kind: "CLICK" };
    // A loss always waits for a click, in both modes.
    case "SERIES_LOST":
      return { kind: "CLICK" };
  }
};

export const NO_ADVANCE: StageAdvance = { kind: "NONE" };

// `null` covers CLICK and NONE alike — both mean "do not schedule".
export const advanceDelayMs = (advance: StageAdvance): number | null =>
  advance.kind === "AUTO" ? advance.delayMs : null;

export const seriesEndStage = (
  matchup: BracketMatchup,
  series: SeriesState
): SeriesStage =>
  series.winner === squadSideOf(matchup) ? "SERIES_WON" : "SERIES_LOST";

export const isSeriesEnd = (stage: SeriesStage): boolean =>
  stage === "SERIES_WON" || stage === "SERIES_LOST";

// Makes the end unreachable until every game is watched, rather than trusting the caller.
export const seriesStageOf = (
  tipped: boolean,
  hasCurrentGame: boolean,
  matchup: BracketMatchup,
  series: SeriesState
): SeriesStage => {
  if (!tipped) return "FACE_OFF";
  if (hasCurrentGame) return "GAME";

  return seriesEndStage(matchup, series);
};

// Skipping is an explicit intervention, so it stops here even in Automatic.
export const gameAdvance = (
  isFinal: boolean,
  mode: ReplayMode,
  skipped: boolean
): StageAdvance =>
  isFinal && !skipped ? stageAdvance("GAME_FINAL", mode) : NO_ADVANCE;

export type SquadGameLine = {
  gameNumber: number;
  key: string;
  squadPoints: number;
  opponentPoints: number;
  won: boolean;
  overtimes: number;
};

// Reads from the squad's side, never the home slot's; finished series only.
export const squadGameLines = (
  matchup: BracketMatchup,
  games: readonly GameResult[]
): SquadGameLine[] => {
  const squadSide = squadSideOf(matchup);

  return games.map((game) => ({
    gameNumber: game.gameNumber,
    key: game.seed,
    ...squadGameScore(squadSide, game),
    won: game.winner === squadSide,
    overtimes: Math.max(0, game.periodScores.length - 4),
  }));
};

// An unnamed squad already reads `YOUR SQUAD` above, so the tag would say it twice.
export const faceOffSubLabel = (squad: Squad, isNamed: boolean): string =>
  isNamed
    ? `YOUR SQUAD · AVG ${squadRatingOf(squad)}`
    : `AVG ${squadRatingOf(squad)}`;
