import { describe, expect, it } from "vitest";
import { simulateGame } from "@/lib/match";
import {
  BASE_PERIOD_BREAK_MS,
  FEED_LENGTH,
  LEADER_COUNT,
  MAX_EVENT_DELAY_MS,
  MIN_EVENT_DELAY_MS,
  PRE_TIP_CURSOR,
  REGULATION_SECONDS,
  RUN_BADGE_FLOOR,
  SPEED_FACTORS,
  clockToSeconds,
  currentClock,
  currentPeriod,
  eventDelayMs,
  eventsThrough,
  feedThrough,
  gameBudgetMs,
  isLeadChange,
  leadersSoFar,
  lineScoreThrough,
  momentumAxisEnd,
  momentumSeries,
  nextTick,
  periodBoundaries,
  periodBreakLabel,
  periodBreakMs,
  periodLabel,
  periodSummary,
  replayFrame,
  replayStatus,
  scoreAt,
  scoringRun,
  seriesWinsThrough,
  winsAtBuzzer,
} from "@/lib/replay";
import type { ReplaySpeed } from "@/lib/replay";
import type {
  GameResult,
  MatchEvent,
  MatchPlayer,
  MatchSideId,
  MatchTeam,
} from "@/types/match";

const player = (
  id: string,
  boxPlusMinus: number | null,
  minutesPlayed = 2000,
  playerEfficiencyRating: number | null = 15
): MatchPlayer => ({
  playerSeasonId: id,
  playerName: id.toUpperCase(),
  minutesPlayed,
  boxPlusMinus,
  playerEfficiencyRating,
});

const teamAt = (id: string, net: number): MatchTeam => ({
  kind: "OPPONENT",
  id,
  name: id,
  players: Array.from({ length: 5 }, (_, index) =>
    player(`${id}-p${index}`, net / 5, 2000, 10 + index * 4)
  ),
});

const realGame = (seed: string, homeNet = 4, awayNet = 1): GameResult =>
  simulateGame(
    teamAt("home", homeNet),
    teamAt("away", awayNet),
    1,
    "HOME",
    seed
  );

// A hand-built log, so detection is asserted against scores a reader can check by eye.
const event = (
  index: number,
  period: number,
  clock: string,
  side: MatchSideId,
  points: 2 | 3,
  homeScore: number,
  awayScore: number,
  andOne = false
): MatchEvent => ({
  possession: index + 1,
  period,
  clock,
  side,
  playerSeasonId: `${side}-p`,
  playerName: side === "HOME" ? "Home Scorer" : "Away Scorer",
  points,
  andOne,
  homeScore,
  awayScore,
});

// HOME 2, AWAY 3 (lead change), HOME 3 (lead change), HOME 3, HOME 2 (8-0 run)
const HAND_LOG: MatchEvent[] = [
  event(0, 1, "11:30", "HOME", 2, 2, 0),
  event(1, 1, "10:00", "AWAY", 3, 2, 3),
  event(2, 1, "9:00", "HOME", 3, 5, 3),
  event(3, 1, "8:00", "HOME", 3, 8, 3),
  event(4, 1, "7:00", "HOME", 2, 10, 3, true),
];

describe("clockToSeconds", () => {
  it("converts a period clock into elapsed game seconds", () => {
    expect(clockToSeconds("12:00", 1)).toBe(0);
    expect(clockToSeconds("5:42", 1)).toBe(378);
    expect(clockToSeconds("12:00", 2)).toBe(720);
    expect(clockToSeconds("0:00", 4)).toBe(2880);
  });

  it("uses five-minute overtime periods after regulation", () => {
    expect(clockToSeconds("5:00", 5)).toBe(2880);
    expect(clockToSeconds("0:00", 5)).toBe(3180);
    expect(clockToSeconds("5:00", 6)).toBe(3180);
  });
});

describe("eventDelayMs", () => {
  it("scales the game-clock gap by the speed factor", () => {
    const previous = event(0, 1, "10:00", "HOME", 2, 2, 0);
    const next = event(1, 1, "9:40", "AWAY", 2, 2, 2);

    // 20 game-seconds × 8 = 160ms, inside the clamp at Normal.
    expect(eventDelayMs(previous, next, "NORMAL")).toBe(160);
  });

  it("clamps a simultaneous pair up to the floor", () => {
    const previous = event(0, 1, "10:00", "HOME", 2, 2, 0);
    const next = event(1, 1, "10:00", "AWAY", 2, 2, 2);

    expect(eventDelayMs(previous, next, "NORMAL")).toBe(MIN_EVENT_DELAY_MS);
    expect(eventDelayMs(previous, next, "SLOW")).toBe(MIN_EVENT_DELAY_MS);
  });

  it("clamps a long scoreless stretch down to the ceiling", () => {
    const previous = event(0, 1, "11:00", "HOME", 2, 2, 0);
    const next = event(1, 1, "2:00", "AWAY", 2, 2, 2);

    expect(eventDelayMs(previous, next, "NORMAL")).toBe(MAX_EVENT_DELAY_MS);
  });

  it("measures the first event from the start of its period", () => {
    const opener = event(0, 1, "11:00", "HOME", 2, 2, 0);

    expect(eventDelayMs(null, opener, "NORMAL")).toBe(480);
  });

  it("is faster at Fast and slower at Slow for the same gap", () => {
    const previous = event(0, 1, "10:00", "HOME", 2, 2, 0);
    const next = event(1, 1, "9:20", "AWAY", 2, 2, 2);

    const fast = eventDelayMs(previous, next, "FAST");
    const normal = eventDelayMs(previous, next, "NORMAL");
    const slow = eventDelayMs(previous, next, "SLOW");

    expect(fast).toBeLessThan(normal);
    expect(normal).toBeLessThan(slow);
  });
});

describe("pacing budget", () => {
  const budgetFor = (game: GameResult, speed: ReplaySpeed): number =>
    gameBudgetMs(game.events, speed);

  const meanSeconds = (speed: ReplaySpeed): number => {
    const budgets = Array.from({ length: 12 }, (_, index) =>
      budgetFor(realGame(`budget-${index}`), speed)
    );

    return budgets.reduce((a, b) => a + b, 0) / budgets.length / 1000;
  };

  it("finishes a Normal game inside the specced ~25s budget", () => {
    const mean = meanSeconds("NORMAL");

    expect(mean).toBeGreaterThan(20);
    expect(mean).toBeLessThan(30);
  });

  // The budget is the run of play only; breaks add ~1.5s each on top.
  it("lands Slow and Fast on their own documented budgets", () => {
    expect(meanSeconds("SLOW")).toBeGreaterThan(40);
    expect(meanSeconds("SLOW")).toBeLessThan(50);

    // Deliberately under the old 120ms floor's ~12s, so restoring it fails here.
    expect(meanSeconds("FAST")).toBeGreaterThan(9);
    expect(meanSeconds("FAST")).toBeLessThan(11.5);
  });

  // Fast is floor-bound, not factor-bound — halving the factor would not move it.
  it("clamps almost every Fast event to the floor", () => {
    const game = realGame("budget-floor");
    const floored = game.events.filter(
      (event, index) =>
        eventDelayMs(
          index > 0 ? game.events[index - 1] : null,
          event,
          "FAST"
        ) === MIN_EVENT_DELAY_MS
    );

    expect(floored.length / game.events.length).toBeGreaterThan(0.8);
  });

  it("keeps Slow and Fast either side of Normal", () => {
    const game = realGame("budget-order");

    expect(budgetFor(game, "FAST")).toBeLessThan(budgetFor(game, "NORMAL"));
    expect(budgetFor(game, "NORMAL")).toBeLessThan(budgetFor(game, "SLOW"));
  });

  it("scales the period break with speed and holds Normal at the base", () => {
    expect(periodBreakMs("NORMAL")).toBe(BASE_PERIOD_BREAK_MS);
    expect(periodBreakMs("FAST")).toBeLessThan(BASE_PERIOD_BREAK_MS);
    expect(periodBreakMs("SLOW")).toBeGreaterThan(BASE_PERIOD_BREAK_MS);
  });
});

describe("scoreAt and the pre-tip cursor", () => {
  it("reads 0-0 before the first event", () => {
    expect(scoreAt(HAND_LOG, PRE_TIP_CURSOR)).toEqual({ home: 0, away: 0 });
    expect(currentPeriod(HAND_LOG, PRE_TIP_CURSOR)).toBe(1);
    expect(currentClock(HAND_LOG, PRE_TIP_CURSOR)).toBe("12:00");
    expect(eventsThrough(HAND_LOG, PRE_TIP_CURSOR)).toEqual([]);
  });

  it("reads the running total off the cursor event", () => {
    expect(scoreAt(HAND_LOG, 2)).toEqual({ home: 5, away: 3 });
  });
});

describe("scoringRun", () => {
  it("counts consecutive unanswered points for the scoring side", () => {
    expect(scoringRun(HAND_LOG, 4)).toEqual({ side: "HOME", points: 8 });
  });

  it("resets when the other side scores", () => {
    expect(scoringRun(HAND_LOG, 1)).toEqual({ side: "AWAY", points: 3 });
    expect(scoringRun(HAND_LOG, 2)).toEqual({ side: "HOME", points: 3 });
  });

  it("has no run before the first event", () => {
    expect(scoringRun(HAND_LOG, PRE_TIP_CURSOR)).toBeNull();
  });
});

describe("isLeadChange", () => {
  it("fires when the lead actually flips", () => {
    expect(isLeadChange(HAND_LOG, 1)).toBe(true);
    expect(isLeadChange(HAND_LOG, 2)).toBe(true);
  });

  it("does not fire on the opening basket or on extending a lead", () => {
    expect(isLeadChange(HAND_LOG, 0)).toBe(false);
    expect(isLeadChange(HAND_LOG, 3)).toBe(false);
    expect(isLeadChange(HAND_LOG, 4)).toBe(false);
  });

  it("does not fire on going ahead from a tie", () => {
    const tied = [
      event(0, 1, "11:00", "HOME", 2, 2, 0),
      event(1, 1, "10:00", "AWAY", 2, 2, 2),
      event(2, 1, "9:00", "HOME", 2, 4, 2),
    ];

    expect(isLeadChange(tied, 2)).toBe(false);
  });
});

describe("periodBoundaries", () => {
  it("marks the last event of every period the game moves on from", () => {
    const game = realGame("boundaries");
    const boundaries = periodBoundaries(game.events);

    expect(boundaries).toHaveLength(game.periodScores.length - 1);

    for (const index of boundaries) {
      expect(game.events[index].period).toBeLessThan(
        game.events[index + 1].period
      );
    }
  });

  it("does not mark the final period, which ends the game", () => {
    const game = realGame("boundaries-final");
    const boundaries = periodBoundaries(game.events);

    expect(boundaries).not.toContain(game.events.length - 1);
  });

  it("marks the extra period on an overtime game", () => {
    const overtime = Array.from({ length: 200 }, (_, index) =>
      realGame(`ot-${index}`, 3, 3)
    ).find((game) => game.periodScores.length > 4);

    expect(overtime).toBeDefined();
    expect(periodBoundaries(overtime!.events)).toHaveLength(
      overtime!.periodScores.length - 1
    );
  });
});

describe("lineScoreThrough", () => {
  it("shows four columns with future periods blank", () => {
    const cells = lineScoreThrough(HAND_LOG, 2);

    expect(cells).toHaveLength(4);
    expect(cells[0]).toEqual({ period: 1, home: 5, away: 3, isCurrent: true });
    expect(cells.slice(1).every((cell) => cell.home === null)).toBe(true);
    expect(cells.slice(1).every((cell) => cell.away === null)).toBe(true);
  });

  it("totals to the scoreboard at every cursor", () => {
    const game = realGame("line-score");

    for (let cursor = -1; cursor < game.events.length; cursor += 1) {
      const frame = replayFrame(game, cursor);
      const home = frame.lineScore.reduce(
        (sum, cell) => sum + (cell.home ?? 0),
        0
      );
      const away = frame.lineScore.reduce(
        (sum, cell) => sum + (cell.away ?? 0),
        0
      );

      expect(home).toBe(frame.homeScore);
      expect(away).toBe(frame.awayScore);
    }
  });

  it("adds an overtime column only once overtime is reached", () => {
    const overtime = Array.from({ length: 200 }, (_, index) =>
      realGame(`ot-col-${index}`, 3, 3)
    ).find((game) => game.periodScores.length > 4)!;
    const lastRegulation = overtime.events.findLastIndex(
      (current) => current.period === 4
    );

    expect(lineScoreThrough(overtime.events, lastRegulation)).toHaveLength(4);
    expect(
      lineScoreThrough(overtime.events, overtime.events.length - 1).length
    ).toBeGreaterThan(4);
  });
});

describe("leadersSoFar", () => {
  it("ranks a side's scorers by running points, capped at three", () => {
    const game = realGame("leaders");
    const leaders = leadersSoFar(game.events, game.events.length - 1, "HOME");

    expect(leaders.length).toBeLessThanOrEqual(LEADER_COUNT);
    expect(leaders.every((line) => line.side === "HOME")).toBe(true);

    for (let index = 1; index < leaders.length; index += 1) {
      expect(leaders[index - 1].points).toBeGreaterThanOrEqual(
        leaders[index].points
      );
    }
  });

  it("matches the engine's own full-game tally at the final cursor", () => {
    const game = realGame("leaders-tally");
    const engineTop = game.scoring
      .filter((line) => line.side === "AWAY")
      .slice(0, LEADER_COUNT);

    expect(leadersSoFar(game.events, game.events.length - 1, "AWAY")).toEqual(
      engineTop
    );
  });
});

describe("feedThrough", () => {
  it("puts the newest event first and caps its length", () => {
    const game = realGame("feed");
    const feed = feedThrough(game.events, game.events.length - 1);

    expect(feed).toHaveLength(Math.min(FEED_LENGTH, game.events.length));
    expect(feed[0].homeScore).toBe(game.homeScore);
    expect(feed[0].awayScore).toBe(game.awayScore);
  });

  it("badges and-ones, lead changes and runs from the hand-built log", () => {
    const feed = feedThrough(HAND_LOG, 4);

    expect(feed[0].badges).toEqual(["AND_ONE", "RUN"]);
    expect(feed[0].runLabel).toBe("8-0 RUN");
    expect(feed[2].badges).toEqual(["LEAD_CHANGE"]);
    expect(feed[4].badges).toEqual([]);
  });

  it("only badges a run once it reaches the floor", () => {
    const feed = feedThrough(HAND_LOG, 4);
    const belowFloor = feed.find(
      (row) => row.runLabel === null && row.side === "HOME"
    );

    expect(RUN_BADGE_FLOOR).toBe(6);
    expect(belowFloor).toBeDefined();
  });
});

describe("momentumSeries", () => {
  it("opens at the tip and tracks the running margin", () => {
    const series = momentumSeries(HAND_LOG, 4);

    expect(series[0]).toEqual({ x: 0, margin: 0 });
    expect(series).toHaveLength(6);
    expect(series[series.length - 1].margin).toBe(7);
  });

  it("advances monotonically in game time", () => {
    const game = realGame("momentum");
    const series = momentumSeries(game.events, game.events.length - 1);

    for (let index = 1; index < series.length; index += 1) {
      expect(series[index].x).toBeGreaterThanOrEqual(series[index - 1].x);
    }
  });
});

// Only an overtime game can expose the axis leak, so every assertion here uses one.
const OT_SEED = "ot-51";
const DOUBLE_OT_SEED = "ot-221";

const overtimeGame = (seed: string): GameResult => realGame(seed, 2, 2);

describe("momentumAxisEnd", () => {
  it("is regulation length for every cursor of a regulation game", () => {
    const game = realGame("axis-regulation");

    expect(REGULATION_SECONDS).toBe(2880);
    expect(game.events[game.events.length - 1].period).toBe(4);

    for (let cursor = -1; cursor < game.events.length; cursor += 1) {
      expect(momentumAxisEnd(game.events, cursor)).toBe(REGULATION_SECONDS);
    }
  });

  it("stays at regulation through regulation even when the game goes to double overtime", () => {
    const game = overtimeGame(DOUBLE_OT_SEED);
    const { events } = game;

    expect(events[events.length - 1].period).toBe(6);

    const regulation = events
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => event.period <= 4);

    expect(regulation.length).toBeGreaterThan(50);

    for (const { index } of regulation) {
      expect(momentumAxisEnd(events, index)).toBe(REGULATION_SECONDS);
    }
  });

  it("extends on the first event of an overtime, not before it", () => {
    const { events } = overtimeGame(OT_SEED);
    const firstOvertime = events.findIndex((event) => event.period === 5);

    expect(firstOvertime).toBeGreaterThan(0);
    expect(momentumAxisEnd(events, firstOvertime - 1)).toBe(REGULATION_SECONDS);
    expect(momentumAxisEnd(events, firstOvertime)).toBe(
      REGULATION_SECONDS + 5 * 60
    );
  });

  it("extends once more for a second overtime", () => {
    const { events } = overtimeGame(DOUBLE_OT_SEED);
    const secondOvertime = events.findIndex((event) => event.period === 6);

    expect(secondOvertime).toBeGreaterThan(0);
    expect(momentumAxisEnd(events, secondOvertime - 1)).toBe(
      REGULATION_SECONDS + 5 * 60
    );
    expect(momentumAxisEnd(events, secondOvertime)).toBe(
      REGULATION_SECONDS + 10 * 60
    );
  });

  // If deleting the rest of the log cannot change the axis, it was not derived from it.
  it("is unchanged by deleting every event after the cursor", () => {
    const { events } = overtimeGame(DOUBLE_OT_SEED);

    for (let cursor = -1; cursor < events.length; cursor += 1) {
      expect(momentumAxisEnd(events, cursor)).toBe(
        momentumAxisEnd(events.slice(0, cursor + 1), cursor)
      );
    }
  });

  // An axis below regulation would scale the curve up and past the viewBox edge.
  it("never falls below regulation, so the curve can only compress inward", () => {
    const { events } = overtimeGame(DOUBLE_OT_SEED);

    for (let cursor = -1; cursor < events.length; cursor += 1) {
      expect(momentumAxisEnd(events, cursor)).toBeGreaterThanOrEqual(
        REGULATION_SECONDS
      );
    }
  });

  it("carries onto the frame", () => {
    const game = overtimeGame(OT_SEED);
    const firstOvertime = game.events.findIndex((event) => event.period === 5);

    expect(replayFrame(game, firstOvertime - 1).momentumAxis).toBe(
      REGULATION_SECONDS
    );
    expect(replayFrame(game, firstOvertime).momentumAxis).toBe(
      REGULATION_SECONDS + 5 * 60
    );
  });
});

describe("the frame's lead-change flag", () => {
  it("marks the flips and nothing else", () => {
    const flags = HAND_LOG.map(
      (_, cursor) => replayFrame({ events: HAND_LOG }, cursor).leadChange
    );

    expect(flags).toEqual([false, true, true, false, false]);
  });

  // Why the flag is threaded, not re-derived: flash and badge are one decision.
  it("agrees with the feed's badge at every cursor", () => {
    const game = realGame("lead-flag");

    for (let cursor = 0; cursor < game.events.length; cursor += 1) {
      const frame = replayFrame(game, cursor);

      expect(frame.leadChange).toBe(
        frame.feed[0].badges.includes("LEAD_CHANGE")
      );
    }
  });

  // Back-to-back flips are ordinary, and a boolean would hold true across both.
  it("flags consecutive cursors when the lead flips straight back", () => {
    const game = realGame("lc-1", 2, 2);
    const flags = game.events.map(
      (_, cursor) => replayFrame(game, cursor).leadChange
    );
    const backToBack = flags.findIndex(
      (flag, index) => index > 0 && flag && flags[index - 1]
    );

    expect(backToBack).toBeGreaterThan(0);
  });

  it("is false before the tip", () => {
    expect(
      replayFrame(realGame("lead-pre-tip"), PRE_TIP_CURSOR).leadChange
    ).toBe(false);
  });
});

describe("periodSummary", () => {
  it("summarises only the current period", () => {
    const game = realGame("summary");
    const boundary = periodBoundaries(game.events)[0];
    const summary = periodSummary(game.events, boundary);
    const engine = game.periodScores.find(
      (score) => score.period === summary.period
    )!;

    expect(summary.home).toBe(engine.home);
    expect(summary.away).toBe(engine.away);
    expect(summary.leaders.length).toBeLessThanOrEqual(LEADER_COUNT);
  });

  it("summarises every period against the engine's own splits", () => {
    const game = realGame("summary-all");

    for (const boundary of periodBoundaries(game.events)) {
      const summary = periodSummary(game.events, boundary);
      const engine = game.periodScores.find(
        (score) => score.period === summary.period
      )!;

      expect([summary.home, summary.away]).toEqual([engine.home, engine.away]);
    }
  });

  // Both sides share the card, so a one-side board would pass a same-side assertion.
  it("ranks both sides together", () => {
    const summary = periodSummary(
      [
        event(0, 1, "11:00", "HOME", 2, 2, 0),
        event(1, 1, "10:00", "AWAY", 3, 2, 3),
      ],
      1
    );

    expect(summary).toMatchObject({ period: 1, home: 2, away: 3 });
    expect(summary.leaders.map((line) => line.side)).toEqual(["AWAY", "HOME"]);
  });

  it("is empty before the tip-off", () => {
    expect(periodSummary(HAND_LOG, PRE_TIP_CURSOR)).toEqual({
      period: 1,
      home: 0,
      away: 0,
      leaders: [],
    });
  });
});

describe("replayStatus", () => {
  it("is PLAYING mid-game and FINAL on the last event", () => {
    expect(replayStatus(PRE_TIP_CURSOR, 5, false)).toBe("PLAYING");
    expect(replayStatus(3, 5, false)).toBe("PLAYING");
    expect(replayStatus(4, 5, false)).toBe("FINAL");
  });

  // If a pause outranked FINAL, the last quarter break would hold the board forever.
  it("lets FINAL win over a pause", () => {
    expect(replayStatus(2, 5, true)).toBe("PERIOD_BREAK");
    expect(replayStatus(4, 5, true)).toBe("FINAL");
  });
});

describe("nextTick", () => {
  const boundaries = periodBoundaries(HAND_LOG);

  it("schedules the next event with its own delay", () => {
    const tick = nextTick(HAND_LOG, boundaries, 0, false, "NORMAL");

    expect(tick).toEqual({
      kind: "EVENT",
      cursor: 1,
      delayMs: eventDelayMs(HAND_LOG[0], HAND_LOG[1], "NORMAL"),
      pauseAfter: false,
    });
  });

  it("opens on the first event from the pre-tip cursor", () => {
    const tick = nextTick(
      HAND_LOG,
      boundaries,
      PRE_TIP_CURSOR,
      false,
      "NORMAL"
    );

    expect(tick).toMatchObject({ kind: "EVENT", cursor: 0 });
  });

  it("flags a pause when the next event ends a period", () => {
    const twoPeriods = [
      event(0, 1, "1:00", "HOME", 2, 2, 0),
      event(1, 1, "0:20", "AWAY", 2, 2, 2),
      event(2, 2, "11:00", "HOME", 2, 4, 2),
    ];
    const marks = periodBoundaries(twoPeriods);

    expect(marks).toEqual([1]);
    expect(nextTick(twoPeriods, marks, 0, false, "NORMAL")).toMatchObject({
      cursor: 1,
      pauseAfter: true,
    });
    expect(nextTick(twoPeriods, marks, 1, true, "NORMAL")).toEqual({
      kind: "RESUME",
      delayMs: periodBreakMs("NORMAL"),
    });
  });

  it("stops scheduling once the last event is on screen", () => {
    expect(
      nextTick(HAND_LOG, boundaries, HAND_LOG.length - 1, false, "NORMAL")
    ).toBeNull();
  });

  it("holds the break longer at Slow than at Fast", () => {
    const paused = (speed: ReplaySpeed) =>
      nextTick(HAND_LOG, boundaries, 1, true, speed);

    expect(paused("SLOW")).toMatchObject({ delayMs: periodBreakMs("SLOW") });
    expect(periodBreakMs("SLOW")).toBeGreaterThan(periodBreakMs("FAST"));
  });

  // Driving the chain proves the two compose into a replay that ends and stops.
  it("walks a real game to its last event and then stops", () => {
    const game = realGame("tick-drive");
    const marks = periodBoundaries(game.events);
    let cursor = PRE_TIP_CURSOR;
    let paused = false;
    let pauses = 0;
    let steps = 0;

    for (; steps < game.events.length * 3; steps += 1) {
      const tick = nextTick(game.events, marks, cursor, paused, "NORMAL");

      if (!tick) break;

      if (tick.kind === "RESUME") {
        paused = false;
        continue;
      }

      cursor = tick.cursor;
      paused = tick.pauseAfter;
      if (tick.pauseAfter) pauses += 1;
    }

    expect(cursor).toBe(game.events.length - 1);
    expect(replayStatus(cursor, game.events.length, paused)).toBe("FINAL");
    expect(pauses).toBe(game.periodScores.length - 1);
  });
});

describe("seriesWinsThrough", () => {
  const game = (winner: MatchSideId): GameResult => ({ winner }) as GameResult;

  it("counts only the games already played", () => {
    const games = [game("HOME"), game("AWAY"), game("HOME"), game("HOME")];

    expect(seriesWinsThrough(games, 0)).toEqual({ home: 0, away: 0 });
    expect(seriesWinsThrough(games, 2)).toEqual({ home: 1, away: 1 });
    expect(seriesWinsThrough(games, 4)).toEqual({ home: 3, away: 1 });
  });
});

describe("winsAtBuzzer", () => {
  const decided = (winner: MatchSideId, home: number, away: number) =>
    ({ winner, homeScore: home, awayScore: away }) as GameResult;

  const before = { home: 1, away: 2 };

  it("leaves the count alone until the final buzzer", () => {
    // The finished score is on the log; a game still playing must not borrow it.
    expect(winsAtBuzzer(before, false, 118, 90)).toEqual(before);
    expect(winsAtBuzzer(before, false, 0, 0)).toEqual(before);
  });

  it("credits the side ahead at the buzzer, and only that side", () => {
    expect(winsAtBuzzer(before, true, 118, 90)).toEqual({ home: 2, away: 2 });
    expect(winsAtBuzzer(before, true, 90, 118)).toEqual({ home: 1, away: 3 });
  });

  it("never adds more than one win", () => {
    const after = winsAtBuzzer(before, true, 101, 99);

    expect(after.home + after.away).toBe(before.home + before.away + 1);
  });

  // A level score at FINAL is unreachable, so this pins the refusal, not a case.
  it("credits neither side on a level score", () => {
    expect(winsAtBuzzer(before, true, 100, 100)).toEqual(before);
  });

  // The live increment must land where `seriesWinsThrough` puts the same game later.
  it("agrees with seriesWinsThrough across a whole series", () => {
    const games = [
      decided("HOME", 110, 104),
      decided("AWAY", 98, 112),
      decided("AWAY", 91, 95),
      decided("HOME", 120, 117),
    ];

    games.forEach((game, index) => {
      const live = winsAtBuzzer(
        seriesWinsThrough(games, index),
        true,
        game.homeScore,
        game.awayScore
      );

      expect(live).toEqual(seriesWinsThrough(games, index + 1));
    });
  });
});

describe("period labels", () => {
  it("names regulation quarters and overtimes", () => {
    expect(periodLabel(3)).toBe("Q3");
    expect(periodLabel(5)).toBe("OT");
    expect(periodLabel(6)).toBe("2OT");
    expect(periodBreakLabel(3)).toBe("END OF 3RD QUARTER");
    expect(periodBreakLabel(5)).toBe("END OF OT");
  });
});

// The spoiler invariant ------------------------------------------------------

describe("the spoiler invariant", () => {
  // If truncating the log cannot change the frame, nothing in it came from the rest.
  it("derives every frame from the event prefix alone", () => {
    for (const seed of ["spoil-a", "spoil-b", "spoil-c"]) {
      const game = realGame(seed);

      for (let cursor = -1; cursor < game.events.length; cursor += 1) {
        const truncated: Pick<GameResult, "events"> = {
          events: game.events.slice(0, cursor + 1),
        };

        expect(replayFrame(game, cursor)).toEqual(
          replayFrame(truncated, cursor)
        );
      }
    }
  });

  it("never shows a period the game has not reached", () => {
    const game = realGame("spoil-periods");

    for (let cursor = -1; cursor < game.events.length; cursor += 1) {
      const frame = replayFrame(game, cursor);
      const reached = frame.lineScore.filter((cell) => cell.home !== null);

      expect(reached.every((cell) => cell.period <= frame.period)).toBe(true);
      expect(frame.lineScore.length).toBeLessThanOrEqual(
        Math.max(4, frame.period)
      );
    }
  });

  it("holds the score below the final until the final event", () => {
    const game = realGame("spoil-score");
    const midpoint = Math.floor(game.events.length / 2);
    const frame = replayFrame(game, midpoint);

    expect(frame.homeScore + frame.awayScore).toBeLessThan(
      game.homeScore + game.awayScore
    );
  });

  it("lands exactly on the finished game at the last cursor", () => {
    const game = realGame("spoil-end");
    const frame = replayFrame(game, game.events.length - 1);

    expect(frame.homeScore).toBe(game.homeScore);
    expect(frame.awayScore).toBe(game.awayScore);
    expect(frame.lineScore).toHaveLength(game.periodScores.length);
  });
});

describe("SPEED_FACTORS", () => {
  it("orders Fast, Normal and Slow", () => {
    expect(SPEED_FACTORS.FAST).toBeLessThan(SPEED_FACTORS.NORMAL);
    expect(SPEED_FACTORS.NORMAL).toBeLessThan(SPEED_FACTORS.SLOW);
  });
});
