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

### Fix — Code Scan Follow-ups

Bounded `excludeSeasons` at `SQUAD_SIZE + TOTAL_REROLLS` — the most team-seasons a run can ever be offered — dropped `unoptimized` from the app's only `next/image`, and corrected `teamInitials`' comment; `teamInitials` also got the first tests it has ever had, since the fallback is now a verified path.
The bound counts ids *after* `splitIds` strips blanks, so padding a list with empty entries does not consume it; a missing logo now fails as a **400** from `/_next/image` rather than a direct 404, and `onError` still fires on that.
The draft is **not** drag-only, correcting the previous entry's touch concern — `RosterPlayerCard` has an `onClick`, and selecting a slot then clicking a player completes a run without any drag.

### Feature — Draft Ergonomics & Replay Control Placement

Raised the reroll pool from 3 to 5, capped the court so all five slots fit a desktop viewport, opened a second way to draft — click a player and he takes his own slot, with slot-first and drag-and-drop untouched — moved the replay control bar above the scoreboard, compacted the replay, and dropped the seed and win–loss line from the bracket.
The player-first path was a rules change, not wiring: `DraftBoard` already passed `selectedPosition ?? player.position`, and only `validateDraft`'s `NO_SLOT_SELECTED` guard stood in the way; retiring it made `AVAILABLE` identical to `DRAFTABLE` and that rejection unreachable, so both were deleted rather than left as dead branches.
The court is capped on **width** — a `max-height` on an `aspect-ratio` box overrides the ratio and would spread the percentage-placed slots — and `PlayByPlayFeed`'s `max-h-[32rem]` turned out to be the replay grid's real height driver, so compacting the scoreboard bought nothing until the feed came down too.
The FINAL state is the tallest, not the live one: measuring only mid-game hid a 45px overflow that pushed the continue button below the fold at 1440×900. Mobile's pinned control bar is unchanged — still 141px against its 144px reservation, still 44px touch targets — because `fixed` ignores DOM order.

### Phase 21 — Home Screen

The landing page: hero court, pool counters, the three draft rules, the escalating ladder and the closing CTA, on a server-component `/` composing five client sections, with every figure pinned to `src/data/` by `landing.test.ts` and no `src/data/db/*` import on the route.
Two of the design mock's four ladder opponents were **undrawable**: the 1993 Knicks score 80 pedigree against a Conference Semifinals band that stops at 72, and the 1989 Pistons 100 against a Conference Finals band that stops at 88 — matchups `generateBracket` could never produce. Pedigree is therefore never written into the constants; `landing.ts` stores the real playoff row and calls `pedigreeOf`, and a test asserts each opponent falls inside its own round's `BANDS` window. Three hero figures were wrong too — `jamesle01-2013` is a **PF** rated 99, not an SF rated 97, so the SF slot uses 2012.
**A statically rendered page cannot branch a motion `initial` on `useReducedMotion`.** The server always assumes `false` and emits the hidden frame; a reduced-motion client emits none, and the two disagree on hydration — React #418. The draft page never showed this because its animated content mounts after data loads. `entranceFrom` is the wrong tool on a prerendered surface: initial frames are now declared unconditionally and the rest state pinned in CSS via `data-motion-reveal` / `data-motion-spent`, which also leaves the content visible before JS runs. `DifficultyMeter` needed the same treatment, being the one shared component the page renders statically. The same hydration rule reaches the counters: they read "have we hydrated" through `useSyncExternalStore`, not a `useEffect` setState, which `react-hooks/set-state-in-effect` rejects.
`TweenNumber` only moves when its `value` **changes**, so the tiles mount at 0 and take the real number on the in-view trigger — one mounted straight at its target counts nothing, which is what makes an already-in-view section behave.
Slot width was a comment in two components until it joined the placements in `court-layout.ts`; the two are one invariant, and `court-layout.test.ts` derives the widest legal slot from the placements rather than restating 30. Reintroducing the 36% hero bug fails it three ways — SG at −3%, SF at 103%, width ≠ 30. `COURT_SHELL` is also asserted to carry no height cap, the Draft Ergonomics trap that had no other guard. Both courts re-measured identical after the extraction (ratio 0.909, five slots on their original percentages).

### Fix — Skip-in-Automatic, Host-First Scoreboard & Court Card Redesign

`Skip to final` now chains into the next game in Automatic while Manual still waits for a click; the hosting team leads the whole replay surface, swapping sides as the series changes city; and the draft court card carries the landing hero's design — team logo, position, rating, name, season and franchise, with the silhouette and the check badge gone.
**`gameAdvance`'s `skipped` parameter was deleted outright rather than gated on mode.** `advanceDelayMs` maps `CLICK` and `NONE` to the same `null` and `gameAdvance` feeds nothing but `useAutoAdvance`, so Manual is unchanged either way and the third argument could never matter again. This reverses Phase 18's documented rule; that phase doc is left as the historical record.
**`HOME`/`AWAY` are bracket slots, not venues** — the venue is `game.hostSide`, alternating 2-2-1-1-1, so the pair swaps *within* a series and not merely between opponents. The reorder is presentation-only: `bySide` / `hostFirstSides` in `tournament-view.ts` with every value still slot-keyed, which is why `replay.ts`, `match.ts`, the spoiler invariant and the home-court tests never moved. Six components took `first`/`second`; `LineScoreTable` needed no cell change because it already indexed by `side.id`.
The gold series dots had been counting the **home slot's** wins, which is the opponent's whenever the squad's rating lands it in seeds 5-8 — a bug that had been shipping green because nothing tested it. `squadWinsOf` fixes it and puts `SeriesBanner` on the same squad-anchored footing as `SeriesResultCard`.
**Open issue: `MomentumStrip` is still slot-anchored.** It is the only consumer of the signed margin and plots home-positive, so the chart rises for the HOME slot regardless of display order. Previously "leftmost" and "chart up" both meant HOME and agreed; now the scoreboard's order changes per game while the polarity does not, so in an away-hosted game the leading team sits on the left while the chart dips for them. The `CHI +4` label stays correct — only the direction misleads. The fix is to pass `first`/`second` and negate the margin when `first.id === "AWAY"`.
The filled court card keeps `min-h-[20cqw]` rather than sizing to content: filled and empty slots coexist, so a content-sized card makes the court uneven and jumps the keyed `AnimatePresence` swap. `TeamLogoBadge` gained a `court` size in `cqw` — reused rather than rewritten, because it already owns the `onError` → `teamInitials` fallback — plus a proportional inset, since a fixed 6px padding on a ~16px box leaves almost no logo. `public/assets/player-silhouette.svg` is now unreferenced but kept.
Each fix was mutation-checked rather than assumed: reverting the skip suppression fails 2 tests, always-home-first fails 2, and home-first dots fails 1. Browser-verified with a sub-70 squad so the run took the AWAY slot — the case that exercises both the swap and the dots.

### Feature — Shareable Run Card

A **Share your run** button on the result screen opens a dialog previewing a vertical PNG of the run — wordmark, squad name, a CHAMPION or ELIMINATED banner, the five in slot order with crest, season, team, position and rating, the squad average and playoff record, and a closing line naming the team that ended the run or was beaten in the Finals — offered in three shapes and saved or copied as a link.
**A run is runtime-only state, so the card's data rides in the URL.** `RunProvider` holds the run in memory and a reload loses it, so the route has nothing to look up; the payload is base64url JSON in the query string, which is also exactly what makes the copied link work for someone else. `buildShareCard` and `decodeShareCard` are two halves of one contract, pinned by a test sweeping six run shapes and every series length — a builder that can emit what the decoder rejects fails as a bare 400 with no other symptom.
**`btoa(JSON.stringify(...))` throws on the real roster.** Dončić and Šarić carry code points above U+00FF, so encoding goes through `TextEncoder` and decoding through `TextDecoder`. The bundled Geist renders those glyphs correctly, so no font file was committed; it is the only weight available, which is why the card takes its contrast from size, colour and letter-spacing rather than bold.
**`next/image` and `next/og` cannot share a server process — this is why `images.unoptimized` is set.** Once anything hits `/_next/image`, every later card render dies with `Input buffer contains unsupported image format`, in dev *and* production, and only a restart recovers. `@vercel/og` calls `getSharp()` per render and memoises it: the import fails from its own bundle at first so it rasterises through its bundled `resvg.wasm`, but the optimizer pulls sharp into the process, the import then succeeds, and og switches to a sharp path that throws on every card — including cards holding no `<img>` at all, which is what rules out the logos. Reproduce in one line: render a card (200), `curl /_next/image?url=%2Flogos%2FCHI.png&w=128&q=75`, render again (500). The edge runtime dodges sharp entirely but is deprecated in Next 16. **Adding a `next/image` anywhere silently breaks sharing again.**
Satori is not the browser: no `grid`, a 500KB budget, no Tailwind, so the Dark Trophy Room palette is restated as sRGB constants. **`backgroundImage: "none"` fails the whole render**, which killed every ELIMINATED card until both outcomes were given a real gradient. **`new ImageResponse(...)` renders lazily as its stream is read**, so a `try`/`catch` around the constructor catches nothing and the first failures arrived as `failed to pipe response` with a half-written body; awaiting `.arrayBuffer()` inside the try is what turns a render failure into a clean 500.
A taller canvas needs bigger type, not taller boxes — letting rows `flexGrow` into 9:16 left them hollow, so `METRICS` carries a per-shape `scale` and the column is `space-between`. The shape is chosen when the **dialog** opens, not when the result screen mounts: the state lives in a panel inside `DialogContent`, which Radix mounts only while open, because a `useState` initializer higher up freezes at the width the result screen appeared at and an effect would trip `react-hooks/set-state-in-effect`.
Satori has no `onError`, so `loadShareLogos` resolves all five crests up front and hands `null` for anything that did not return — a 404 would otherwise fail the entire image rather than one row. All 40 slugs have a logo, so the fallback never fires on real data and was verified by rendering unreachable slugs. It lives in `src/lib` rather than the route so a fake fetch can pin the dedupe, the 404, a throwing fetch and a body that fails mid-read.
The download is deliberately one fixed `legacyrun-result.png` for every run, by request, rather than a name built from squad and outcome. The preview distinguishes RENDERING from FAILED and disables both actions until an image is behind them — a silent failure otherwise reads as a hang, which is how the sharp conflict first presented.
Each new test was mutation-checked: dropping the slug dedupe, ignoring the 404 guard, shifting the `sm` breakpoint, adding an article before "Round 1", dropping the slug path-traversal guard and dropping the five-player rule each failed at least one test, against a passing no-op control.
**Unverified:** the CHAMPION path was never reached in a live playthrough — the card itself was rendered through the route many times and the builder's champion branch is unit-tested — and the new FAILED preview branch is typechecked but not browser-verified. A raw PNG link previews inline in WhatsApp, Discord and Slack; iMessage and X want OG tags on an HTML page, which this deliberately is not.

### Fix — Momentum Polarity & Config Guards

The momentum chart now rises for whichever team leads the scoreboard instead of for the HOME slot, closing the open issue the host-first entry above left; `next.config.ts`'s `images.unoptimized` gained a test that fails if it is ever removed; and the four data routes' cache headers are defined once in `api-response.ts`.
**The polarity rule had to leave the component to be tested at all.** This repo tests utilities, never components, so a flip written inline in `MomentumStrip` would have shipped with zero coverage — `marginPolarity` lives in `tournament-view.ts` beside `bySide`/`hostFirstSides` for the same reason those do. `replay.ts` never moved: `MomentumPoint.margin` and `frame.margin` stay slot-signed, and the single multiply happens at the component boundary, which is what keeps the spoiler invariant and the home-court tests untouched.
**Three sites read the sign and all three had to move together** — the polyline `y`, the tip dot's `top`, and `leader`, which drives both the `CHI +4` badge and the `sr-only` line. The badge was already correct before the fix, so the regression risk ran the other way: fixing the chart while breaking the label. The test asserts they agree rather than asserting each separately.
**The first cut of the cache-header tests left a hole big enough to break the draft.** They pinned the two values and banned inlined literals, but nothing pinned *which* constant each route uses — pointing `/api/draft/team` at `FROZEN_HISTORY_HEADERS` passed all six, and would have served one random team+season for a year. Confirmed by mutation before writing anything. `covers every data route` now asserts the expectation map equals the routes on disk, so a new route must declare its caching intent instead of inheriting silence.
**A file-parsing guard can satisfy itself.** `next-config.test.ts` proves the `next/og` ↔ `next/image` conflict still exists, and its own source contains both strings — it excludes `*.test.ts` for that reason, verified sound because no `.test.tsx` exists in `src/`. Its deliverable is the failure message, not the assertion: a bare "expected false to be true" gets the test deleted by the next reviewer.
**The `s` regex flag fails the build** — it needs an es2018 target — but `[^}]*` already crosses newlines, since a negated character class matches them by default. Only `.` ever needs `s`.
Two review findings on new lines: `dataRoutes.sort()` mutated an array shared between tests, and `NO_STORE_HEADERS`' comment claimed "randomised per request", which is false for the bracket route whenever a `runSeed` is supplied — the conclusion was right and the reason was not.
Mutation-checked against a passing control: polarity pinned at `1` fails 3, `unoptimized: false` fails 1, re-inlining a header literal fails 1, swapping a route's constant fails 1, and adding an undeclared data route fails 1.
Browser-verified on the only frame where the bug is visible — a 49-rated squad took the AWAY slot, and **Game 3 "AT YOU"** put that slot on the left leading 115-98 with the area filling *above* the midline. 40 samples across three games, no disagreement between label, scoreboard order and chart direction. That squad also beating the 1983 Celtics by 17 is a difficulty observation, not a defect, and is left for the difficulty pass.
