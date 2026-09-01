# Phase 20 (part 4) — Match Replay Motion

## Overview

Animate the replay stage: the lead-change flash, the momentum line extending,
scoring leaders reordering, the series dot filling at the buzzer, the control
bar's active indicator, and the series result card's entrance.

Source: `context/docs/motion-animation.md` §Match replay (items 13–18).

Depends on **part 01** for tokens and reduced motion, and on **part 03** for the
bracket ↔ series hand-off (item 18's card exits into part 03's round reveal).

The replay already has the most motion in the app — `GameReplay`, `TweenNumber`,
`PlayByPlayFeed`, `PeriodBreakCard`, `SeriesFaceOff` were all built in Phases 17
and 18 and were re-pointed at the shared tokens in part 01. **This part adds
six accents to a screen that is already alive.** The restraint budget matters
more here than anywhere else: a scoreboard where five things pulse at once
during a 30-second game is unwatchable.

## Two constraints this part inherits and cannot bend

- **Nothing here may change pacing.** Hard constraint 10: speed changes
  presentation only. Animations are presentation, so they must never gate,
  delay, or extend an event — the cursor advances on `useReplay`'s timer whether
  or not an accent has finished. Accents overlapping each other at Fast is
  expected and fine; Fast is meant to feel like a rush. What is not fine is an
  animation that holds the clock back.
- **Nothing here may reveal the future.** Phase 17's spoiler invariant is
  enforced by a test asserting `replayFrame(game, cursor)` deep-equals the same
  frame computed from a log truncated at `cursor`. An animation that reads
  `game.homeScore`, `periodScores.length`, or anything past the cursor breaks
  the same invariant the render obeys — visibly, and before the test would catch
  it, because the test covers `replay.ts`, not components.

## Items

### 13. Lead change flash — `ReplayScoreboard`

A brief accent pulse when the lead flips.

- `isLeadChange` already exists in `src/lib/replay.ts` and already drives the
  `LEAD_CHANGE` feed badge. **`ReplayScoreboard` does not currently receive
  it** — it derives `leader` locally from `homeScore`/`awayScore`. Pass the flag
  down from `GameReplay` rather than re-deriving, so the flash and the feed badge
  can never disagree.
- One pulse on the newly-leading score only, at `DURATION.quick`, opacity and
  colour — no scale. The numerals are `clamp(3.25rem, 11cqw, 5.5rem)` and a
  scale on type that size reads as a jolt.
- Lead changes cluster. A tight game can flip several times in a quarter, so the
  pulse must not queue or compound; a new flash **replaces** the previous one
  rather than being enqueued behind it. This is what keeps Fast readable without
  shortening the pulse.
- Going ahead from a tie is **not** a lead change (`isLeadChange`'s existing
  rule — a tie has no leader to take the lead from). Do not soften this to get
  more flashes.

### 14. Momentum line draw — `MomentumStrip`

The path extends with the game rather than redrawing whole.

**This requires changing the x-axis, and the replacement must not leak.** The
strip currently normalizes x to `lastX` — the most recent point — so the entire
curve rescales horizontally on every event and there is no fixed axis to extend
along. The line does not grow; it stretches.

- **Normalize x to elapsed game time against regulation length**, not against the
  latest point and not against the log's total length. The line then genuinely
  advances left to right and fills the strip as regulation ends.
- **Do not derive the axis from the full log.** `periodScores.length` and the
  event count both announce an overtime before it is played — the same class of
  defect Phase 17 fixed in the line score, which builds its columns from the
  periods actually reached. Extend the axis **when an overtime period is actually
  entered**, animating the rescale so the curve compresses smoothly rather than
  snapping.
- With a fixed axis, the polyline can animate properly: `pathLength` on the
  newest segment, or a spring on the tip coordinate. Keep the fill polygon
  following the line without its own animation — two animated shapes tracking
  each other will visibly disagree for a frame.
- Add a small dot at the newest point. It reinforces "here is now" and covers the
  join while the segment draws.
- The `AMPLITUDE = VIEW_HEIGHT / 2 - 2` margin exists because Phase 17 clipped
  the widest margin's stroke at the viewBox edge. A tip dot has its own radius —
  give it the same margin treatment or it will clip in exactly the same way.
- The vertical scale (`span`) still rescales as the margin grows. That is
  unchanged and is not a leak — it reflects only what has already happened.

### 15. Scoring leader reordering — `ScoringLeaders`

`layout` animation so a player moving up the list slides instead of jumping.

- `<motion.li layout>` on the existing `<li>`; keys are already
  `line.playerSeasonId`, so this is close to free.
- `leadersSoFar` returns `LEADER_COUNT = 3` per side. Entering and leaving the
  top three should fade, not slide from nowhere — wrap in `AnimatePresence` with
  a plain opacity variant.
- Layout animation is the one place where "cheap" is not obvious: two columns of
  three items, re-measured on every event, at up to 10 events/second. Confirm in
  the browser that a full game at Fast does not drop frames; if it does, drop to
  a crossfade rather than keeping a janky slide.

### 16. Series dot fill — `SeriesBanner`

The doc says "the dot filling at the buzzer when a game is decided". The dots
are `Array.from({ length: won + lost })` — the count **grows** when a game
resolves, so this is a dot *entering*, not a dot filling.

- Animate the new dot in: scale from ~0.6 with a fade, on the part 01 spring.
- **It must fire at the buzzer and not before.** `seriesWinsThrough` is what
  keeps the banner from counting the game in progress, and Phase 18 verified
  this in the browser (`0-1` held all through game 2, `0-2` only at the final).
  The animation attaches to that same value changing.

### 17. Control bar feedback — `ReplayControlBar`

A sliding indicator on the Slow/Normal/Fast and Manual/Automatic segments.

- `layoutId` on a background element shared across each group's buttons — the
  active pill slides between segments instead of cutting.
- **Two groups, two distinct `layoutId`s.** A shared id would make the indicator
  jump between the speed group and the mode group.
- The bar is `fixed` below `md` and `static` above it, deliberately as **one
  element** so the two versions cannot drift (Phase 18). A `layoutId` measures
  against the viewport; confirm the slide behaves at both, especially after a
  resize across the `md` boundary.
- The 44px minimum on every control is a Phase 18 rule and must survive — the
  indicator sits behind the buttons and must not shrink their hit area.
- Mode and speed switch **mid-replay** (hard constraint 11), so this indicator
  animates while the game is running. It must not tug at the layout or restart
  anything; Phase 18 verified clock and score stay strictly monotonic across
  both switches, and that must remain true.

### 18. Series result card — `SeriesResultCard`

Entrance for the won/lost card and its game lines.

- The card fades and rises; the game lines stagger beneath it via
  `staggerDelay`, capped — a best-of-7 is up to 7 lines.
- This card is the hand-off into part 03's round reveal. It sits inside
  `TournamentStage`'s `mode="wait"` crossfade, so the stage transition already
  covers its exit — **do not add a second exit animation**, or the return to the
  bracket plays two transitions back to back.
- A won card auto-advances in Automatic mode; a **lost card always waits for a
  click, in both modes** (Phase 18's one asymmetry). The entrance is identical
  either way — do not signal the outcome through timing.
- `SeriesFaceOff` already animates and holds a fixed 2s beat. The result card's
  entrance is its bookend; keep them recognisably the same family without
  copying the 2s hold.

## Existing motion this part must not disturb

`useReplay` and `useAutoAdvance` are **timers, not animation**. After Phases 17
and 18 they hold no rules — everything lives in `nextTick`, `replayStatus`,
`gameAdvance`, `seriesStageOf` and `advanceDelayMs`. Nothing in this part may
add scheduling logic to a component; if a timing rule appears, it goes in
`src/lib/replay.ts` or `src/lib/series-flow.ts` with a test.

`PeriodBreakCard`'s 1.5s break and `SeriesFaceOff`'s 2s beat are pacing
decisions, already converted to shared constants in part 01. Not retuned here.

## Responsiveness

Verify at 1440, 1280, 1024, 768, 390. No horizontal page scroll.

- **1024 and 390 are the two that have broken before.** Phase 17 shipped a
  scoreboard collision at 1024 (three columns starting too early; fixed by
  moving them to `xl:`) and a horizontal overflow at 390 (the grid had no base
  `grid-cols-1`, so the line score's `min-w-md` dragged siblings past the
  viewport). **A full-page screenshot hides the 390 overflow** — it captures the
  overflow rather than revealing it. Measure `scrollWidth` against the viewport.
- `grid-cols-1` on the replay grid is load-bearing and commented as such. Do not
  remove it while restructuring for a layout animation.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`. `/play/tournament`
  still prerenders static.
- The Phase 17 spoiler test must stay green untouched. It walks
  `replayFrame(game, cursor)` against the same frame computed from a log
  truncated at `cursor`, so **item 14's new x-axis is covered by it if the axis
  goes through `replayFrame`** — put it there rather than computing it in
  `MomentumStrip`, and the invariant enforces itself.
- Pin `momentumSeries`'s axis directly as well: its x values for a given cursor
  must be identical whether the game runs to regulation or to double overtime.
  Mutation-check by deriving the axis from `periodScores.length` — that must turn
  the suite red.
- If the lead-change flag is threaded through a new pure helper, pin it and
  mutation-check that reading the finished score kills the test.
- Browser at 1440×1000 and a true 390×844, zero console errors, playing real
  games against live Neon:
  - Watch a full game at **Normal**: flashes land on genuine lead changes only
    and match the feed's `LEAD_CHANGE` badges, one for one.
  - Watch a full game at **Fast**: accents overlap, which is expected — what is
    checked is that the clock and score never stall waiting for one, and that the
    leaders list does not drop frames. Time a Fast game and confirm it matches
    Phase 18's measured budget; a longer one means an animation is gating the
    cursor.
  - Switch speed and mode **mid-game**: the indicator slides, and clock and score
    stay strictly monotonic across both switches — no restart, no desync.
  - Sample the line score and momentum strip repeatedly through a game and
    confirm **no future period ever shows a value** (Phase 17's method).
  - Watch a game into overtime and confirm the momentum axis extends only when
    the overtime is entered — sample the strip through the fourth quarter and
    confirm nothing about its width hints that more is coming — and that the tip
    and stroke do not clip at the extended scale.
  - Confirm the series dots gain a dot only at the buzzer.
  - Finish a series and confirm one transition into the bracket, not two.
- Reduced motion emulated: no flash, no slide, no tip easing, no stagger — and
  **the game still takes the same wall-clock time**. Reduced motion is not a
  speed setting.

## Out of scope

The bracket (part 03) and the result screen (part 05). No change to
`src/lib/match.ts`, `src/types/match.ts`, or any API route — Phase 17 held that
line and this part holds it too; verify with `git diff --name-only`. No
commentary (Phase 22).

## References

- `context/docs/motion-animation.md` — §Match replay, items 13–18
- `context/features/phase-20-motion-foundation-01.md` — tokens, reduced motion
- `context/features/phase-17-match-replay-scoreboard.md`,
  `context/features/phase-18-modes-speeds-series-flow.md`
- `context/docs/match-simulation.md` §6.1 — why the log is finished before
  presentation, and what the replay owes it
- `context/project-overview.md` — hard constraints 10 and 11
- `context/current-feature.md` — Phase 17 History (the spoiler test, the 1024
  collision, the 390 overflow and why a screenshot hides it, the momentum
  clipping, the line score built from periods actually reached), Phase 18 (the
  measured Fast/Normal budgets, the one-element control bar, the lost-card
  asymmetry)
- Code: `src/components/tournament/` — `ReplayScoreboard`, `MomentumStrip`,
  `ScoringLeaders`, `SeriesBanner`, `ReplayControlBar`, `SeriesResultCard`,
  `GameReplay`, `SeriesReplay`, `TweenNumber`; `src/lib/replay.ts`
  (`isLeadChange`, `leadersSoFar`, `seriesWinsThrough`, `momentumSeries`,
  `currentPeriod`, `periodLabel`), `src/lib/series-flow.ts`,
  `src/hooks/useReplay.ts`,
  `src/hooks/useAutoAdvance.ts`