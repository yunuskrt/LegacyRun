# Phase 19 - Results & Run Summary

## Overview

Give the run an ending: a champion or eliminated screen, a recap of what
happened, and a way back to a new run or to the bracket that produced it.

Design source: `context/docs/tournament-ui-design.md` §2.4, §3. Reference
mockups: `desktop-result-champion.png` (C1),
`desktop-result-eliminated.png` (C2), `mobile-result-champion.png`,
`mobile-start-eliminated.png`.

This is the last phase of the tournament UI. After it, `/play/tournament` is
complete: bracket → series → result, with no dead ends.

## Requirements

- Every recap figure is **derived from `SeriesState[]`**, not stored. The
  derivations are pure and live in `src/lib/run-summary.ts` with tests.
- **Points only.** Points per game is a legitimate derivation; rebounds,
  assists, and shooting percentages do not exist in the database and must not
  appear (`match-simulation.md` §7).
- The result screen is a **full page**, not an overlay — a recorded decision
  (§3). `Review bracket` returns to a frozen read-only bracket (C3).

## Squad name - "Dynasty Five" is mockup filler

`Squad.name` is optional. Both result mockups print `DYNASTY FIVE` as the
hero line under `NBA CHAMPIONS` / `RUN ENDED`; that is placeholder text, not a
default.

- **Name set** → render it verbatim as the hero line.
- **Name not set** → render **`YOUR SQUAD`**, via `squadDisplayName(squad)` from
  Phase 16's `src/lib/tournament-view.ts`. Never substitute `Dynasty Five`,
  never generate a name, and never drop the line — the hero needs a subject.
- This is the most visible place the fallback appears, since the name sits in
  ~40px type directly beneath the outcome. Check that `YOUR SQUAD` is
  typographically balanced there, not just correct.

## Pure module - `src/lib/run-summary.ts`

| Function | Returns |
| --- | --- |
| `runOutcome(bracket, series)` | `{ kind: "CHAMPION" } \| { kind: "ELIMINATED", round, opponent, seriesScore }` |
| `runPath(bracket, series)` | one row per round played: round label, opponent, series score, won/lost |
| `playoffRecord(series)` | total games `won-lost` across the run |
| `runScoringLeader(series)` | the squad player with the highest total points, plus points per game |
| `signatureGame(series)` | the run's standout game — largest margin, or any game 7, preferring the latest round |

`signatureGame` needs a stated rule, since the mockup shows both forms
(`Game 7 · NBA Finals · 112-108`, and `Game 2 · Semifinals · 112-101`). Pick one
ordering, document it in the module, and pin it by test.

Note `runPath` overlaps `squadPath` from Phase 16's `tournament-view.ts` — reuse
it rather than reimplementing the traversal.

## Screens

**C1 Champion.** Crown glyph, `THE RUN IS COMPLETE`, `NBA CHAMPIONS`, squad name.
Then:

| Section | Content |
| --- | --- |
| The five | Five player cards with position badge, name, team + season, rating |
| The path | Four rows — round label, opponent, series score |
| Playoff record | e.g. `16-6` |
| Run scoring leader | Name + points per game |
| Signature game | One line, with the scorer's points beneath |

CTAs: `START A NEW RUN` (primary, gold) and `REVIEW BRACKET` (secondary).

**C2 Eliminated.** Same skeleton, different crown: a broken-shield glyph,
`ELIMINATED IN THE CONFERENCE SEMIFINALS`, `RUN ENDED` in red, squad name, and
the subtitle `1993 New York Knicks won the series 4-2`. The path shows **only
the rounds played** — the mockup correctly leaves the remaining rounds absent
rather than greyed. Signature game keeps its red accent.

Four elimination variants, one per round reached; the copy is generated from
`ROUND_LABELS`, not hardcoded.

**C3 Bracket archive.** Phase 16's bracket in a frozen read-only state — no
`NEXT UP` ring, no CTA on any matchup, every series resolved including the far
half, a header saying the run is complete, and a `Back to results` action. Reuse
`BracketLadder` / `BracketSpine` with a `readOnly` prop rather than forking them.

## New run

`START A NEW RUN` clears the run, bracket, match data and series from
`RunProvider` and routes to `/play/draft`. Verify the draft board comes up empty
rather than carrying the previous run's state — `RunProvider` currently has no
reset path, so one is added here.

## Run persistence - decide in this phase

Run state is **not persisted**: a reload of `/play/tournament` loses the run, its
bracket, its results, and this screen. Every phase since 12 has carried this as
open, and the result screen is where it hurts most — the ending is the thing a
player would most want to re-open or share.

Two options, and this phase picks one:

- **Accept it.** D2 (`No squad in play`) is the reload behaviour everywhere,
  including the result screen. Zero work, consistent with Phases 12–18.
- **Persist to `sessionStorage`.** Serialize the run, bracket and series on
  change; rehydrate on mount. `sessionStorage` was explicitly rejected in Phase
  12 for the draft handoff, so reversing it here needs to be a deliberate
  decision, not a drive-by.

State the choice in the History entry either way.

## Responsiveness

Verify at 1440, 1280, 1024, 768, 390. No horizontal page scroll.

- The five: 5-across → 2-column → single-column list.
- Path / record / leader / signature: 2-column grid → stacked.
- Both CTAs full-width and stacked on mobile, primary on top.
- C3 inherits Phase 16's ladder → spine behaviour unchanged.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`.
- Unit: `playoffRecord` against a hand-built series set; `runScoringLeader`
  against a known log; `signatureGame`'s ordering rule including the tie case;
  `runOutcome` for a champion, and for elimination in each of the four rounds.
- Browser at 1440×1000 and 390×844, zero console errors:
  - Play a run to a championship and confirm every recap figure matches the
    series actually played.
  - Play a run to an elimination in Round 1 and confirm the path shows one row.
  - `Review bracket` → C3 → `Back to results` round-trips without losing state.
  - `Start a new run` lands on an empty draft board.
  - Reload behaviour matches whichever persistence decision was taken.
  - Finish one run with an unnamed squad and confirm both C1 and C2 read
    `YOUR SQUAD` as the hero line, at both 1440 and 390, with `Dynasty Five`
    nowhere in the app.

## Out of scope

Motion polish (21), home screen (22), commentary (23). Leaderboards, run
history, and sharing are postponed in the MVP scope and are not in this phase.

## References

**Design and decisions**

- `context/docs/tournament-ui-design.md` — §2.4 result states, §3 decisions
  (full page with `Review bracket`, not an overlay), §6 open items (run
  persistence, the decision this phase closes)
- `context/docs/match-simulation.md` — §7 the event shape; points are the only
  stat the database holds, so points per game is the only legitimate rate
- `context/project-overview.md` — MVP scope (accounts, leaderboards and deep
  statistics are postponed)
- `context/coding-standards.md` — component template, testing scope
- `context/current-feature.md` — Phase 12 History (`RunProvider`, the optional
  squad name, and why `sessionStorage` was rejected then)
- `context/features/phase-16-tournament-shell-bracket-ui.md` — `squadPath`,
  `squadDisplayName`, and the `BracketLadder` / `BracketSpine` this phase reuses
  read-only for C3

**Mockups** (`context/screenshots/tournament/`)

- `desktop-result-champion.png` — C1 · `desktop-result-eliminated.png` — C2
- `mobile-result-champion.png`, `mobile-start-eliminated.png` — the stacked
  recap
- C3 has no mockup; it is `desktop-bracket-end.png` with every affordance
  removed

**Code**

- `src/types/match.ts` — `SeriesState`, `GameResult`, `ScoringLine`
- `src/types/bracket.ts`, `src/lib/bracket.ts` (`ROUND_LABELS` for the
  elimination copy)
- `src/lib/match.ts` — `findMatchup`, `isSquadMatchup`
- `src/components/play/RunProvider.tsx` — the reset path this phase adds
