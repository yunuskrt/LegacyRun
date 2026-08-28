# Phase 17 - Match Replay & Live Scoreboard

## Overview

Replace Phase 16's `SeriesResultCard` seam with a real replay: the finished
`GameResult` event log, paced onto a game clock and presented as a live-feeling
scoreboard.

Design source: `context/docs/match-simulation.md` §6.1 (the obligation),
`context/docs/tournament-ui-design.md` §5 (the pacing model). Reference mockups:
`desktop-series-stats.png` (B2), `desktop-series-end-of-quarter.png` (B3),
`mobile-series-stats.png`.

**Phase 15 hands over a finished log precisely so this phase can pace it.** There
is no network and no arithmetic in the replay loop. A renderer that prints the
log in one pass throws away everything that design bought.

Ships at **Normal speed, Manual only, no skip** — Phase 18 owns the controls. The
control bar may be rendered disabled to hold its space, or omitted; do not build
half of it.

## Requirements

- All pacing and derivation is pure, in `src/lib/replay.ts`. The component holds
  a cursor and a timer and nothing else.
- No change to `src/lib/match.ts`, `src/types/match.ts`, or any route.
- The replay must be resumable from any cursor position — every derived value is
  a function of `(game, eventIndex)`, never accumulated in component state.

## Squad name - "Dynasty Five" is mockup filler

`Squad.name` is optional. Every mockup was generated with a named squad, so
`DYNASTY FIVE` appears in the series banner, under the scoreboard, and as the
scoring-leaders heading. It is placeholder text, not a default.

- **Name set** → render it verbatim wherever the mockups print `DYNASTY FIVE`.
- **Name not set** → render **`YOUR SQUAD`**. Never substitute `Dynasty Five` or
  generate a name.
- Use `squadDisplayName(squad)` from Phase 16's `src/lib/tournament-view.ts` —
  do not add a second fallback string here.
- The squad's short code (`DYN` on the crest and in the line score's `TEAM`
  column) is **not** derived from the squad name. Historical teams use their
  Basketball-Reference slug; the squad needs a fixed literal that works for both
  named and unnamed runs. Pick one (`YOU` or `SQD`) and use it in every side that
  is `kind: "SQUAD"`.

## The spoiler invariant

**This is the phase's defining constraint.** `match-simulation.md` §6.1: nothing
in the UI may reveal a result ahead of the replay.

- Every visible value derives from `events.slice(0, cursor + 1)` — never from
  `GameResult.homeScore`, `.winner`, `.scoring`, or `SeriesState.games.length`.
- The line score shows future periods as `–`, never a value.
- Series dots show wins **before this game**, and update only at B5.
- A component that takes `GameResult` or `SeriesState` whole can leak. Pass the
  derived view model instead.

Pin it: a test asserts that for every cursor position in a real game, no derived
field equals a value only reachable later in the log.

## Pure module - `src/lib/replay.ts`

| Function | Purpose |
| --- | --- |
| `clockToSeconds(clock, period)` | `"5:42"` + period → elapsed game seconds |
| `eventDelayMs(prev, next, speed)` | game-second gap × speed factor, clamped `[120, 1200]` |
| `replayFrame(game, cursor)` | the whole view model for one tick (below) |
| `periodBoundaries(game)` | cursor indices where a period ends — the quarter beats |
| `scoringRun(events, cursor)` | current unanswered run, e.g. `{ side, points: 8 }` |
| `isLeadChange(events, cursor)` | the badge on the feed row |
| `momentumSeries(events, cursor)` | `{ x, margin }[]` for the chart |
| `leadersSoFar(events, cursor, side)` | top 3 scorers with running points |

`replayFrame` returns `{ homeScore, awayScore, period, clock, lineScore, leaders, feed, momentum, margin }` — everything B2 renders, from one call.

**Speed factors** are defined here even though the control ships in Phase 18:
`SLOW`, `NORMAL`, `FAST` as a `Record<Speed, number>`. Phase 17 passes `NORMAL`.

At ~93 scoring events per game the budget is roughly 25s Normal, 45s Slow, 9s
Fast. Assert the Normal figure in a test against a real simulated game so a
constant change that blows the budget fails loudly.

## The hook - `src/hooks/useReplay.ts`

Drives the cursor on a `setTimeout` chain (not an interval — delays vary per
event). Exposes `{ frame, cursor, status, advance, jumpToEnd }` where `status` is
`PLAYING | PERIOD_BREAK | FINAL`.

- `PERIOD_BREAK` pauses the chain, holds ~1.5s scaled by speed, then resumes.
  **Quarter breaks pause in both modes** — Manual gates game-to-game and
  round-to-round, never quarter-to-quarter.
- Cleans up its timer on unmount and on game change.
- `jumpToEnd` exists here but has no caller until Phase 18.

## Screens

**B2 Live game** — as `desktop-series-stats.png`, composed of:

| Region | Notes |
| --- | --- |
| Series banner | **Missing from the mockup — build it.** Both teams, `GAME 4`, venue from `hostSide`, series dots showing wins before this game |
| Scoreboard | Large numerals, leader in gold, period + clock between. Scores **tween** between running totals; they never jump |
| Line score | Q1–Q4 (+OT), current period highlighted, future periods `–`. **The `T` column must equal the scoreboard** — the mockup shows 78/74 against a scoreboard of 78/71 |
| Momentum | Margin over time crossing a zero line, with the current margin labeled |
| Scoring leaders | Top 3 per side, running totals. **Points only** — the database holds no other stat |
| Play-by-play | Newest at top, `9:47 Q3 · LeBron James +3 · 78-71`, badges `AND-1`, `LEAD CHANGE`, `8-0 RUN` |

**B3 Quarter break** — the feed dims behind a centered card: `END OF 3RD
QUARTER`, the period score, period leaders. See the mockup; it dims the whole
board, which reads well.

**B4 Overtime** — an `OT` column appears in the line score, period indicator
reframes. Derive from `periodScores.length > 4`; never assume 4.

**B5 Game final** — `FINAL` on the scoreboard, complete line score, full-game
leaders, and **only now** the series dots include this game. Manual action:
`Next Game`.

## Responsiveness

Single column at 390 in this order: series banner → scoreboard → line score (in
its own `overflow-x: auto` container) → momentum → leaders (2-column compact) →
feed. Scoreboard numerals scale with `clamp()` and stay large.

**The mobile mockup shows no control bar** — Phase 18 pins it to the viewport
bottom. Leave room for it.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`.
- Unit: the spoiler sweep above; delay clamping at both ends; period boundaries
  on a game with and without OT; run and lead-change detection against a
  hand-built event array; leaders match a full-game tally at the final cursor.
- Browser at 1440×1000 and 390×844, zero console errors: watch a full game
  through all four quarters and the break cards; confirm the score climbs rather
  than teleports; confirm the line score's future periods stay `–`; confirm the
  series dots do not update until B5.
- Watch an overtime game end to end (replay a run seed known to produce one).
- Timing: a Normal game completes in roughly 25s, and no single gap stalls
  visibly.
- **Watch one game with an unnamed squad**: the banner, scoreboard label and
  leaders heading all read `YOUR SQUAD`, the line score's team code is the fixed
  literal, and `Dynasty Five` appears nowhere.

## Out of scope

Speed and mode controls, `Skip to final`, the face-off, and series won/lost cards
— all Phase 18. Results screens — Phase 19. Commentary — Phase 23, and it may
never alter or invent a stat.

## References

**Design and decisions**

- `context/docs/match-simulation.md` — **§6 and §6.1 are the obligation this
  phase exists to discharge** (precomputed is what makes it feel live); §4.4
  margin variance; §7 the event shape and why points are the only stat
- `context/docs/tournament-ui-design.md` — §2.3 series states, §4 invariants
  (spoiler rule, points-only), §5 the pacing model
- `context/project-overview.md` — §E match simulation, hard constraint 10 (speed
  is presentation only)
- `context/coding-standards.md` — component template, testing scope
- `context/current-feature.md` — Phase 15 History (the engine, `HOME`/`AWAY`
  sides, `hostSide`, the ~93-event game)

**Mockups** (`context/screenshots/tournament/`)

- `desktop-series-stats.png` — B2 · `desktop-series-end-of-quarter.png` — B3
- `mobile-series-stats.png` — the single-column layout

Two known defects in those mockups, both corrected in this spec: the live-game
screen has **no series banner**, and its line-score `T` column (78/74) disagrees
with the scoreboard (78/71).

**Code**

- `src/types/match.ts` — `MatchEvent`, `GameResult`, `PeriodScore`,
  `ScoringLine`, `SeriesState`, `MatchSideId`
- `src/lib/match.ts` — `playMatchup` and the log this phase replays
- `src/lib/tournament-view.ts` — `squadDisplayName` (Phase 16)
- `src/components/tournament/` — the Phase 16 shell this stage mounts into
