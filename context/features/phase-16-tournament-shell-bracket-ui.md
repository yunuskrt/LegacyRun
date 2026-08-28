# Phase 16 - Tournament Shell & Bracket UI

## Overview

Replace the plain-text `/play/tournament` page with the stage shell every later
phase plugs into, and build the first stage inside it: the live bracket.

Design source: `context/docs/tournament-ui-design.md` (§1 stages, §2 states,
§4 invariants). Reference mockups: `context/screenshots/tournament/` —
`desktop-bracket-start.png` (A1), `desktop-bracket-mid.png` (A3),
`desktop-bracket-end.png` (A4), `mobile-bracket-*.png`, `desktop-edge-*.png`.

**The run must be completable at the end of this phase.** The `Play <round>`
button calls the existing `playMatchup` and shows a plain series result card.
That card is a deliberate seam: Phase 17 replaces it with a replay, Phase 18
wraps it in controls. No simulation logic changes here.

Nothing in `src/lib/bracket.ts`, `src/lib/match.ts`, or any API route is touched.
This phase is presentation only.

## Requirements

- The stage machine lives in the page; stages are `BRACKET | SERIES | RESULT`
  plus the loading and error guards. **No sub-routes** — the run lives only in
  `RunProvider` memory and a route change unmounts it.
- All derivation is pure and lives in `src/lib/tournament-view.ts`, not in
  components. `src/lib/db/*` is never imported by a test (Phase 11 constraint),
  and components are not tested per `coding-standards.md`, so anything with a
  rule in it belongs in the pure module.
- Every component follows the `type Props = {}` template in
  `coding-standards.md`. Tailwind only; no CSS module unless genuinely needed.
- `@/` imports throughout. No `any`.

## Squad name - "Dynasty Five" is mockup filler

`Squad.name` is **optional** — Phase 12 trims it and leaves it unset when the
player names nothing. Every mockup was generated with a named squad, so
`DYNASTY FIVE` appears throughout. It is placeholder text, not a default.

- **Name set** → render it verbatim everywhere the mockups print `DYNASTY FIVE`:
  the squad rail, the squad's matchup card, and the A4 banner.
- **Name not set** → render the fixed fallback **`YOUR SQUAD`**. Never substitute
  `Dynasty Five`, never generate a name, never leave the line blank.
- The mockups show a `YOUR SQUAD` badge *beside* the name on the bracket card.
  When falling back, **drop the badge** — the card must not read
  `YOUR SQUAD · YOUR SQUAD`.
- A4's banner becomes `ONE SERIES FROM THE TITLE — YOUR SQUAD VS 2017 GOLDEN
  STATE WARRIORS`.

The fallback string lives in one exported constant in
`src/lib/tournament-view.ts` (`squadDisplayName(squad)`), not repeated per
component. The current page's ad-hoc `squad.name ?? "Your squad"` is replaced by
it.

## Invariants (from `tournament-ui-design.md` §4)

These are gameplay rules, not styling. Each one gets a test in
`src/lib/tournament-view.test.ts`.

1. **`bracketSlot` is never rendered.** It is a layout position that reads as a
   seed and is not one. Only `BracketOpponent.seed` may appear as a number next
   to a team. A test greps the bracket components for `bracketSlot` and fails on
   any use outside layout ordering.
2. **No second bracket.** The Finals opponent renders as a standalone
   other-conference champion stub. Never a mirrored ladder, never TBD slots for
   the far conference. Branch on `bracketSlot === null`, not on the round id.
3. **The Finals opponent is hidden until the Conference Finals.** See below.
4. **Pedigree is never shown raw.** `opponent.pedigree` maps to a band.

## Pure module - `src/lib/tournament-view.ts`

| Function | Returns |
| --- | --- |
| `squadDisplayName(squad)` | the squad's name, or `"YOUR SQUAD"` when unset |
| `difficultyBand(pedigree)` | `"CONTENDER" \| "ELITE" \| "LEGENDARY"` |
| `isFinalsOpponentRevealed(bracket)` | `true` once the squad's Conference Finals matchup exists |
| `roundsUntilFinals(bracket)` | `number` — drives "3 rounds away" |
| `squadPath(bracket)` | the squad's one matchup per round, in order — the mobile spine and the Phase 19 recap both read this |
| `matchupCardState(matchup, nextMatchupId)` | `"UPCOMING" \| "NEXT" \| "RESOLVED"` |
| `visibleRounds(bracket, revealedThrough)` | rounds with far-half results masked past the reveal point |

**Band thresholds** are chosen in this phase and pinned by test. Start from the
`pedigree` distribution the generator produces (0–100, escalating by group) and
split so all three bands are reachable in a normal run — the mockups show
`CONTENDER` in Round 1 and `LEGENDARY` at the Conference Finals.

## The far-half reveal

`resolveOpponentMatchups` already runs on load and resolves the entire far half
before the player has played a game. **Keep the computation eager** — it costs
nothing and avoids a stall — but gate the display.

- Track `revealedThrough: BracketRoundId` in page state, starting at
  `FIRST_ROUND` with nothing resolved shown.
- A far-half matchup's winner is visible only once the squad has completed the
  same round.
- `visibleRounds` is the single place this masking happens.

Without this the bracket arrives two-thirds filled and "updates after every
round" (hard constraint 12) becomes a table refresh.

## The Finals stub

| Bracket state | Finals slot renders as |
| --- | --- |
| Round 1 ready (A1) | Locked silhouette, `WESTERN CONFERENCE CHAMPION`, `Revealed at the Conference Finals`, `3 ROUNDS AWAY` |
| Conference Semifinals ready (A2) | Same, `2 ROUNDS AWAY` |
| Conference Finals ready (A3) | **Revealed** — logo, `2017 Golden State Warriors`, `1 SEED`, `16-1`, still labeled `WESTERN CONFERENCE CHAMPION` |
| NBA Finals ready (A4) | Revealed, and now also the opponent in the live Finals matchup card |

The label is the opposite conference of `bracket.conference`, not a literal.

## Components

```text
src/components/tournament/
  TournamentStage.tsx      stage switch + cross-fade
  SquadRail.tsx            desktop strip / mobile summary bar + sheet
  BracketLadder.tsx        4 columns + SVG connectors (desktop/tablet)
  BracketSpine.tsx         vertical path (<768px)
  MatchupCard.tsx          both slots, states, series score when resolved
  TeamSlotRow.tsx          logo, name, seed badge, record, difficulty meter
  FinalsChampionStub.tsx   locked and revealed
  SeriesResultCard.tsx     the Phase 17 seam - plain result, one CTA
  TournamentEmptyState.tsx D1/D2/D3
```

`TeamLogoBadge` is reused from `src/components/draft/`; move it to
`src/components/shared/` only if that is a one-line change, otherwise import it
where it is.

## Screens

**A1–A4** as in the mockups. One layout, four progressions. The round heading
(`Round 1`, `Conference Finals`, `NBA Finals` with a trophy glyph) and the
primary CTA both derive from the next unplayed squad matchup.

**A4 adds a banner** — `ONE SERIES FROM THE TITLE — DYNASTY FIVE VS 2017 GOLDEN
STATE WARRIORS` — see `desktop-bracket-end.png`.

**D1 Loading** covers both the bracket fetch and the roster fetch as one state.
**D2 No run** and **D3 Error** as in `desktop-edge-no-squad.png` /
`desktop-edge-error.png`. D2 already exists in the current page and keeps its
copy and link target.

## Responsiveness

Verify at 1440, 1280, 1024, 768, 390. **No horizontal page scroll at any width.**

| Width | Ladder |
| --- | --- |
| ≥1280 | 4 columns, connectors drawn |
| 1024–1279 | same, compressed cards |
| 768–1023 | rounds stack as labeled sections, simple vertical indicators |
| <768 | `BracketSpine` — squad's matchup per round only, `Show full bracket` expands the rest |

**The mockups are missing the mobile squad rail** (`mobile-bracket-start.png`
starts at the round heading). Build it: a single summary bar
(`DYNASTY FIVE · EAST · 91`) opening a bottom sheet with the five players.

The draft page already overflows horizontally at 320px (found in Phase 12). Do
not regress that here, but 320 is not a target width.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`.
- `/play/tournament` stays a client page under the existing `play` layout; the
  four other routes keep their current prerender status.
- Browser-driven against live Neon at 1440×1000 and 390×844, zero console
  errors: draft a squad, confirm, and play all four rounds to a champion; then a
  second run played to an elimination.
- The far half is masked on arrival and reveals exactly one round at a time.
- The Finals stub is locked in Round 1 and Semifinals, revealed at the
  Conference Finals.
- `Show full bracket` expands and collapses at 390 with no overflow.
- Reload still shows D2.
- **Run one squad named and one squad unnamed.** The unnamed run reads
  `YOUR SQUAD` in the rail, on the bracket card (with no duplicate badge) and in
  the A4 banner — and the string `Dynasty Five` appears nowhere in the app.

## Out of scope

Replay and scoreboard (17), speed/mode/skip controls and the face-off (18),
result and recap screens (19), motion polish beyond the stage cross-fade and the
advance animation (21). Run persistence across reload stays open — see
`tournament-ui-design.md` §6.

## References

**Design and decisions**

- `context/docs/tournament-ui-design.md` — §1 stages, §2.1–§2.2 states, §3
  decisions, §4 invariants, §6 open items
- `context/docs/bracket-generation.md` — §8 (`bracketSlot` is not a seed), §10
  (the champion stub obligation, and why there is no second bracket)
- `context/project-overview.md` — §D tournament, hard constraint 12 (the bracket
  must be visible and update after every round)
- `context/coding-standards.md` — component template, `@/` imports, Tailwind v4,
  testing scope
- `context/current-feature.md` — Phase 14 History (bracket generation, the
  `bracketSlot` rename), Phase 12 History (`RunProvider`, optional squad name)

**Mockups** (`context/screenshots/tournament/`)

- `desktop-bracket-start.png` — A1 · `desktop-bracket-mid.png` — A3 ·
  `desktop-bracket-end.png` — A4
- `mobile-bracket-start.png`, `mobile-bracket-mid.png`, `mobile-bracket-end.png`
  — the spine
- `desktop-edge-loading.png` — D1 · `desktop-edge-no-squad.png` — D2 ·
  `desktop-edge-error.png` — D3

**Code**

- `src/types/bracket.ts`, `src/types/game.ts` (`Squad`, `Conference`)
- `src/lib/bracket.ts` (`ROUND_LABELS`), `src/lib/bracket-client.ts`
- `src/lib/match.ts` (`allMatchups`, `findMatchup`, `isSquadMatchup`,
  `playMatchup`, `resolveOpponentMatchups`), `src/lib/match-client.ts`
- `src/components/play/RunProvider.tsx`, `src/app/play/tournament/page.tsx`
- `src/lib/format.ts`, `src/lib/team-logo.ts`,
  `src/components/draft/TeamLogoBadge.tsx`
