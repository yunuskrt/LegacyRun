# Phase 20 (part 5) — Result Screen Motion

## Overview

The last slice of Phase 20. Animate the run's ending: the champion reveal and
the elimination headline, the path list arriving row by row, and the five
players revealing in slot order.

Source: `context/docs/motion-animation.md` §Result screen (items 19–21).

Depends on **part 01** for tokens and reduced motion, and comes after **part 03**
because `Review bracket` renders the same `BracketLadder` / `BracketSpine` that
part animated.

This screen is seen once per run and is the only place in the app where a
slightly longer, more deliberate sequence is warranted. It is still not a
celebration animation: the budget from part 01 holds, and the ceiling is a
single staged entrance of about half a second, not a trophy that spins.

## The archive round trip

`RunResultScreen` and the archive are two stages of the same page, both inside
`TournamentStage`'s `AnimatePresence mode="wait"`. `Review bracket` and
`Back to results` round-trip between them, and each is a stage change with its
own crossfade.

- The archive is deliberately **unmasked**: it passes `bracket.rounds` rather
  than `visibleRounds(...)`, reveals `finalsOpponent(bracket)` unconditionally
  (after the run ends, `3 ROUNDS AWAY` would be wrong), forces `matchupCardState`
  to never be `NEXT`, and opens `BracketSpine` expanded.
- So the archive arrives with everything already resolved, and part 03's
  animations are entrance animations over a finished bracket. **Check the
  arrival specifically**: the champion stub must appear revealed rather than
  playing its unlock transition, and no matchup may read as "newly unlocked"
  when all of them are.
- The result screen replays its own entrance on the way back. That is a stage
  transition, not a bug — but confirm the round trip does not feel like being
  re-congratulated. If it does, the fix is a shorter sequence, not extra state.

## Items

### 19. Champion reveal — `RunResultScreen`

The header is a glyph, an overline, the outcome word, and the squad name.

- **Champion**: `Crown` glyph, `THE RUN IS COMPLETE`, `NBA CHAMPIONS`. Stage it —
  glyph, then overline, then the outcome, then the name — with `staggerDelay`,
  total ≤ ~400ms. A gentle scale-in on the crown is the one place a small
  overshoot is acceptable; keep it under 1.06.
- **Elimination**: `ShieldOff` glyph, `ELIMINATED IN THE …`, `RUN ENDED` in red.
  **Same sequence, same timing.** Do not make defeat slower, heavier, or
  differently eased — a run that ends in Round 1 is the common case (four phases
  of evidence), and dramatizing it every time is the fastest way to make this
  screen tiresome.
- The squad name is the hero line at ~40px, and it is `YOUR SQUAD` when unnamed
  (`squadDisplayName`). Check the animation with the fallback, not only with a
  long custom name — the two have very different widths.
- `eliminationHeadline` carries the article (`in the Conference Semifinals`,
  but `in Round 1`). This part does not touch that copy; it is pinned by test
  and was already fixed twice.

### 20. Path list stagger — `RunPathList`

The round rows arriving one at a time.

- Up to four rows, in round order, via `staggerDelay`. Cap applies.
- The path shows **only the rounds actually played** — a Round 1 elimination is a
  single row, and a single row staggering by itself is just a delayed fade.
  Confirm the one-row case does not read as a glitch; if it does, skip the
  stagger below two rows.
- The win/loss badge (`bg-primary` vs `bg-destructive`) arrives with its row. Do
  not animate the badge separately — one thing per element.

### 21. Squad grid stagger — `RunSquadGrid`

The five players revealing in slot order.

- `orderMembersBySlots` (Phase 12) is what makes it slot order rather than draft
  order; `RunSquadGrid` receives the ordered list, so the stagger just follows
  the render order. Do not re-sort here.
- Five cards, capped stagger, ~200ms total. The grid is `grid-cols-1` →
  `sm:grid-cols-2` → `lg:grid-cols-5`, so at 390 this is a vertical cascade and
  at 1440 a left-to-right sweep. Both must sit inside the same cap.
- Position badges use `POSITION_SOFT_BG` — a fifth literal record, because
  `${POSITION_BG[pos]}/20` is built at runtime and Tailwind never sees it
  (Phase 5's rule, re-learned in Phase 16). Do not introduce a sixth dynamic
  class while restructuring for motion.

### Sequencing the three together

The three sections arrive in reading order: header, then the five, then the path
and recap stats. **Sequence the sections, do not sequence within and across at
once** — a stagger of staggers turns a 400ms entrance into two seconds. One
section-level delay of `DURATION.quick` between blocks, with each block's
internal stagger capped, is the whole budget.

`RunRecapStats` (playoff record, run scoring leader, signature game) is not in
the motion doc's list. Fold it into the section-level sequence as a plain fade —
leaving it as the only unanimated block on the screen would read as broken.

## What must not change

- **Every figure stays derived from `SeriesState[]`.** This part adds no data and
  reads nothing new. `runPath`, `playoffRecord`, `runScoringLeader`,
  `signatureGame` and `eliminationRow` are untouched, and
  `src/lib/run-summary.ts` should not appear in the diff except by import.
- **Run persistence stays closed.** Phase 19 decided: not persisted, a reload
  shows `No squad in play`. This part does not reopen it, and must not add
  animation that depends on state surviving a reload.
- **Both CTAs stay 44px and full-width on mobile with the primary on top**
  (Phase 19). A hover or press treatment on `START A NEW RUN` /
  `REVIEW BRACKET` is welcome and should match part 02's roster-card press —
  same family, no new values.
- `Start a new run` calls `resetRun` and routes to `/play/draft`. Part 01 owns
  that transition; do not add a second one here.

## Responsiveness

Verify at 1440, 1280, 1024, 768, 390. No horizontal page scroll.

- The five: 5-across → 2-column → single column.
- Path / record / leader / signature: 2-column grid → stacked.
- **Phase 19 photographed the champion screen at 1440 but never at 390** — it was
  verified at 390 only through the elimination screen, which shares components.
  This part should close that gap while it is animating the same header.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`. `/play/tournament`
  still prerenders static, both API routes still dynamic.
- No new pure-module logic is expected. If a sequencing rule emerges, it belongs
  in `src/lib/motion.ts` with a test, not inline — the extraction pattern this
  project has used since Phase 11, and that Phase 19 applied to
  `eliminationHeadline` and `defeatSubtitle`.
- Browser at 1440×1000 and a true 390×844, zero console errors:
  - Finish a run and watch the entrance once, at both widths, for **both**
    outcomes and with **both** a named and an unnamed squad.
  - A Round 1 elimination: the one-row path does not look broken.
  - `Review bracket` → the archive arrives fully resolved: the champion stub
    already revealed, no matchup reading as newly unlocked, spine opened expanded
    on mobile. `Back to results` → the round trip reads as navigation, not as a
    second celebration.
  - `Start a new run` → one route transition, empty draft board, and the next run
    draws a fresh bracket (Phase 19's actual proof that `resetRun` cleared the
    context — an empty board alone does not prove it).
- Reduced motion emulated: everything resolves instantly, both outcomes readable,
  the archive round-trip unchanged.
- **The champion path cannot be reached by playing** — four phases of evidence.
  Use the same temporary shortcut Phases 16 and 19 used (reseed `playMatchup`
  until the squad wins, so games and logs stay real) and **delete it before
  commit**: `grep` for `dev=champion`, `DEV SHORTCUT`, `devWin` must return
  nothing.

## Closing Phase 20

This is the last part. Before ticking Phase 20 in `context/todo.md`, confirm the
phase as a whole:

- Item 24 is genuinely met: **no component defines its own duration, easing or
  stagger**. Grep `src/components/` and `src/hooks/` for inline `duration:`,
  `ease:`, `stiffness:` and `delay:` values — every hit should be a token or a
  documented pacing constant.
- Item 23 is genuinely met: a single reduced-motion pass over the draft, the
  bracket, a full game, a series, and both result outcomes, with nothing
  animating and nothing broken.
- The five parts share one feel. Play one complete run end to end and check that
  the draft, the bracket, the replay and the ending read as the same app.

## Out of scope

Parts 01–04. The home screen (Phase 21), commentary (Phase 22), deployment
(Phase 23). Leaderboards, run history and sharing remain postponed in the MVP
scope.

## References

- `context/docs/motion-animation.md` — §Result screen, items 19–21
- `context/features/phase-20-motion-foundation-01.md` — tokens, reduced motion,
  the `Start a new run` route transition
- `context/features/phase-20-bracket-motion-03.md` — the bracket animations the
  archive inherits
- `context/features/phase-19-results-run-summary.md` — the screens, the
  derivations, the persistence decision
- `context/docs/tournament-ui-design.md` §2.4, §3
- `context/current-feature.md` — Phase 19 History (the article bug and its two
  extracted copy rules, the unmasked archive, `resetRun`'s scope, the 390 gap on
  C1, the `?dev=champion` device), Phase 12 (`orderMembersBySlots`), Phase 16
  (`squadDisplayName`, `POSITION_SOFT_BG`)
- Code: `src/components/tournament/` — `RunResultScreen`, `RunPathList`,
  `RunSquadGrid`, `RunRecapStats`, `BracketLadder`, `BracketSpine`,
  `TournamentStage`; `src/lib/run-summary.ts`, `src/lib/tournament-view.ts`,
  `src/components/play/RunProvider.tsx`