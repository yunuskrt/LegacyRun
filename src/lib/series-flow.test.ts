import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODE,
  DEFAULT_SPEED,
  FACE_OFF_MS,
  NEXT_GAME_MS,
  NO_ADVANCE,
  REPLAY_MODES,
  SERIES_CARD_MS,
  advanceDelayMs,
  faceOffSubLabel,
  gameAdvance,
  isSeriesEnd,
  seriesEndStage,
  seriesStageOf,
  squadGameLines,
  stageAdvance,
} from "@/lib/series-flow";
import type { ReplayMode, SeriesStage } from "@/lib/series-flow";
import type { BracketMatchup, BracketOpponent } from "@/types/bracket";
import type { Squad, SquadMember } from "@/types/game";
import type { GameResult, MatchSideId, SeriesState } from "@/types/match";

const OPPONENT: BracketOpponent = {
  teamSeasonId: "NYK-1993",
  teamSlug: "NYK",
  teamName: "New York Knicks",
  teamLogo: "/logos/NYK.png",
  seasonYear: 1993,
  conference: "EAST",
  seed: 1,
  roundReached: "CONFERENCE_FINALS",
  wins: 9,
  losses: 6,
  pedigree: 70,
};

// The squad sits on either slot depending on where the generator seeded it, so
// every squad-facing helper is exercised from both.
const matchupWithSquadOn = (squadSide: MatchSideId): BracketMatchup => ({
  id: "m1",
  round: "CONFERENCE_SEMIS",
  home:
    squadSide === "HOME"
      ? { side: "SQUAD", bracketSlot: 1 }
      : { side: "OPPONENT", bracketSlot: 2, opponent: OPPONENT },
  away:
    squadSide === "HOME"
      ? { side: "OPPONENT", bracketSlot: 2, opponent: OPPONENT }
      : { side: "SQUAD", bracketSlot: 1 },
  winner: null,
});

const game = (
  gameNumber: number,
  homeScore: number,
  awayScore: number,
  periods = 4
): GameResult => ({
  gameNumber,
  seed: `g${gameNumber}`,
  hostSide: "HOME",
  homeScore,
  awayScore,
  periodScores: Array.from({ length: periods }, (_, index) => ({
    period: index + 1,
    home: 0,
    away: 0,
  })),
  winner: homeScore > awayScore ? "HOME" : "AWAY",
  events: [],
  scoring: [],
});

const series = (winner: MatchSideId | null, games: GameResult[] = []) =>
  ({
    matchupId: "m1",
    homeWins: winner === "HOME" ? 4 : 2,
    awayWins: winner === "AWAY" ? 4 : 2,
    winner,
    games,
  }) satisfies SeriesState;

const member = (rating: number, index: number): SquadMember => ({
  playerSlug: `p${index}`,
  playerSeasonId: `p${index}-1996`,
  name: `Player ${index}`,
  teamName: "Team",
  teamSlug: "TM",
  teamLogo: "/logos/TM.png",
  seasonYear: 1996,
  position: "PG",
  rating,
});

const squadOf = (ratings: number[], name?: string): Squad => ({
  name,
  formation: "TRADITIONAL",
  players: ratings.map(member),
});

const ALL_STAGES: SeriesStage[] = [
  "FACE_OFF",
  "GAME",
  "GAME_FINAL",
  "SERIES_WON",
  "SERIES_LOST",
];

describe("stageAdvance", () => {
  it("runs the face-off on a fixed beat in both modes", () => {
    for (const mode of REPLAY_MODES) {
      expect(stageAdvance("FACE_OFF", mode)).toEqual({
        kind: "AUTO",
        delayMs: FACE_OFF_MS,
      });
    }
  });

  it("never advances the run of play itself", () => {
    for (const mode of REPLAY_MODES) {
      expect(stageAdvance("GAME", mode)).toEqual({ kind: "NONE" });
    }
  });

  it("gates game-to-game on a click in Manual and a beat in Automatic", () => {
    expect(stageAdvance("GAME_FINAL", "MANUAL")).toEqual({ kind: "CLICK" });
    expect(stageAdvance("GAME_FINAL", "AUTOMATIC")).toEqual({
      kind: "AUTO",
      delayMs: NEXT_GAME_MS,
    });
  });

  it("gates a won series the same way", () => {
    expect(stageAdvance("SERIES_WON", "MANUAL")).toEqual({ kind: "CLICK" });
    expect(stageAdvance("SERIES_WON", "AUTOMATIC")).toEqual({
      kind: "AUTO",
      delayMs: SERIES_CARD_MS,
    });
  });

  // The one asymmetry in the table, and the reason it is a table at all.
  it("always waits for a click on a lost series, in both modes", () => {
    for (const mode of REPLAY_MODES) {
      expect(stageAdvance("SERIES_LOST", mode)).toEqual({ kind: "CLICK" });
    }
  });

  it("resolves every (stage, mode) pair", () => {
    for (const stage of ALL_STAGES) {
      for (const mode of REPLAY_MODES) {
        const advance = stageAdvance(stage, mode);

        expect(["AUTO", "CLICK", "NONE"]).toContain(advance.kind);
        if (advance.kind === "AUTO") expect(advance.delayMs).toBeGreaterThan(0);
      }
    }
  });

  it("only ever auto-advances Automatic past a stage Manual would click", () => {
    const clicksInManual = ALL_STAGES.filter(
      (stage) => stageAdvance(stage, "MANUAL").kind === "CLICK"
    );

    expect(clicksInManual).toEqual(["GAME_FINAL", "SERIES_WON", "SERIES_LOST"]);

    const clicksInAutomatic = ALL_STAGES.filter(
      (stage) => stageAdvance(stage, "AUTOMATIC").kind === "CLICK"
    );

    expect(clicksInAutomatic).toEqual(["SERIES_LOST"]);
  });

  it("starts a run on Manual at Normal", () => {
    expect(DEFAULT_MODE).toBe<ReplayMode>("MANUAL");
    expect(DEFAULT_SPEED).toBe("NORMAL");
  });
});

describe("seriesEndStage", () => {
  it("reads the result from the squad's slot, not the home slot", () => {
    expect(seriesEndStage(matchupWithSquadOn("HOME"), series("HOME"))).toBe(
      "SERIES_WON"
    );
    expect(seriesEndStage(matchupWithSquadOn("HOME"), series("AWAY"))).toBe(
      "SERIES_LOST"
    );
    expect(seriesEndStage(matchupWithSquadOn("AWAY"), series("AWAY"))).toBe(
      "SERIES_WON"
    );
    expect(seriesEndStage(matchupWithSquadOn("AWAY"), series("HOME"))).toBe(
      "SERIES_LOST"
    );
  });
});

describe("seriesStageOf", () => {
  const won = series("HOME");
  const lost = series("AWAY");
  const matchup = matchupWithSquadOn("HOME");

  it("opens on the face-off before the tip, whatever else is true", () => {
    expect(seriesStageOf(false, true, matchup, won)).toBe("FACE_OFF");
    expect(seriesStageOf(false, false, matchup, won)).toBe("FACE_OFF");
  });

  it("stays on GAME while a game is left to watch", () => {
    expect(seriesStageOf(true, true, matchup, won)).toBe("GAME");
    expect(seriesStageOf(true, true, matchup, lost)).toBe("GAME");
  });

  // The whole series is simulated up front, so `series.winner` is set from the
  // start. The stage is what keeps it out of reach until every game is watched.
  it("reaches the result only once no game is left", () => {
    expect(seriesStageOf(true, false, matchup, won)).toBe("SERIES_WON");
    expect(seriesStageOf(true, false, matchup, lost)).toBe("SERIES_LOST");
  });

  it("never reports an end stage while a game remains", () => {
    for (const outcome of [won, lost]) {
      for (const side of ["HOME", "AWAY"] as const) {
        expect(
          isSeriesEnd(
            seriesStageOf(true, true, matchupWithSquadOn(side), outcome)
          )
        ).toBe(false);
      }
    }
  });
});

describe("isSeriesEnd", () => {
  // Both outcomes, not just the happy one: a loss ends the series exactly as
  // much as a win does, and only the CTA differs.
  it("counts both outcomes and nothing before them", () => {
    expect(ALL_STAGES.filter(isSeriesEnd)).toEqual([
      "SERIES_WON",
      "SERIES_LOST",
    ]);
  });
});

describe("gameAdvance", () => {
  it("does not advance while the game is still running", () => {
    for (const mode of REPLAY_MODES) {
      expect(gameAdvance(false, mode, false)).toEqual({ kind: "NONE" });
      expect(gameAdvance(false, mode, true)).toEqual({ kind: "NONE" });
    }
  });

  it("hands game-to-game back to the mode at the final buzzer", () => {
    expect(gameAdvance(true, "MANUAL", false)).toEqual({ kind: "CLICK" });
    expect(gameAdvance(true, "AUTOMATIC", false)).toEqual({
      kind: "AUTO",
      delayMs: NEXT_GAME_MS,
    });
  });

  // Skipping is explicit, so it stops at this game's final even in Automatic.
  it("never chains into the next game after a skip, in either mode", () => {
    for (const mode of REPLAY_MODES) {
      expect(advanceDelayMs(gameAdvance(true, mode, true))).toBeNull();
    }
  });
});

describe("advanceDelayMs", () => {
  it("gives a scheduler the delay for AUTO and nothing for the rest", () => {
    expect(advanceDelayMs({ kind: "AUTO", delayMs: 1234 })).toBe(1234);
    expect(advanceDelayMs({ kind: "CLICK" })).toBeNull();
    expect(advanceDelayMs(NO_ADVANCE)).toBeNull();
  });

  // Every stage a mode would gate on a click must be unschedulable, or
  // Automatic's timer would fire behind the button.
  it("leaves every CLICK stage unschedulable in both modes", () => {
    for (const stage of ALL_STAGES) {
      for (const mode of REPLAY_MODES) {
        const advance = stageAdvance(stage, mode);

        expect(advanceDelayMs(advance) === null).toBe(advance.kind !== "AUTO");
      }
    }
  });
});

describe("squadGameLines", () => {
  const games = [game(1, 104, 98), game(2, 96, 103), game(3, 110, 99, 5)];

  it("prints the squad's points first when the squad is at home", () => {
    const lines = squadGameLines(matchupWithSquadOn("HOME"), games);

    expect(
      lines.map((line) => [line.squadPoints, line.opponentPoints])
    ).toEqual([
      [104, 98],
      [96, 103],
      [110, 99],
    ]);
    expect(lines.map((line) => line.won)).toEqual([true, false, true]);
  });

  it("flips both the score and the result when the squad is away", () => {
    const lines = squadGameLines(matchupWithSquadOn("AWAY"), games);

    expect(
      lines.map((line) => [line.squadPoints, line.opponentPoints])
    ).toEqual([
      [98, 104],
      [103, 96],
      [99, 110],
    ]);
    expect(lines.map((line) => line.won)).toEqual([false, true, false]);
  });

  it("counts overtime periods past regulation", () => {
    const lines = squadGameLines(matchupWithSquadOn("HOME"), [
      game(1, 104, 98),
      game(2, 120, 118, 6),
    ]);

    expect(lines.map((line) => line.overtimes)).toEqual([0, 2]);
  });

  it("keeps the game numbers the engine assigned", () => {
    const lines = squadGameLines(matchupWithSquadOn("HOME"), games);

    expect(lines.map((line) => line.gameNumber)).toEqual([1, 2, 3]);
  });
});

describe("faceOffSubLabel", () => {
  it("tags a named squad and prints its average", () => {
    expect(
      faceOffSubLabel(squadOf([90, 90, 90, 90, 90], "Ironside"), true)
    ).toBe("YOUR SQUAD · AVG 90");
  });

  // An unnamed squad already reads YOUR SQUAD as its name.
  it("drops the tag when the name has fallen back, keeping the rating", () => {
    const label = faceOffSubLabel(squadOf([90, 90, 90, 90, 90]), false);

    expect(label).toBe("AVG 90");
    expect(label).not.toContain("YOUR SQUAD");
  });
});
