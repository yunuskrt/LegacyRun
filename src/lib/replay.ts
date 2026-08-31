import {
  OVERTIME_MINUTES,
  PERIOD_MINUTES,
  REGULATION_PERIODS,
} from "@/lib/match";
import type {
  GameResult,
  MatchEvent,
  MatchSideId,
  ScoringLine,
} from "@/types/match";

// Everything here derives from `events.slice(0, cursor + 1)` and nothing else.
// `GameResult.homeScore`, `.winner`, `.scoring` and `.periodScores` all hold the
// finished game, so reading any of them leaks the result ahead of the replay —
// see context/docs/match-simulation.md §6.1.

export type ReplaySpeed = "SLOW" | "NORMAL" | "FAST";

// Milliseconds of real time per second of game clock. Tuned against a real
// simulated game so a Normal game lands near the 25s budget; replay.test.ts
// asserts it, so a change here fails loudly rather than blowing the pacing.
export const SPEED_FACTORS: Record<ReplaySpeed, number> = {
  SLOW: 16,
  NORMAL: 8,
  FAST: 2.5,
};

export const MIN_EVENT_DELAY_MS = 120;
export const MAX_EVENT_DELAY_MS = 1200;
export const BASE_PERIOD_BREAK_MS = 1500;

export const FEED_LENGTH = 30;
export const LEADER_COUNT = 3;
export const RUN_BADGE_FLOOR = 6;

export const PRE_TIP_CURSOR = -1;

const periodMinutes = (period: number): number =>
  period <= REGULATION_PERIODS ? PERIOD_MINUTES : OVERTIME_MINUTES;

const periodStartSeconds = (period: number): number =>
  period <= REGULATION_PERIODS
    ? (period - 1) * PERIOD_MINUTES * 60
    : REGULATION_PERIODS * PERIOD_MINUTES * 60 +
      (period - REGULATION_PERIODS - 1) * OVERTIME_MINUTES * 60;

export const clockToSeconds = (clock: string, period: number): number => {
  const [minutes, seconds] = clock.split(":");
  const remaining = Number(minutes) * 60 + Number(seconds);

  return (
    periodStartSeconds(period) +
    Math.max(0, periodMinutes(period) * 60 - remaining)
  );
};

export const eventDelayMs = (
  previous: MatchEvent | null,
  next: MatchEvent,
  speed: ReplaySpeed
): number => {
  const from = previous
    ? clockToSeconds(previous.clock, previous.period)
    : periodStartSeconds(next.period);
  const gap = Math.max(0, clockToSeconds(next.clock, next.period) - from);

  return Math.min(
    MAX_EVENT_DELAY_MS,
    Math.max(MIN_EVENT_DELAY_MS, gap * SPEED_FACTORS[speed])
  );
};

export const periodBreakMs = (speed: ReplaySpeed): number =>
  Math.round(
    (BASE_PERIOD_BREAK_MS * SPEED_FACTORS[speed]) / SPEED_FACTORS.NORMAL
  );

// Scheduling ----------------------------------------------------------------
//
// The hook is a timer and a cursor; these two decide what it does. They live
// here because a rule inside a component or a hook is a rule nothing can pin.

export type ReplayStatus = "PLAYING" | "PERIOD_BREAK" | "FINAL";

export const replayStatus = (
  cursor: number,
  eventCount: number,
  paused: boolean
): ReplayStatus => {
  if (cursor >= eventCount - 1) return "FINAL";
  return paused ? "PERIOD_BREAK" : "PLAYING";
};

export type ReplayTick =
  | { kind: "EVENT"; cursor: number; delayMs: number; pauseAfter: boolean }
  | { kind: "RESUME"; delayMs: number }
  | null;

// `null` means there is nothing left to schedule — the game is over.
export const nextTick = (
  events: readonly MatchEvent[],
  boundaries: readonly number[],
  cursor: number,
  paused: boolean,
  speed: ReplaySpeed
): ReplayTick => {
  if (replayStatus(cursor, events.length, paused) === "FINAL") return null;
  if (paused) return { kind: "RESUME", delayMs: periodBreakMs(speed) };

  const next = cursor + 1;

  return {
    kind: "EVENT",
    cursor: next,
    delayMs: eventDelayMs(
      cursor >= 0 ? events[cursor] : null,
      events[next],
      speed
    ),
    pauseAfter: boundaries.includes(next),
  };
};

// Slicing once and passing the prefix around is what keeps every helper below
// structurally unable to see the rest of the game.
export const eventsThrough = (
  events: readonly MatchEvent[],
  cursor: number
): MatchEvent[] => events.slice(0, Math.max(0, cursor + 1));

export const currentPeriod = (
  events: readonly MatchEvent[],
  cursor: number
): number => (cursor < 0 ? 1 : events[cursor].period);

export const currentClock = (
  events: readonly MatchEvent[],
  cursor: number
): string => (cursor < 0 ? `${PERIOD_MINUTES}:00` : events[cursor].clock);

export const scoreAt = (
  events: readonly MatchEvent[],
  cursor: number
): { home: number; away: number } =>
  cursor < 0
    ? { home: 0, away: 0 }
    : { home: events[cursor].homeScore, away: events[cursor].awayScore };

// The last event index of every period the game moves on from. The final
// period is not a break — it ends the game.
export const periodBoundaries = (events: readonly MatchEvent[]): number[] => {
  const boundaries: number[] = [];

  for (let index = 0; index < events.length - 1; index += 1) {
    if (events[index].period !== events[index + 1].period)
      boundaries.push(index);
  }

  return boundaries;
};

export type ScoringRun = {
  side: MatchSideId;
  points: number;
};

// Only scoring events exist, so consecutive same-side events are by definition
// unanswered.
export const scoringRun = (
  events: readonly MatchEvent[],
  cursor: number
): ScoringRun | null => {
  if (cursor < 0 || cursor >= events.length) return null;

  const { side } = events[cursor];
  let points = 0;

  for (
    let index = cursor;
    index >= 0 && events[index].side === side;
    index -= 1
  ) {
    points += events[index].points;
  }

  return { side, points };
};

// A flip of the lead, not a go-ahead from a tie — a tie has no leader to take
// the lead from.
export const isLeadChange = (
  events: readonly MatchEvent[],
  cursor: number
): boolean => {
  if (cursor < 0 || cursor >= events.length) return false;

  const event = events[cursor];
  const after = event.homeScore - event.awayScore;
  const previous = cursor > 0 ? events[cursor - 1] : null;
  const before = previous ? previous.homeScore - previous.awayScore : 0;

  return (before > 0 && after < 0) || (before < 0 && after > 0);
};

export type MomentumPoint = {
  x: number;
  margin: number;
};

export const momentumSeries = (
  events: readonly MatchEvent[],
  cursor: number
): MomentumPoint[] => [
  { x: 0, margin: 0 },
  ...eventsThrough(events, cursor).map((event) => ({
    x: clockToSeconds(event.clock, event.period),
    margin: event.homeScore - event.awayScore,
  })),
];

export const leadersSoFar = (
  events: readonly MatchEvent[],
  cursor: number,
  side: MatchSideId
): ScoringLine[] => {
  const totals = new Map<string, ScoringLine>();

  for (const event of eventsThrough(events, cursor)) {
    if (event.side !== side) continue;

    const line = totals.get(event.playerSeasonId);

    if (line) line.points += event.points;
    else
      totals.set(event.playerSeasonId, {
        side,
        playerSeasonId: event.playerSeasonId,
        playerName: event.playerName,
        points: event.points,
      });
  }

  return [...totals.values()]
    .sort(
      (a, b) => b.points - a.points || a.playerName.localeCompare(b.playerName)
    )
    .slice(0, LEADER_COUNT);
};

export type LineScoreCell = {
  period: number;
  home: number | null;
  away: number | null;
  isCurrent: boolean;
};

// Columns come from the periods actually reached, never from
// `periodScores.length` — that would announce an overtime before it is played.
export const lineScoreThrough = (
  events: readonly MatchEvent[],
  cursor: number
): LineScoreCell[] => {
  const period = currentPeriod(events, cursor);
  const columns = Math.max(REGULATION_PERIODS, period);
  const cells: LineScoreCell[] = [];

  for (let index = 1; index <= columns; index += 1) {
    const reached = index <= period;
    const scored = eventsThrough(events, cursor).filter(
      (event) => event.period === index
    );

    cells.push({
      period: index,
      isCurrent: index === period,
      home: reached
        ? scored
            .filter((event) => event.side === "HOME")
            .reduce((total, event) => total + event.points, 0)
        : null,
      away: reached
        ? scored
            .filter((event) => event.side === "AWAY")
            .reduce((total, event) => total + event.points, 0)
        : null,
    });
  }

  return cells;
};

export type FeedBadge = "AND_ONE" | "LEAD_CHANGE" | "RUN";

export type FeedRow = {
  key: string;
  period: number;
  clock: string;
  side: MatchSideId;
  playerName: string;
  points: 2 | 3;
  homeScore: number;
  awayScore: number;
  badges: FeedBadge[];
  runLabel: string | null;
};

export const feedThrough = (
  events: readonly MatchEvent[],
  cursor: number
): FeedRow[] => {
  const rows: FeedRow[] = [];
  const first = Math.max(
    0,
    Math.min(cursor, events.length - 1) - FEED_LENGTH + 1
  );

  for (
    let index = Math.min(cursor, events.length - 1);
    index >= first;
    index -= 1
  ) {
    const event = events[index];
    const run = scoringRun(events, index);
    const badges: FeedBadge[] = [];

    if (event.andOne) badges.push("AND_ONE");
    if (isLeadChange(events, index)) badges.push("LEAD_CHANGE");
    if (run && run.points >= RUN_BADGE_FLOOR) badges.push("RUN");

    rows.push({
      key: `${event.possession}-${index}`,
      period: event.period,
      clock: event.clock,
      side: event.side,
      playerName: event.playerName,
      points: event.points,
      homeScore: event.homeScore,
      awayScore: event.awayScore,
      badges,
      runLabel:
        run && run.points >= RUN_BADGE_FLOOR ? `${run.points}-0 RUN` : null,
    });
  }

  return rows;
};

export type ReplayFrame = {
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  margin: number;
  lineScore: LineScoreCell[];
  leaders: { home: ScoringLine[]; away: ScoringLine[] };
  feed: FeedRow[];
  momentum: MomentumPoint[];
};

export const replayFrame = (
  game: Pick<GameResult, "events">,
  cursor: number
): ReplayFrame => {
  const { events } = game;
  const bounded = Math.min(cursor, events.length - 1);
  const { home, away } = scoreAt(events, bounded);

  return {
    homeScore: home,
    awayScore: away,
    period: currentPeriod(events, bounded),
    clock: currentClock(events, bounded),
    margin: home - away,
    lineScore: lineScoreThrough(events, bounded),
    leaders: {
      home: leadersSoFar(events, bounded, "HOME"),
      away: leadersSoFar(events, bounded, "AWAY"),
    },
    feed: feedThrough(events, bounded),
    momentum: momentumSeries(events, bounded),
  };
};

// Period-break card ---------------------------------------------------------

export type PeriodSummary = {
  period: number;
  home: number;
  away: number;
  leaders: ScoringLine[];
};

export const periodSummary = (
  events: readonly MatchEvent[],
  cursor: number
): PeriodSummary => {
  const period = currentPeriod(events, cursor);
  const scored = eventsThrough(events, cursor).filter(
    (event) => event.period === period
  );
  const totals = new Map<string, ScoringLine>();

  for (const event of scored) {
    const key = `${event.side}:${event.playerSeasonId}`;
    const line = totals.get(key);

    if (line) line.points += event.points;
    else
      totals.set(key, {
        side: event.side,
        playerSeasonId: event.playerSeasonId,
        playerName: event.playerName,
        points: event.points,
      });
  }

  const pointsFor = (side: MatchSideId) =>
    scored
      .filter((event) => event.side === side)
      .reduce((total, event) => total + event.points, 0);

  return {
    period,
    home: pointsFor("HOME"),
    away: pointsFor("AWAY"),
    leaders: [...totals.values()]
      .sort(
        (a, b) =>
          b.points - a.points || a.playerName.localeCompare(b.playerName)
      )
      .slice(0, LEADER_COUNT),
  };
};

// Series dots ---------------------------------------------------------------

// Counted over a prefix of the games array, never over `games.length` — the
// length of a finished series is the series result.
export const seriesWinsThrough = (
  games: readonly GameResult[],
  played: number
): { home: number; away: number } => {
  const decided = games.slice(0, Math.max(0, played));

  return {
    home: decided.filter((game) => game.winner === "HOME").length,
    away: decided.filter((game) => game.winner === "AWAY").length,
  };
};

export const periodLabel = (period: number): string =>
  period <= REGULATION_PERIODS
    ? `Q${period}`
    : period === REGULATION_PERIODS + 1
      ? "OT"
      : `${period - REGULATION_PERIODS}OT`;

const ORDINALS = ["1ST", "2ND", "3RD", "4TH"] as const;

export const periodBreakLabel = (period: number): string =>
  period <= REGULATION_PERIODS
    ? `END OF ${ORDINALS[period - 1]} QUARTER`
    : `END OF ${periodLabel(period)}`;
