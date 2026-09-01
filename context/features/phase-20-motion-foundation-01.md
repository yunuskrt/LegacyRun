# Phase 20 (part 1) — Motion Foundation, Reduced Motion & Route Transition

## Overview

The first of five slices of Phase 20. It ships **no new animation on any
feature screen** — it ships the vocabulary the other four slices are written
against: one duration/easing set, one reduced-motion policy, and the
draft → tournament route transition.

Source: `context/docs/motion-animation.md` §Global (items 22, 23, 24).

Everything in parts 02–05 imports from this part. Nothing in parts 02–05 may
define its own duration, easing, or stagger value.

## The house rule — simple and elegant, not overwhelming

This is the governing constraint of the whole phase, and it belongs here
because it is a shared budget, not a per-component taste call.

- **Opacity and small translation are the default.** 4–10px of `y`, 0.96–1.0 of
  `scale`. Nothing travels across the screen, nothing rotates, nothing bounces.
- **Short.** 120–260ms for everything the player triggers. 400ms is the ceiling,
  reserved for the score tween that already exists.
- **One thing moves per interaction.** If a click both reveals a card and fills a
  meter, the card moves and the meter fades — not both moving.
- **Springs do not overshoot.** The existing `DraftCourt` spring
  (`stiffness: 340, damping: 26`) is the reference feel; anything springier than
  that is out of budget.
- **Nothing loops except one thing.** The open-slot breathing glow (part 02) is
  the single permitted continuous animation in the app. Adding a second one is a
  decision to be argued in a History entry, not a default.
- **Staggers are capped.** No stagger sequence may exceed ~300ms end to end,
  regardless of list length. Phase 13 already learned this: an uncapped
  per-card stagger took ~0.7s to reveal a 23-man roster.

## Pure module — `src/lib/motion.ts`

Motion values are JavaScript, not CSS, so they cannot live in Tailwind v4's
`@theme` (which only generates utilities for recognized namespaces — the same
constraint Phase 5 hit with gradients and shadows). They live in one typed
module, exported as plain objects the components spread into `transition`.

| Export | Purpose |
| --- | --- |
| `DURATION` | `{ instant: 0.12, quick: 0.18, base: 0.24, slow: 0.4 }` — seconds, as `motion` expects |
| `EASE` | one entrance curve and one exit curve, named, not inlined |
| `SPRING` | the single sanctioned spring, matching `DraftCourt`'s current values |
| `FADE_RISE` | the standard `{ initial, animate, exit }` variant used by most entrances |
| `staggerDelay(index, options?)` | per-item delay, **capped** so long lists finish inside the budget |
| `transitionFor(kind, reduced)` | resolves a named transition, returning a zero-duration transition when `reduced` is true |

`staggerDelay` and `transitionFor` are the two things worth testing, and they
are exactly the kind of rule that is untestable while it sits inline in a
component — the extraction pattern this project has used since Phase 11's
`mode` dispatch, and most recently in Phase 19's `eliminationHeadline`.

Pin by test:

- `staggerDelay` never exceeds the cap, for a 5-item list and a 23-item list.
  Spell the cap out as a literal in at least one test — building the expectation
  from the constant lets a change to the constant pass silently (Phase 12's
  name-cap lesson).
- `staggerDelay(0)` is 0, and delays increase monotonically.
- `transitionFor(kind, true)` has zero duration for every `kind`, so no caller
  can honour reduced motion halfway.

## CSS side — `src/app/globals.css`

Some motion in the app is CSS, not `motion`: `transition-colors` on
`CourtSlot`, `RosterPlayerCard`, `RerollPool`, and shadcn's dialog
enter/exit. Those need the same tokens.

- Add `--duration-*` and `--ease-*` custom properties on `:root`, with the
  **same numeric values** as `src/lib/motion.ts`. Two sources of truth is the
  known risk here; a comment in each file naming the other is the mitigation.
- Add a global `@media (prefers-reduced-motion: reduce)` block that neutralizes
  CSS transitions and animations app-wide. This is what covers shadcn's
  primitives, which do not read `motion`'s context.

Tailwind v4 rules are unchanged: **no `tailwind.config.ts`**, configuration in
CSS only.

## Reduced motion — item 23

Two mechanisms, both required, because they cover disjoint sets of components.

1. **`<MotionConfig reducedMotion="user">`** wrapping the app, so every
   `motion` component degrades without each one opting in. It needs a client
   component; add it in `src/app/layout.tsx` (or a thin client wrapper) rather
   than in `src/app/play/layout.tsx`, so it also covers Phase 21's home screen.
2. **The CSS media query above**, for everything that is not a `motion`
   component.

`MotionConfig` disables transforms and layout animation but **not** opacity, and
it does not stop timers. So:

- Any **looping** animation (the breathing glow, part 02) must additionally check
  `useReducedMotion()` and render the static state — a loop that merely animates
  instantly still repaints forever.
- The replay's own pacing (`useReplay`, `useAutoAdvance`) is **not** motion and
  must not be touched. Reduced motion means fewer transitions, not a faster or
  slower game. Hard constraint 10 is about speed controls, but the same
  principle applies: presentation preferences never change what is shown.

## Sweep the existing motion — the real work of this part

Eight components already use `motion/react` with hand-picked values, and item 24
is unmet on day one unless they are converted. This part re-points all of them
at `src/lib/motion.ts`:

`DraftCourt`, `DraftBoard`, `TournamentStage`, `GameReplay`, `TweenNumber`,
`PlayByPlayFeed`, `PeriodBreakCard`, `SeriesFaceOff`.

Two of these carry deliberate, phase-recorded timings that **must survive the
sweep unchanged in effect**:

- `TournamentStage`'s 0.22s `mode="wait"` crossfade — parts 03–05 all render
  inside it.
- `SeriesFaceOff`'s fixed 2s beat and `PeriodBreakCard`'s 1.5s break — these are
  Phase 17/18 pacing decisions, not motion polish. Move them to named constants
  if useful, but do not retune them here.

`TweenNumber`'s 0.4s score climb becomes `DURATION.slow`. Confirm the tween
still reads as climbing, not sliding, after the change.

## Route transition — item 22

Two navigations: draft → tournament (on squad confirm) and tournament → draft
(on `Start a new run`).

- **Enter-only.** The App Router unmounts the outgoing page before the incoming
  one renders, so a genuine exit animation needs the page tree keyed under an
  `AnimatePresence` in a client layout and is fragile in both directions. An
  enter-only fade-and-rise on the arriving page gets ~90% of the effect, cannot
  deadlock navigation, and cannot strand a run mid-transition.
- Implement it in `src/app/play/layout.tsx` — the layout that already exists for
  `RunProvider` — as a thin client wrapper keyed on `usePathname()`.
- **`/play/draft` and `/play/tournament` must still prerender static.** Adding a
  client wrapper does not change that, but it is the thing to check in `build`
  output, since every phase since 12 has asserted it.
- **Coordinate with the dialog.** `SquadConfirmDialog` confirms and navigates in
  the same click (part 02, item 7). The dialog's exit and the route's entrance
  must not both run — decide here that the dialog closes *without* its exit
  animation when the confirm path is taken, and record it so part 02 implements
  against it rather than inventing a second answer.
- `Start a new run` already calls `resetRun` before routing (Phase 19). The
  transition must not delay or interleave with that — reset first, navigate
  second, animate the arrival.

## Out of scope

No feature-screen animation. Specifically **not** in this part: the draft screen
(part 02), the bracket (part 03), the replay (part 04), the result screen
(part 05). Do not "warm up" a component from a later part while sweeping it —
convert its existing values and stop.

No new dependency. `motion` v13 is already installed and is the only animation
library.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`.
- `build` output: both `/play` routes still prerender static, both API routes
  still dynamic.
- Unit: `staggerDelay`'s cap (short and long lists, literal expectation),
  monotonicity, and `transitionFor`'s zero-duration reduced branch for every
  kind.
- Browser at 1440×1000 and a true 390×844 (remember `browser_resize` scales by
  4/3 on this machine — request `width × 0.75`), zero console errors:
  - Draft a full squad, confirm, and watch the tournament page arrive with the
    fade-and-rise. No flash of unstyled or double-animated content.
  - Finish a run, `Start a new run`, and confirm the draft board arrives empty
    and animated once.
  - Every existing animation still plays as before the sweep: draft slot fill,
    stage crossfade, score tween, play-by-play feed, quarter break, face-off.
- **Reduced motion**, emulated in devtools (`prefers-reduced-motion: reduce`):
  every one of the above resolves instantly with no movement, the app remains
  fully usable, and the replay still paces at its normal speed — verify a game
  takes about the same wall-clock time as it does with motion enabled.

## References

- `context/docs/motion-animation.md` — §Global, items 22–24
- `context/coding-standards.md` — Tailwind v4 CSS-only config, component
  template, testing scope (components and hooks are not tested; pure modules are)
- `context/current-feature.md` — Phase 5 History (why gradients/shadows could not
  be `@theme` tokens; the same reason motion values are a TS module), Phase 13
  (the uncapped stagger), Phase 17 (`TournamentStage`, `TweenNumber`), Phase 18
  (`SeriesFaceOff`'s 2s beat, `PeriodBreakCard`'s 1.5s)
- `context/project-overview.md` — hard constraints 10 and 11
- Code: `src/app/layout.tsx`, `src/app/play/layout.tsx`, `src/app/globals.css`,
  and the eight components listed under the sweep