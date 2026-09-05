# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## References

<!-- Spec files, docs, and source files this feature depends on -->

## History

### Phase 1 — Project Foundation Setup

Cleared the `create-next-app` boilerplate and installed the stack: Prisma 7 + `@prisma/adapter-neon`, `motion`, Zod, shadcn/ui, Vitest and Prettier, with `src/`, `prisma/` and `scripts/` in place.

### Phase 2 — Core Entity Schema

Added the identity layer — `Position`/`Conference` enums plus `Player`, `Team`, `Season` and `Roster`.
`prisma migrate dev` cannot author migrations offline, so they are written with `migrate diff`; Phase 9 later reshaped most of this.

### Phase 3 — Ratings & Playoff History Schema

Added `PlayoffRound`, `PlayerSeasonRating`, `TeamSeasonRating` and `PlayoffParticipation`, keeping participation and results in one table since they describe the same appearance.

### Phase 9 (part 1) — Rating & Type Alignment

Reshaped the schema around a single `overallRating`, dropped the `seasons` table, and split `rosters` into `team_seasons` + `player_seasons` + `player_season_teams`.
Done ahead of Phase 4 so the fixtures were not built against types about to change.

### Phase 4 — Mock Dataset

Hand-built 12 real playoff team-seasons as typed TS fixtures in `src/data/`, with readable slug ids and a hand-set 0–100 rating band.
Ingestion and rating code must never import these — the band is not engine output.

### Phase 7 (part 1) — Scraper Data Load (Raw CSV Export)

Scraped Basketball-Reference's advanced tables for 1981–2026 and committed 92 raw CSVs untouched under `src/data/raw/`.
Every file ends with a `League Average` row that must be filtered before load or it becomes a phantom player.

### Phase 7 (part 2) — Parser Data (Raw CSV → Parsed JSON)

`scripts/parse-raw-csv.py` turns the 46 regular-season CSVs into 20,263 parsed players under `src/data/parsed/`.
Those artifacts are gitignored, so every later stage must run `npm run parse:raw` first.

### Phase 5 (part 1) — Draft Page Design (Layout & Theme Scaffolding)

The first page that renders: `/play/draft` plus the "Dark Trophy Room" palette, which overwrites shadcn's `.dark` tokens so every primitive inherits the look for free.
Gradients and shadows cannot be `@theme` tokens and ship as `@utility` rules instead.

### Phase 5 (part 2) — Draft Page Design (Court, Cards & Motion)

Built the court, roster cards and reroll pool, with slot alignment coming from an aspect-ratio lock on the SVG's viewBox.
Everything on the court is positioned in percentages — anything added to it must use the same space, never px.

### Phase 6 — Draft Mechanics (Mock Data)

The draft became playable on fixtures: pure rules in `src/lib/draft.ts` plus a reducer, with randomness kept in the component so every rule is testable.
The drag payload is `text/plain` because Safari drops custom MIME types, and native drag does not work on touch.

### Phase 8 — Data Normalization & Player Rating Engine

All 20,260 rateable player-seasons got a reproducible 0–100 rating from `scripts/rate-players.py`.
Standardization is per-season over the MP ≥ 500 population — pooling seasons or including the low-minute tail silently breaks era-neutrality.

### Phase 9 (part 2) — Type Alignment

Finished the alignment: `players`/`teams` keyed by `slug`, one `Position` per player-season, and the three unapplied migrations squashed into one.
A player now fits exactly one slot, reversing Phase 2's `Position[]`.

### Phase 10 (part 1) — Team Rating Engine & DB Data Files

Generated the seven committed table files under `src/data/db/`, plus a team-rating engine that needed a z-score and logistic stage the spec omitted.
A roster's third-best player contributes nothing when he shares a slot with someone better, which systematically understates stacked teams.

### Phase 10 (part 1b) — Playoff Participation Data

Folded 678 series rows into 724 team-level playoff appearances covering 1981–2026.
Finals rows carry no conference, and `Team.conference` is not a valid fallback — NOH played the East in 2003 and 2004.

### Phase 10 (part 2) — Neon Setup & Ingestion Runner

Applied the migration to a live Neon branch and loaded all 69,036 rows, reading every row back and hashing it against the source.
The migration-rewrite window is now closed; no `DIRECT_URL` was needed, against expectation.

### Phase 11 — Data Access Layer

Four `GET` route handlers over a typed query API, serving the draft board.
`@/lib/db` builds a `PrismaClient` at module scope and throws without `DATABASE_URL`, so anything a test imports must live in a pure module — the constraint behind every later extraction.

### Phase 13 — Draft Mechanics (Real Data)

Re-pointed the draft at all 1,292 team-seasons in Neon, with no change to the reducer or its rules.
An `AbortController` in a ref is the race guard, and a failed fetch must never consume a reroll.

### Fix — Another Team stays in the same season

`Another Team` now holds the season and varies the franchise, mirroring `Another Season`.
The filters moved into the pure module, since a rule inside a Prisma `where` clause is one no test can pin.

### Phase 12 — Squad Confirmation & Run Handoff

`Start Tournament` opens a confirmation dialog — review the five, name the squad, pick a conference — and carries the run to `/play/tournament` through a React context.
That context is in-memory, so a reload or the Back button loses the run.

### Phase 14 — Bracket Generation

Brackets are built from the 724 playoff rows using a pedigree score, never `team_seasons.rating`, which ranks the 72-10 Bulls below `PHI-1983`.
Escalation is by construction: four draw groups, each floored at the previous group's highest pedigree.

### Phase 15 — Match Simulation Engine

Best-of-7 series simulated possession by possession from minutes-weighted BPM, computed to a finished log before anything is presented.
Sides are `HOME`/`AWAY` rather than squad/opponent, because the far half plays itself out and has neither.

### Phase 16 — Tournament Shell & Bracket UI

The `BRACKET | SERIES | RESULT` stage machine plus the live bracket, leaving the run completable end to end.
Masking a matchup is not enough — anything derived from `SeriesState` must be looked up *through* the masked matchup, or far-half scores leak.

### Phase 17 — Match Replay & Live Scoreboard

The finished log paced onto a game clock: scoreboard, line score, momentum, leaders, play-by-play, quarter breaks and overtime.
The spoiler invariant is enforced by truncating the log and asserting the frame is unchanged at every cursor.

### Phase 18 — Modes, Speeds & Series Flow

Slow/Normal/Fast, Manual/Automatic, a per-game `Skip to final`, and the series as a unit from face-off to result card.
Fast is set by the 100ms delay floor rather than the speed factor, so tuning the factor does nothing.

### Phase 19 — Results & Run Summary

Victory/defeat screen, run recap and a read-only bracket archive, closing the tournament UI arc.
Run persistence is settled as a deliberate no — a reload still loses the run, its bracket and its results.

### Phase 20 (part 1) — Motion Foundation, Reduced Motion & Route Transition

One duration/easing vocabulary in `src/lib/motion.ts`, mirrored in `globals.css` and pinned by a test that parses both, plus the route transition.
Eight components lost their hand-picked values; `MotionConfig` does not stop delays, so staggers still need an explicit `reduced` guard.

### Phase 20 (part 1) — Browser verification pass

Ran part 1's browser checks after the fact, measuring per animation frame rather than by screenshot, since every animation is shorter than a screenshot round-trip.
Nothing needed fixing, and reduced motion changes no pacing.

### Phase 20 (part 2) — Draft Screen Motion

Draft motion items 1–7, with the slot-invitation rules extracted into `src/lib/draft-preview.ts`.
`MotionConfig` snaps a transform target rather than omitting it, so every transform gesture needs its own `reduced` guard.

### Phase 20 (part 3) — Tournament Bracket Motion

Bracket motion items 8–12, plus the 44px touch-target sweep Phases 16 and 18 left open.
The spec's premise was wrong: `TournamentStage` remounts the whole bracket, so every entrance is a mount animation, never a transition on a surviving element.

### Phase 20 (part 4) — Match Replay Motion

Replay motion items 13–18, with the momentum x-axis moved into `replay.ts` so the existing spoiler test covers it for free.
`AnimatePresence`'s default mode keeps a departing row in flow, which bounced the leaders column 44px until `popLayout`.

### Phase 20 (part 5) — Result Screen Motion

Result-screen items 19–21, closing all 24 motion items.
Sections arrive a constant beat apart, never the previous block's length — the distinction is invisible until a block grows, and is what stops a stagger of staggers.

### Refactor — `src/lib` deduplication

Collapsed six duplications into `src/lib/api-client.ts` and `src/lib/query.ts`, with each shared rule now defined exactly once.
Equivalence was proven rather than argued: 40 seeded runs hashed byte-identically on both branches.

### Refactor — `src/hooks` cleanup

Deleted the dead `advance`, renamed an overloaded parameter, and turned the tick handler into an explicit `switch`.
That switch does **not** enforce exhaustiveness — it sits in a void callback, so TypeScript has nothing to check against.

### Refactor — `src/components/draft` cleanup

Extracted `resolvePreviewPlayer` into `draft-preview.ts`, added a shared `RatingBadge`, and corrected a comment documenting the opposite of the code.
The progress bar fills by count, never by slot identity — slot-indexing leaves gaps under a "5/5" caption.

### Refactor — `src/components/tournament` cleanup

Unified six crest renderings into `TeamCrest`, added `PositionChip`, and extracted `winsAtBuzzer` into `replay.ts`.
Two of the six fills had already drifted, so unifying on `bg-primary/15` is the one deliberate visual change.

### Refactor — `src/app/api` cleanup

Unified the frozen-history cache header and documented that `force-dynamic` is inert, since Route Handlers are uncached by default.
The two endpoints now agree because the value was copied, not shared — nothing structural stops it drifting again.

### Refactor — `src/app/play` cleanup

Extracted `postSeriesView` and `BracketStageView` out of the 354-line tournament page.
This fixed a latent defect where an in-progress run reached the bracket under a button reading "See how the run ended".

### Cleanup — Orphan Removal, Context Accuracy & Comment Collapse

Deleted the unused `ui/badge.tsx`, corrected `project-overview.md`'s "In planning" status and `context/README.md`'s file listing, collapsed all 264 multi-line comments in `src/` to one line each, and condensed these history entries from 2,012 lines to 232 — the full text of every earlier entry survives in git.
Comment-stripped transpilation of all 82 changed files hashed identically to `main`, proving no code changed; `src/data/` was not touched.

### Fix — Accessibility Fixes from the UI Review

Named the three reroll buttons, whose labels vanish below `sm` while lucide hides the icon from the a11y tree, gave `/play/draft` its missing `<h1>`, and lifted the loss badge from 3.89:1 to 5.12:1.
No foreground passes AA on the old `--destructive` — black tops out at 4.80 — so the badge could only be fixed by lightening the token to `oklch(0.65 0.2 25)`, which also repaired three latent small-text failures elsewhere.
