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

Cleared the `create-next-app` boilerplate and installed the stack: Prisma 7 + `@prisma/adapter-neon`, `motion`, Zod, shadcn/ui (`radix`/`nova` preset), Vitest, Prettier. Set up the `src/` folder structure with `prisma/` and `scripts/` at the root.

Gotchas:

- Prisma 7 removed `url` from the `datasource` block — see `coding-standards.md`.
- `.env*` in `.gitignore` was swallowing `.env.example`; fixed with a `!.env.example` negation.
- `@typescript-eslint/no-empty-object-type` relaxed so the mandated `type Props = {}` passes.

Verified: `lint`, `format:check`, `test`, `prisma validate`, `build`. Not verified: any live database connection.

### Phase 2 — Core Entity Schema

Added the identity layer to `prisma/schema.prisma`: `Position` and `Conference` enums plus `Player`, `Team`, `Season`, and `Roster`. (Phase 9 later reshaped most of this.)

Gotchas:

- **Positions are an unordered `Position[]`, not primary/secondary** — two slots truncate players who cover three (Draymond at PF/C/SF). A player fits a slot if it appears in the array.
- **`player_positions` was dropped** — as one array column it was strictly 1:1 with `rosters` and bought only a join.
- **`prisma migrate dev` can't author migrations offline** (it needs a shadow DB). Used `prisma migrate diff --from-empty --to-schema … --script`. Prisma 7 renamed `--to-schema-datamodel` to `--to-schema`; most examples still show the old flag.

Verified: `prisma validate`, `db:generate`, `lint`, `format:check`, `test`, `build`. The migration is authored but **unapplied**.

### Phase 3 — Ratings & Playoff History Schema

Added `PlayoffRound` plus `PlayerSeasonRating`, `TeamSeasonRating`, and `PlayoffParticipation`. (Phase 9 later replaced the two rating tables.)

Gotchas:

- **Playoff participation and results are one table** — seed, round reached, and W/L all describe the same appearance. Split only if per-series records are ever needed.
- **`MISSED` dropped from `PlayoffRound`** — membership in the table *is* the "made the playoffs" signal, so the value is unreachable by construction.
- **`migration_lock.toml` was missing** — Phase 2 hand-authored its migration and never created it, so `prisma migrate` couldn't determine the connector. Added with `provider = "postgresql"`.
- **The offline-migration pattern for every change after the first**: `git show HEAD:prisma/schema.prisma > /tmp/previous.prisma`, then `prisma migrate diff --from-schema /tmp/previous.prisma --to-schema prisma/schema.prisma --script`. The `--from-migrations` form needs a live shadow DB.

Verified: `prisma validate`, `db:generate`, `lint`, `format:check`, `test`, `build`. Both migrations remain **unapplied**.

### Phase 9 (part 1) — Rating & Type Alignment

Reshaped the schema around a single `overallRating` and the fields Basketball-Reference's advanced table actually provides, then added the runtime gameplay types in `src/types/game.ts`. Done ahead of Phase 4 so the fixtures weren't built against types about to change. **Phase 9 stays 🟡** — the nullability guesses still need confirming.

Gotchas:

- **The `seasons` table was dropped** for a plain `seasonYear Int` (ending-year convention: 2008 = the 2007-08 season). It only carried a display label and added a join to every draft and bracket query.
- **`rosters` became `team_seasons` + `player_seasons` + `player_season_teams`.** The player-season is now the primary unit; the join table is the relational form of a `teams: string[]` field, since Postgres can't foreign-key an array.
- **One rating per player-season, taken from the combined `2TM`/`3TM` row.** A traded player shows the same rating whichever team offers him, matching the once-per-run duplicate rule and avoiding a rating built off a 5-game sample.
- **Offensive/defensive splits dropped** — one `overallRating` each for players and teams, reversing Phase 3. They return only if the Phase 19 sim engine needs them.
- **`player_season_data` is a 1:1 audit table** for raw scraped inputs. It deliberately doesn't repeat playerId/age/positions/teams — the FK reaches all of them, and duplicated keys drift.
- **Nullability guess (later refuted — see Phase 7):** advanced metrics were made nullable on the assumption early-1980s rows would be missing them.

Verified: `prisma validate`, `db:generate`, `lint`, `format:check`, `test`, `build`. All three migrations are **unapplied**, and this one drops what the other two create — worth squashing while the database is still empty.

### Phase 4 — Mock Dataset

Hand-built the local dataset as typed TS fixtures in `src/data/`: 12 real playoff team-seasons (1983 Sixers through 2023 Nuggets) with 9–11 players each, one completed `Squad`, the `TRADITIONAL` formation, and `teamLogoPath()`. Nothing touches the database.

Gotchas:

- **Ratings are a hand-set 0–100 band, not engine output.** Phase 8 must normalize into the same band. Ingestion and rating code must never import these fixtures.
- **Ids are readable slugs, not cuids** — `playerSeasonId` is `<playerId>-<year>`, `teamSeasonId` is `<teamSlug>-<year>`. Production rows use cuids, so nothing downstream may assume either format. (Superseded in part by Phase 9: `players` and `teams` are keyed by `slug` — the identity tables carry no cuid at all. Only the season-scoped tables generate ids.)
- **Team slug = franchise nickname** (`lakers`, `celtics`, …) because the slug doubles as the logo filename. **The uploaded PNGs must match exactly.**
- **`teamLogo` is never a literal** — every value comes from `teamLogoPath()`, the single home of the `/logos/<slug>.png` convention. The files don't exist yet, so the paths 404 and the UI needs a fallback.
- **Five real duplicate identities** span two team-seasons each (LeBron, Ray Allen, Robert Horry, Sam Cassell, Ron Harper), so Phase 16's duplicate guard has genuine cases to block.
- Bones Hyland was initially listed on the 2023 Nuggets — he was traded at that deadline and wasn't on the playoff roster. "Made the playoffs" is a roster-level fact, not a season-level one.

Verified: `npm test` (20 tests), `tsc --noEmit`, `lint`, `format:check`, `build`. Tests pin the id derivation, the rating band, one name+slug per `teamId`, and that every team-season can fill all five slots on its own.

### Phase 7 (part 1) — Scraper Data Load (Raw CSV Export)

Scraped Basketball-Reference's advanced tables for 1981–2026 and committed the raw exports untouched: 46 regular-season and 46 playoff CSVs (~4.7 MB) under `src/data/raw/`. Ships with `scripts/scrape-advanced.mts` (`npm run scrape:advanced`) and `scripts/validate-raw-csv.py` (`npm run validate:raw`).

Gotchas:

- **The files live at `src/data/raw/`, not root `data/raw/`** — the spec assumed a root `data/` that doesn't exist in this tree.
- **Playwright can't drive the Share & Export menu** — it's hover-only and closes on scroll, so a real click never lands. The scraper does the tab switch, export click, and `<pre>` read inside one `page.evaluate()`. This is the part most likely to break on a markup change; re-check the element ids (`advanced_sh` / `advanced_post_sh`, `csv_advanced` / `csv_advanced_post`).
- **The export opens with a citation preamble**, so the writer slices from the first `Rk,` line and errors if there isn't one — a truncated export fails loudly instead of writing junk.
- **The Phase 9 nullability guess is refuted.** Advanced metrics are populated on every real player row in all 92 files, 1981 included. The genuinely blank metric is TS%, and only for players with zero shot attempts — an undefined-ratio problem, not an era one. The nullable columns are right for a different reason.
- **Every file ends with a `League Average` row** (blank `Rk`, `Age`, `Team`, `Pos`, `G`, `MP`). It must be filtered before load or it becomes a phantom player.
- **`players-81-82-playoffs.csv` genuinely has no `GS` column** — verified against the live site, not a scrape failure. Whitelisted via `ALLOWED_MISSING`.
- `src/data/raw` is prettier-ignored — the files must stay byte-identical to the site's export.

Verified: `validate:raw` (46 + 46 files, 30 columns, one known exception), plus `lint`, `format:check`, `test`, `build`. Not verified: the values themselves — no row was hand-checked against the site.

### Phase 7 (part 2) — Parser Data (Raw CSV → Parsed JSON)

**Phase 7 complete.** Added `scripts/parse-raw-csv.py` (`npm run parse:raw`), which reads the 46 regular-season CSVs and writes `season_players.json` (46 season keys) and `flattened_players.json` (20,263 players) to `src/data/parsed/`. Twelve fields are kept and renamed to schema-ish names.

Gotchas:

- **The parsed artifacts are gitignored** — ~14 MB of derived data that regenerates in seconds. **Phase 8 and the later ETL must run `npm run parse:raw` first**; on a fresh clone the files do not exist.
- **`TeamSlug` is a mixed type by design** — a string for single-team players, an array for the 2,284 traded ones. Specced deliberately, and a footgun for the ETL: iterating a string yields characters.
- **Part 1's "every metric is populated" claim isn't quite right.** Three rows have blank PER/BPM/WS/48 (Alex Scales 2006, JamesOn Curry 2010, Damion James 2013) and all three have `MP = 0`. **Phase 8's missing-metric rule should key on `MP = 0`, not on season.**
- **The `League Average` row can't be filtered on a blank slug** — its `Player-additional` is the sentinel `-9999`. The filter matches on the name instead, and league-average values are dropped entirely.
- **Traded rows group by consecutive `(Rk, PlayerSlug)` pairs**, not by slug globally — the site emits the `nTM` total row first, then one row per team. Tokens run `2TM` through `5TM`, so the match is `^\d+TM$`.
- The script self-validates and fails loudly (missing column, orphan total row, mismatched per-team count, duplicate slug, unparseable number), accumulating errors rather than aborting on the first.
- The playoff CSVs are deliberately **not** parsed — no team-season or playoff-participation artifact exists yet.

Verified: 46 seasons / 20,263 players, one object per slug and per rank, 2,284 array-valued `TeamSlug` rows, no `League Average` row, byte-identical across two runs. Failure paths exercised against synthetic fixtures. Not verified: stat values beyond one hand-checked traded player, and no Vitest coverage — the script is Python.

### Phase 5 (part 1) — Draft Page Design (Layout & Theme Scaffolding)

The first thing in the project that renders. Added `/play/draft` (layout + page), `DraftTopBar` and `DraftSectionHeading`, four shadcn primitives, and the full "Dark Trophy Room" palette from `context/theme.md`. Panels hold a placeholder `h2` each.

Gotchas:

- **The theme overwrote the existing `.dark` block rather than adding a token set.** shadcn's components read `--primary`, `--ring`, `--border`, so overwriting those values makes every primitive inherit the gold/navy look for free; a parallel `--trophy-*` set would have left them all neutral-gray.
- **Gradients and shadows can't be `@theme` tokens** — `@theme` only generates utilities for recognized namespaces. They're plain `:root` properties surfaced through four `@utility` rules (`bg-gold`, `bg-room`, `shadow-trophy`, `shadow-panel`). Colours do go through `@theme inline`.
- **Court and position tokens live on `:root`, not `.dark`** — identical in both modes, so duplicating them would only invite drift.
- **`bg-court` beating shadcn's `bg-card` works on CSS source order alone.** tailwind-merge doesn't know custom utilities, so it can't dedupe them against built-ins. Verified in the browser. **Any future custom colour utility on a shadcn component needs the same check.**
- **The top bar sits in `page.tsx`, not the layout**, because it renders `filledSlots` — draft state in part 2.
- **shadcn's generated components aren't Prettier-formatted** and break `format:check`. Expect `prettier --write` after every `shadcn add`.

Verified: `lint`, `format:check`, `test`, `build`, plus a real browser at 1440px and 390px with zero console errors. Not verified: light mode (the app forces `.dark`).

### Phase 5 (part 2) — Draft Page Design (Court, Cards & Motion)

**Phase 5 complete.** Filled in both placeholder panels: `DraftCourt` + `CourtSlot` for the lineup, `DraftBoard` + `RosterPlayerCard` + `RerollPool` + `TeamLogoBadge` for the draft board. Added `src/lib/position-style.ts` and `src/lib/format.ts`, and committed `public/assets/`.

Gotchas:

- **Slot alignment comes from an aspect-ratio lock, not media queries.** The court box is `aspect-[100/110]` — exactly the `court.svg` viewBox — with the SVG stretched over it, and every slot placed at a percentage of that same box. Box and graphic are the same shape at every width, so slots can't drift. **Anything added to the court must be positioned in the same percentage space, never in px.**
- **The court is a `@container` and slot internals are sized in `cqw`**, so the lineup scales as one unit. Type needs `clamp(<floor>, Ncqw, <ceiling>)` — without the floor, the ~358px mobile court renders 6px text. Note `cqw` here is a fraction of the *court's* width, not the viewport's.
- **The asset SVGs are CSS masks, not `<img>`.** They ship with `currentColor`, which a standalone `<img>` resolves to black; the mask is what lets one jersey asset render gold when open and muted when merely empty.
- **Position colours must be literal class names** — Tailwind can't build `text-pos-${position}` at runtime, so `position-style.ts` writes out all five for text/border/bg/glow. A sixth position means editing four records.
- **Empty ≠ open.** No team offered → muted dashed, reads `EMPTY`. Team offered and the slot is fillable → gold dashed, reads `OPEN`.
- **`DRAFTED_COUNT` in `page.tsx` is the deliberate seam for Phase 6.** Phase 5 is UI-only, so all states derive from that one constant: 0 → empty board, 2 → mid-draft, 5 → complete. All three were driven in a browser against their reference screenshots before shipping at 2. Every component takes its state as props, so Phase 6 replaces the constant, not the components.
- **Motion is wired through `AnimatePresence` keyed on slot occupancy and board state**, so the "placing a drafted player" transition is already in place and fires as soon as that state changes — today it only plays on mount.
- **Both glows were tuned down on review** — open slots to `0 0 0.9rem -0.7rem`, filled cards to `0 0 1.25rem -0.65rem`. Both started ~2× larger and bled over the court lines. A glow that reads correctly in a 2× mockup is too strong at 1× CSS pixels.
- The team subtitle shows `TEAM RATING <n>` where the mockup shows a nickname; `DraftTeam` has no nickname field, and inventing one is a data decision.
- `abbreviatePlayerName()` renders "M. Johnson" for Magic Johnson — the fixtures store common names, so the initial comes from the nickname. Correct for every other player.

Verified: `lint`, `format:check`, `test` (20), `build`; `/play/draft` still prerenders as static. Browser-checked at 1440×1000 and 390×844 across all three states. The only console error is a `/logos/celtics.png` 404 — expected, and the initials fallback catches it. Not verified: no Vitest coverage for `src/lib/format.ts` (worth adding), and light mode is still untouched.

Still open: the page has no interactivity — Phase 6 owns that and is now next in `todo.md`. Team logo PNGs still don't exist. `DATABASE_URL` is a placeholder and all three migrations remain unapplied.

### Phase 6 — Draft Mechanics (Mock Data)

**Phase 6 complete.** The draft is playable. All mechanics live in `src/lib/draft.ts` as pure functions plus a `createDraftReducer(slots)` factory; `DraftExperience` is the one new client component and holds the `useReducer`. Grew the fixtures 12 → 20 team-seasons, added `sonner`, and dropped a placeholder `/play/tournament` page so the completed lineup has somewhere to go.

Gotchas:

- **Randomness stays out of the reducer.** The component picks the team and passes it in the action (`OFFER_TEAM`/`REROLL` both carry a `team`), so every rule is testable without stubbing `Math.random`. The three `random*` selectors take an injectable `Rng` and are asserted against *every* fixture team, not a sample.
- **`validateDraft` returns a typed rejection**, and the component — not the reducer — decides to toast. The reducer independently re-validates and no-ops, so an invalid dispatch can never corrupt state. This is what makes the "wrong CourtSlot" drop a visible error instead of a silent nothing.
- **Every court slot is a drop target, including filled and unselected ones.** `onDragOver` preventDefaults everywhere; otherwise a mistaken drop fires no event at all and there's nothing to report.
- **Drag payload is `text/plain`** carrying the `playerSeasonId`. A custom MIME type is dropped by Safari. Native HTML5 DnD also means **drag does not work on touch** — clicking a card is the mobile path.
- **Reroll enablement was corrected on review:** the spec said "selecting state" (a slot selected), but the intent is that rerolls unlock the moment a roster is on the board. `canReroll` requires only `offeredTeam !== null && rerollsLeft > 0`. `isSelectingPlayer` became dead and was deleted.
- **Drafting clears `offeredTeam`**, which is what makes "Get Random Team" reappear each round — the next team never auto-arrives. Switching slots mid-round only re-filters, never re-fetches.
- **`playerAvailability` has five states, not two.** `AVAILABLE` (fits an open slot, no slot picked yet) is clickable and toasts a prompt; `OFF_SLOT` dims mid-round; `OUT_OF_POSITION` keeps Phase 5's "Slot filled" copy; `ALREADY_DRAFTED` is the hard-constraint-6 block.
- **The dataset now gives all 10 franchises two seasons** (20 team-seasons, ~190 players) — "Another Season" is unreachable otherwise, and a test pins that invariant. This also multiplied the duplicate identities well past Phase 4's five.
- **shadcn's `sonner` pulls in `next-themes`.** The app hard-forces `.dark`, so the provider would do nothing; hardcoded `theme="dark"` and uninstalled the dependency.
- Two copy changes were needed for the mechanic to be discoverable — the roster header switches to "Pick a C" once a slot is chosen, and an empty slot gains a `SELECTED` state. No Phase 5 styling was otherwise touched.
- `Start Tournament` routes to `/play/tournament`, which is a placeholder line of text until Phase 18.

Verified: `npm test` (48), `lint`, `format:check`, `build`; `/play/draft` and `/play/tournament` both still prerender static. Browser-driven at 1440×1000 and 390×844: full five-man lineup drafted by click and by drag, wrong-slot drop rejected with the toast and no state change, all three reroll buttons drawing one pool down to 0/3, and J.R. Smith drafted from the '18 Cavs coming back `ALREADY DRAFTED` on the '16 Cavs roster. Only console errors are the known `/logos/*.png` 404s.

Still open: no touch-drag support. Team logo PNGs still don't exist. `DATABASE_URL` is a placeholder and all three migrations remain unapplied — Phase 8 is next.

### Phase 8 — Data Normalization & Player Rating Engine

**Phase 8 complete (player-seasons).** Every one of the 20,260 rateable player-seasons now carries a reproducible integer `Rating` on the 0–100 band, derived by pure arithmetic from the Phase 7 parsed JSON. Ships `scripts/rate-players.py` (`npm run rate:players`), the generated-and-committed `src/data/rating/season_players.ts`, `src/types/rating.ts`, and 9 Vitest tests. The engine is specced in full in `context/docs/player-rating-normalization.md`. Team-season aggregation was **not** part of this phase — it belongs to Phase 10.

Gotchas:

- **Committed TS, Python generator** — matching Phase 7's tooling. The output `.ts` is committed so nothing at build time depends on the gitignored parsed JSON. Run `npm run parse:raw` before `npm run rate:players` on a fresh clone.
- **Standardization is per-season and over the reference population only (MP ≥ 500).** Pooling all 46 seasons, or including the low-minute tail in the μ/σ, are the two mistakes that silently break era-neutrality.
- **The 3 unrateable rows are dropped** (Alex Scales 2006, JamesOn Curry 2010, Damion James 2013 — all `MP = 0`), so 20,263 parsed → 20,260 rated and every metric field in `RatedPlayerSeason` is non-null.
- **`TeamSlug` is always `string[]`** here — single-team values are wrapped, killing Phase 7's mixed-type footgun for the ETL.
- **The doc's "VORP floors near −2" is wrong by one row.** Michael Olowokandi 1999-2000 has VORP −2.6, making `sqrt(VORP + 2.5)` raise. The sqrt argument is floored at 0 rather than raising `VORP_SHIFT` — changing the shift would move the whole distribution and invalidate the logistic constants. He has the dataset's worst VORP, so the floor preserves ordering.
- **Population standard deviation, not sample** — confirmed against the doc's worked example (sample σ reads 4.601 where the doc says 4.595).
- **The doc's top-seasons list prints six of its nine at 98 where the engine gives 99** — same nine seasons, same order, all sitting in 98.5–99.0 where half-up rounding carries them over. Everything else reproduces exactly.
- **`season_players.ts` is prettier-ignored** and written one object per line (~6 MB / 20,266 lines) — reformatting would explode it across ~250k lines.
- **The file is snake_case** where the repo is otherwise kebab-case, because the spec names it explicitly. Its test is `season-players.test.ts`.
- Review fixes: the test's `bySeason` index was rebuilding the accumulating array per row (~4.4M copies); `validate_output` didn't type-check `Rating` itself; `is_rateable` required `MinutesPlayed` to be an `int`, so a float would have silently dropped a legitimate player. None changed the output — same SHA before and after.

Band check against the Phase 4 hand-set fixtures (playoff rosters, mean 68.4, range 44–98): full league 20,260 rows mean 61.1 / median 58 / 34–99; rotation regulars (MP ≥ 1500) 7,957 rows mean 70.5. The comparable subset lines up with the fixtures, so draft cards read the way the Phase 5 UI was designed against.

Verified: `npm test` (57), `lint`, `format:check`, `build`. Generator output byte-identical across two runs; exits 1 with a `run npm run parse:raw` hint when the source JSON is absent. Reproduces the doc's percentile table, min/max, the 68 low-minute ceiling, and the §8 worked example down to `n = 367` and all four μ/σ pairs.

Not verified: no Vitest coverage of the *engine* — it's Python, so the tests pin its output, not its arithmetic (same limitation as Phase 7). No stat value hand-checked against Basketball-Reference beyond the worked example.

Still open: nothing consumes `RATED_PLAYER_SEASONS` yet — wiring it to `PlayerSeason.overallRating` belongs to the ETL phase. Team-season ratings don't exist. `DATABASE_URL` is still a placeholder and all three migrations remain unapplied.

### Phase 9 (part 2) — Type Alignment

**Phase 9 complete.** Finished the alignment part 1 started: `players`/`teams` are keyed by `slug` with no cuid at all, `overallRating` → `rating`, `positions` collapsed to a single `Position`, `updatedAt` gone from every table, and the runtime gameplay types plus all 20 fixture team-seasons and the draft UI moved with them. The three unapplied migrations were squashed into one 143-line `20260816000000_initial_schema`.

Gotchas:

- **A player now fits exactly one slot** — this reverses Phase 2's deliberate `Position[]` decision (Draymond at PF/C/SF). 105 of the 196 fixture players were multi-position; each kept its **first** listing. Checked before converting: all 20 team-seasons still cover all five slots, so Phase 4's "any offered team can fill a lineup" invariant survives. The draft is genuinely more constrained than it was.
- **`validateDraft` now checks the duplicate rule before the position rules.** With one position per player, LeBron is `SF` in every season, so the cross-season duplicate case returned `WRONG_POSITION` and hid the real blocker. `playerAvailability` already reported identity first; the two now agree.
- **`PlayoffParticipation.teamId` had to repoint to `Team.slug`** even though the spec said not to touch that table — it foreign-keyed `Team.id`, which no longer exists. Forced, not chosen.
- **`DraftablePlayer.playerId` was deliberately left alone.** Only `SquadMember` was renamed to `playerSlug`, per spec; the two names now differ across the `toSquadMember` boundary, which reads odd but is what was asked for.
- **The migrations were squashed, not stacked.** Three files (337 lines of create-then-drop churn) became one `--from-empty` diff. Safe only because no database had ever applied them. **This window closes the moment Phase 10 runs `prisma migrate deploy` against a real Neon instance** — after that, rewriting history makes Prisma treat the database as corrupt.
- **`player_season_data` metrics stay nullable**, but the schema comment now gives the real reason (Phase 7: `MP = 0` rows leave them blank), replacing part 1's refuted early-1980s guess.
- One test was deleted rather than rewritten — `records the slot drafted into, not the player's first position` is unreachable by construction now, so the count is 56, not 57. `completeDraft`'s PF pick moved from Robert Horry (now `SF` on the '95 Rockets) to Carl Herrera.

Verified: `prisma validate`, `db:generate`, `npm test` (56), `lint`, `format:check`, `build`; both routes still prerender static. Browser-driven at 1440×1000 and 390×844: full 5/5 lineup drafted, one position badge per card, Shaq correctly `Slot filled` once C was taken, `Not a SG` on all seven non-SGs with only the two SGs live. Only console errors are the known `/logos/*.png` 404s.

Not verified: no database has run the squashed migration — `DATABASE_URL` is still the stock Prisma placeholder, and nothing consumes the Prisma client at runtime yet, so the schema half is type-checked but never executed.

Still open: team-season ratings don't exist and `RATED_PLAYER_SEASONS` still has no consumer — both are Phase 10, along with the first real Neon connection. Team logo PNGs still don't exist. No touch-drag support.

### Phase 10 (part 1) — Team Rating Engine & DB Data Files

**Phase 10 stays 🟡** — part 2 (Neon setup + ingestion runner) is untouched. This part turns `RATED_PLAYER_SEASONS` into the seven committed table files under `src/data/db/` that the runner will load, plus the team-season rating engine Phase 8 deferred. Ships `scripts/build-db-data.mts` (`npm run build:db-data`), `src/types/db-data.ts`, and 17 Vitest tests. No database was touched.

Row counts, all asserted in both the generator and the tests: `player.ts` 3,755 · `team.ts` 40 · `team_season.ts` 1,292 · `player_season.ts` 20,260 · `player_season_team.ts` 22,705 · `player_season_data.ts` 20,260 · `playoff_participation.ts` 0.

Gotchas:

- **The team rating needed a normalization stage the spec didn't have.** The specced flat mean of five positional bests produced a 55–87 band with *no team above 90* — averaging five numbers destroys variance, and nothing rescaled the result. The engine now runs three stages: same lineup selection → star-weighted aggregate (`0.32/0.24/0.19/0.14/0.11` by rating) → z-score over all 1,292 rows → logistic `35 + 64 / (1 + e^(−1.15z))`. Result: 36–95, median 69, 4.7% at 90+. **This is the same shape Phase 8 uses for players; the original spec simply omitted the step.**
- **The floor is 35, not 0.** A plain 0–100 logistic rates the 7-59 Bobcats a `1`. Star weighting also reordered the top — the '92 Bulls and '13 Thunder rose past balanced-but-starless rosters like the '96 Magic.
- **Only `team_season.ts` changed when the algorithm changed** — verified by hash. Team ratings feed no other table.
- **`RatedPlayerSeason.Position` is typed `string` and nothing in the pipeline normalizes it.** The raw CSVs still contain a bare `F` (Adam Keefe, 1997-98 UTA) that Phase 9 hand-corrected in the *generated* file, so `npm run rate:players` reintroduces it. The generator now hard-fails on any non-enum position — verified by injecting the exact regression.
- **Node runs `.mts` with type stripping, so `import type` is erased** — that's why the generator can import `season_players.ts` (which itself imports `@/types/rating` as a type) without alias resolution. Needs `allowImportingTsExtensions` in `tsconfig.json`, since Node requires the `.ts` extension and tsc rejects it without the flag. The npm script passes `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`; adding `"type": "module"` to `package.json` would have been the other fix, but it risks the Next build.
- **Row types are `Omit<PrismaModel, "createdAt">`**, derived rather than hand-written, so a schema change breaks the generator instead of silently producing unloadable data. `PlayerSeasonTeamRow` also omits `id` (it keeps `@default(cuid())`); `TeamSeason.id` and `PlayerSeason.id` have no default and must always be supplied.
- **Team slugs are Basketball-Reference codes** (`CHI`, `UTA`) — **this diverges from Phase 4's franchise-nickname convention**, where the slug doubles as the logo filename. All 40 codes are separate rows including defunct/relocated franchises (`SEA`, `VAN`, `WSB`, `KCK`, `SDC`, `NJN`, `CHH`, `NOK`), each with its historical name. `CHH` and `CHO` are both "Charlotte Hornets", so `name` is not unique — only `slug` is.
- **All 1,292 team-seasons are included, not just playoff teams.** The schema comment calling `team_seasons` a playoff-only draftable pool does not hold until `playoff_participation.ts` is implemented.
- **Two rosters have no listed `SF`** (2019-20 `LAL`, 2024-25 `MEM`); the empty slot takes the highest-rated uncounted player regardless of position.
- **The test is an independent reimplementation, not a call into the generator** — it recomputes all 1,292 ratings from `PLAYER_SEASONS` + `PLAYER_SEASON_TEAMS`. The weights and constants are deliberately duplicated so a one-sided edit fails loudly.
- **`serializeRow` would emit a literal `undefined`** if a field were ever undefined (`JSON.stringify(undefined)` returns the value, not `"null"`). Impossible today — `RatedPlayerSeason` types every metric as non-null — and the output contains zero `null`/`undefined`. Latent only if those types loosen.
- `src/data/db` is prettier-ignored and written one object per line, matching `season_players.ts`.

Known distortion carried in, not introduced here: because Phase 9 gives each player exactly one position, a roster's third-best player contributes nothing when he shares a slot with someone better — Draymond Green's 86 is discarded from the 2017 Warriors. **This systematically understates positionally-stacked teams and will flow into Phase 15's bracket seeding.**

Verified: `npm test` (77), `tsc --noEmit`, `lint`, `format:check`, `build`, `prisma validate`; both routes still prerender static. Generator output byte-identical across runs. Failure paths driven for real — phantom team-directory entry, row-count drift, and the injected `F` position — each exiting 1 with nothing written.

Not verified: no ingestion has run, so nothing here has been loaded into Postgres or checked against the live schema. No rating hand-checked against Basketball-Reference. `team.ts` names and conferences are hand-authored and unreviewed; a franchise that switched conference under one code is not representable in the single `conference` field (per-season conference belongs to `PlayoffParticipation`).

Still open: Phase 10 part 2 — Neon setup, `prisma migrate deploy`, and the ingestion runner. `playoff_participation.ts` is an empty array. `DATABASE_URL` is still the stock Prisma placeholder and the squashed migration remains unapplied — **the window to rewrite that migration closes the moment it is deployed.**

### Phase 10 (part 1b) — Playoff Participation Data

**Phase 10 stays 🟡** — part 2 (Neon setup + ingestion runner) is still untouched. Filled the last empty table file: `playoff_participation.ts` goes from `[]` to **724 rows** covering all 46 postseasons, 1981–2026. Ships the new raw export `src/data/raw/playoffs/playoff_teams.csv`, `buildPlayoffParticipation()` in `scripts/build-db-data.mts`, the method spec at `context/docs/playoff-participation-derivation.md`, and 9 more Vitest tests (77 → 86). Still no database.

The source is **series-level** (678 rows, one per playoff series, both teams on the same row); the table is **team-level**. The whole job is folding one into the other. 43 seasons × 16 + 1981/82/83 × 12 = 724.

Gotchas:

- **`Finals` rows carry no conference.** The `Series` column reads `Eastern Conf …` / `Western Conf …` everywhere except the Finals, which is bare `Finals`. Both finalists also appear in their own Conference Finals row, so conference always resolves — take it from any non-`Finals` series and ignore Finals rows for that field. The generator fails loudly if a team ever ends up unresolved.
- **`Team.conference` is not a valid fallback, and this table is why.** `NOH` played the **East** in 2003 and 2004 and the West from 2005; `team.ts` lists it `WEST`. Per-season conference genuinely differs from the franchise's single directory value — this is the realignment case Phase 10 part 1 flagged as unrepresentable.
- **1981–1983 were 12-team brackets** — the top two seeds in each conference had a first-round bye, so they have no `FIRST_ROUND` series at all. Taking the *maximum* round depth handles it for free; anything that assumes every team played a first round breaks. `PHO-1981` is the pinned test case: 1 seed, entered at the Semifinals.
- **`CHAMPION` is the only outcome-dependent round value.** Every other round is claimed by appearance alone — losing the Conference Finals still reads `CONFERENCE_FINALS`. Only winning the `Finals` series promotes past `NBA_FINALS`.
- **No second name→slug table.** `teamSlug` reverse-maps `TEAM_DIRECTORY` on `name`, so the two can't drift. Names are unique there with exactly one collision: **`Charlotte Hornets` is both `CHH` and `CHO`**, split on `seasonYear <= 2002`. Playoff appearances are 1993–2002 and 2015–2016, so the boundary is unambiguous. Unknown or ambiguous names are hard failures.
- **`PlayoffParticipation.id` lost its `@default(cuid())`** and is now `{teamSlug}-{seasonYear}`, matching `TeamSeason` and `PlayerSeason`. **The regenerated migration is byte-identical** — third confirmation that `@default(cuid())` is client-side only and never emitted a Postgres `DEFAULT`.
- **The seed is the post-play-in bracket seed**, not a standings rank. From 2021 on, seeds 7 and 8 are decided by the play-in tournament, so a 7 seed didn't necessarily have the 7th-best record. Seed is also fully independent of `TeamSeason.rating` — `PHI-2026` entered 7th and reached the Conference Finals while the 1-seed `DET-2026` went out in the semis.
- **The test re-parses the CSV and folds it independently**, resolving slugs off the generated `team.ts` rather than the generator's private `TEAM_DIRECTORY`, then asserts deep equality. Same pattern as the team-rating test — a one-sided edit fails loudly.
- The CSV has no quoted fields and no trailing newline; blank-line filtering plus a 13-column assertion covers it without a CSV library.

**Scope deliberately not widened:** `team_season.ts` still holds all 1,292 team-seasons, playoff or not. Membership in this table is now the "made the playoffs" signal (there is no `MISSED` round by design), but the join that filters the draft pool belongs to Phase 11's data access layer.

Verified: `npm test` (86), `tsc --noEmit`, `lint`, `format:check`, `build`, `prisma validate`; both routes still prerender static. Generator output byte-identical across runs, and only `playoff_participation.ts` changed among the seven files. Failure paths driven for real — a corrupted franchise name and a deleted Finals series — each exiting 1 with nothing written, the CSV hash-verified restored afterward.

Hand-checked against real NBA history (the first values in this pipeline verified against the actual record rather than reproduced from a doc): '96 Bulls 15-3 CHAMPION, '17 Warriors 16-1, '16 Cavs 16-5, '20 Lakers 16-5, '24 Celtics 16-3, '04 Pistons 16-7, '06 Heat 16-7 — all correct, plus `NOH-2003` = `EAST` and the `CHH`/`CHO` split.

Still open: unchanged — Phase 10 part 2 is Neon setup, `prisma migrate deploy`, and the ingestion runner. `DATABASE_URL` is still the stock placeholder and the squashed migration remains unapplied, so **the window to rewrite it is still open but closes on first deploy.**

### Phase 10 (part 2) — Neon Setup & Ingestion Runner

**Phase 10 complete.** The project has a real database for the first time: `20260816000000_initial_schema` is applied to a live Neon branch and all **69,036 rows** of `src/data/db/` are loaded. Ships `scripts/ingest-db-data.mts` (`npm run db:ingest`), one regenerated `team_season.ts`, and the 🔒 lock section in `CLAUDE.md`. No schema change, no new dependency, no test added.

Gotchas:

- **The migration-rewrite window is now closed.** Everything Phases 9 and 10 squashed is permanent history; every future schema change is a new migration file.
- **No `DIRECT_URL` was needed — the expectation was wrong.** Neon's pooler is PgBouncer in transaction mode, which normally drops migrate's session-level advisory lock, so `prisma.config.ts` was about to be split into pooled-runtime / direct-migrate URLs. `migrate status` and `migrate deploy` both ran clean over the `-pooler` host, so the file is untouched and `DATABASE_URL` is the only connection string. **Revisit only if a future migrate hangs on the lock.**
- **NextAuth models were deliberately skipped** — the spec asks for `Account`/`Session`/`VerificationToken`, but nothing authenticates, accounts are postponed in the MVP scope, and the package isn't installed. Three dead tables in the one unrewritable migration was the cost of guessing wrong.
- **The runner constructs its own `PrismaClient` — the one sanctioned exception to the `@/lib/db` singleton rule.** Node strips types but doesn't resolve the `@/` alias, so a value import of the generated client can't go through the alias. Type-only imports still work (Phase 10 part 1's finding), which is why the seven data files import fine.
- **Idempotency is delete-then-load, not upsert.** Children first, then `createMany` in 1000-row chunks in FK order. Deterministic ids everywhere except `PlayerSeasonTeam`'s cuid mean a rerun reproduces the same table contents; the cuids differ, and nothing references them.
- **`verify()` re-reads `count()` per table and exits 1 on drift** — the runner never reports success on a partial load.
- **The 9 stale team ratings from the previous commit were regenerated here**, by a throwaway script mirroring the generator's algorithm, because `npm run build:db-data` would have reverted the Kuzma/Wells SF fix (it lives only in the generated `player_season.ts`; `season_players.ts` still says PF/SG). **That landmine is still armed by explicit decision — the generator no longer reproduces the committed `team_season.ts`.**
- **`LAL-2020` fell 90 → 85 and `MEM-2025` 75 → 68.** With no SF listed, the empty slot used to grab the best uncounted player; now it takes Kuzma at 55 and Wells at 56. The 2020 champions rate 85. The other seven moved ±1 only because the mean and σ shifted under them.
- **Neon reports 27 MB, against a ~14 MB estimate of table + index data** — the difference is retained WAL history from the ingest burst, not unexpected row size.
- `postinstall` runs `prisma generate` and is read-only, so it stays outside the lock — a fresh clone still needs it.

Verified beyond the usual suite: every row of all seven tables was read back out of Neon and hashed against the source arrays (identically sorted, `createdAt` and the generated cuid excluded) — **all seven match exactly**. Relational integrity: 0 player-seasons missing a `data` row, 0 without a team link, 0 null metrics, and traded players correctly carry 2+ links (Abdelnaby 1993 on both `BOS-1993` and `MIL-1993`). Hand-checked against real NBA history: 1996 CHI 15-3, 2017 GSW 16-1, 2020 LAL 16-5, 2024 BOS 16-3, all 1 seeds; Jordan 1995-96 reads PER 29.4 / WS/48 .317, matching Basketball-Reference. The `@/lib/db` runtime path was driven for real through a throwaway Vitest file (deleted — the standards forbid DB access in tests), returning `CHI-1996` with its team joined and LeBron's 2016 season with both relations.

Also verified: `npm test` (86 — the 85/86 that was red at HEAD is green), `tsc --noEmit`, `lint`, `format:check`, `build` (all four routes still prerender static), `prisma validate`, `migrate status` in sync. `db:ingest` run three times with identical counts.

Not verified: **whether `DATABASE_URL` points at a `development` branch or Neon's default production branch** — the connection string doesn't say, and no second branch was confirmed to exist. The spec's dev/production split is therefore unproven. Nothing has been promoted to a production branch; that is deliberate and manual.

Still open: nothing in `src/` reads from the database — the draft still runs on the Phase 4 fixtures, and the typed query API is Phase 11. The team-rating engine's positional distortion is unchanged and now baked into stored data (top five are `PHI-1983` 95, `UTA-1997` 94, `ORL-1995` 94, `HOU-2018` 93, `OKC-2013` 93 — the '96 Bulls sit at 91), which flows into Phase 15's seeding. Team logo PNGs still don't exist; the slugs are Basketball-Reference codes, not the nicknames the logo convention expects. No touch-drag support.

### Phase 11 — Data Access Layer

**Phase 11 complete.** The first code in `src/` that reads from Neon. Four `GET` route handlers over a typed query API serve the draft board, all returning the existing `DraftTeam` type so Phase 13 can re-point the UI without reshaping it. Ships `src/lib/draft-api.ts`, `src/lib/db/draft.ts`, `src/lib/api-response.ts`, `src/types/api.ts`, two `route.ts` files, and 33 Vitest tests (86 → 119). No schema change, no migration, no new dependency, no database write.

| Endpoint | Triggered by |
| --- | --- |
| `GET /api/draft/team` | `Get Random Team`, `Skip Round` |
| `GET /api/draft/team?mode=another-team&exclude=<id>` | `Another Team` |
| `GET /api/draft/team?mode=another-season&exclude=<id>` | `Another Season` |
| `GET /api/draft/team/[teamSeasonId]` | refresh recovery, deep links, tests |

Gotchas:

- **The draft pool is all 1,292 team-seasons, playoff or not** — a player may be drafted off a team that missed the playoffs. `playoff_participation` is not read at all; it is bracket-only. `project-overview.md` §C said the opposite (a Phase 1 assumption that never got revisited) and was corrected in this phase.
- **`@/lib/db` builds the `PrismaClient` at module scope and throws without `DATABASE_URL`, which vitest never loads.** Anything a test imports must not reach it — that is why parsing and the row → `DraftTeam` mapper live in the pure `src/lib/draft-api.ts` and not alongside the queries, diverging from the spec's file layout. **Any future testable logic in a `src/lib/db/*` module has the same constraint.**
- **The `mode` dispatch and the random offset were lifted out of `route.ts` for the same reason.** `fetchDraftTeam(query, fetchers)` takes injectable fetchers and `drawIndex(total, rng)` takes an injectable `Rng` — the same shape Phase 6 used to keep `Math.random` out of the reducer. `route.ts` now holds no logic at all.
- **A parameter that doesn't apply to the given `mode` is a `400`, not an ignored no-op** — `exclude` on `random`, `excludeSeasons` on the anchored modes. Caught by curl mid-implementation: `?exclude=CHI-1996` was returning a random team while silently dropping the filter, which reads as a working filter to the caller.
- **Random selection is count-then-offset** (`count`, pick a skip, `findMany({ skip, take: 1, orderBy: { id: "asc" } })`), not `ORDER BY random()`. The `orderBy` is load-bearing — without it `skip` addresses an undefined row order. `drawIndex` takes `% total` so an `rng()` of exactly 1 wraps to 0 instead of indexing past the end.
- **Endpoints 2 and 3 resolve the anchor's `teamSlug` from its own row — two round trips — rather than string-splitting `{teamSlug}-{seasonYear}`.** The id format is a convention, and parsing it would couple the API to it.
- **`NO_ELIGIBLE_TEAM` covers two causes on those endpoints** (anchor doesn't resolve / filter matched nothing). Both are 404 by spec; split them if the UI ever needs to tell them apart.
- **The "franchise with no other season" branch is unreachable against real data** — the smallest franchise, `NOK`, has 2 team-seasons. It is covered by unit test only, never by curl.
- **`player_season_data` is not joined and no gameplay query ever joins it** — it is an audit table for recomputing ratings. The draft card reads only `player_seasons.rating`.
- Rosters are ordered `rating DESC` in the query via `orderBy: { playerSeason: { rating: "desc" } }` on the join table, so the board order is the query's job, not the component's.
- Endpoints 1–3 send `Cache-Control: no-store` (they are random by definition); endpoint 4 sends `max-age=31536000` on success only — the data is frozen history, but a 404 must not be cached.

Verified: `npm test` (119), `tsc --noEmit`, `lint`, `format:check`, `build` — both API routes render dynamic, all four pages still prerender static. Driven against live Neon on a real dev server: `CHI-1996` returns Jordan 98 / Pippen 92 / Kukoč 90, rating-sorted; 20 `another-team` draws off `CHI-1996` gave 16 distinct franchises and zero CHI; 20 `another-season` draws gave 18 distinct CHI seasons and never `CHI-1996`; 30 random draws spread 1984–2025; `excludeSeasons` held over 15 draws; `VAN-1997` (14-68, missed the playoffs) is draftable at rating 40, proving the pool is not playoff-filtered. All error paths driven for real: `400` on a missing anchor, an unknown `mode`, a blank anchor, and an inapplicable parameter; `404` on an unknown id and an unresolvable anchor.

Not verified: **no Vitest coverage of the four query functions in `src/lib/db/draft.ts`** — they are Prisma calls end to end (the `select` shape, the nested `orderBy`, the count-then-offset draw, the null paths). Testing them needs either a live database, which `coding-standards.md` forbids, or a Prisma mock that would only assert the mock matches the query. They are covered by the curl suite instead. Nothing renders this data yet — no browser check beyond the API.

Still open: **nothing consumes these endpoints** — `/play/draft` still runs on the Phase 4 fixtures, and `src/lib/draft.ts`'s three fixture selectors stay until Phase 13 removes their last caller. Two things Phase 13 will hit immediately: real slugs are Basketball-Reference codes (`CHI`), not the nicknames the `/logos/<slug>.png` convention expects, so every card falls back to initials; and real rosters run 17–23 players where the fixtures carried 9–11, which the `DraftBoard` list was styled against. Reroll counting, duplicate blocking, and position matching remain client-side and stateless on the server.

### Phase 13 — Draft Mechanics (Real Data)

**Phase 13 complete.** The draft is playable on the real database: `/play/draft` drafts from all 1,292 team-seasons in Neon instead of the 20 Phase 4 fixtures. Ships `src/lib/draft-client.ts` and 14 Vitest tests (119 → 133). No schema change, no migration, no new dependency, no database write — the endpoints already served everything the draft reads.

The reducer, `validateDraft`, `playerAvailability`, and the reroll guards were not touched. Only *where a team comes from* changed, plus the three states a network round trip introduces that an in-memory array never had.

Gotchas:

- **`excludeSeasons` is deliberately unused, reversing the spec's original item 8.** The plan was to track every offered `teamSeasonId` in draft state and exclude them from later draws; the correct call is that a repeat at ~1/1292 per draw is acceptable and not worth the state, the growing query string, or the extra failure mode. **`Skip Round` and `Get Random Team` therefore issue the identical request** — the only difference between them is that one costs a reroll. The endpoint still supports the parameter; nothing client-side sends it.
- **`DraftBoard` gained one prop, `isFetchingTeam`**, against the spec's "no component prop signature changes". Disabled buttons alone read as a dead UI during a ~300ms Neon round trip. Additive — no existing prop changed meaning.
- **The race guard is an `AbortController` in a ref, and the `isFetchingTeam` guard alone is not enough.** Two clicks in the same tick both see the stale `false` and both call `loadTeam`; the second aborts the first. Verified in the browser: two rerolls fired in one tick spend exactly one reroll and land the second request's team.
- **`requestDraftTeam` must resolve on abort, never throw** — `loadTeam` drops a superseded response by checking its own `controller.signal.aborted`, which only works if the promise settles. Pinned by test.
- **A failed fetch must not consume a reroll**, so `dispatch({ type: "REROLL" })` fires only after a team arrives. Verified for real by forcing `window.fetch` to reject: toast fired, board unchanged, counter held at 3/3.
- **`AnimatePresence mode="wait"` delays the pending panel by ~250ms** (the exit animation runs first). A fast draw therefore never flashes a spinner, which reads well but means the loading state is invisible on quick responses — it only appears on slow ones.
- **`rerollRequest` was moved out of `DraftExperience` into `draft-client.ts` during `/feature test`.** It is the three-branch mapping deciding which endpoint each reroll button hits, and components aren't tested — same reason Phase 11 lifted the `mode` dispatch out of `route.ts`. Its `default:` case also became an explicit `case "SKIP_ROUND":`, so a fourth `RerollKind` fails the exhaustiveness check instead of silently falling through to a random draw.
- **Phase 11's "every card falls back to initials" prediction was wrong and is now corrected.** The 40 logo PNGs landed in `0dc03be` named by Basketball-Reference code (`CHI.png`), exactly what `teamLogoPath()` produces from the real `teamSlug`. Zero console errors in the browser.
- **The roster grid needed a `max-h-[26rem]` scroll container** — real rosters run 15–23 players against the fixtures' 9–11, and without it `Start Tournament` is pushed off screen. The per-card motion stagger is capped at index 9; uncapped it took ~0.7s to finish revealing a 23-man roster.
- **`src/data/` fixtures stay.** Only the three `random*` selectors and the now-unused `Rng` type were deleted; the fixtures are still what every reducer test runs against.
- **Position coverage was verified on the real data, not assumed** — folding `player_season_team.ts` into `player_season.ts` positions across all 1,292 team-seasons gives zero incomplete rosters, so no offered team can hand the player an unfillable board. `LAL-2020` and `MEM-2025`, flagged by Phase 10 as having no listed `SF`, were fixed in `c9f18ce`.

Verified: `npm test` (133), `tsc --noEmit`, `lint`, `format:check`, `build` — `/play/draft` still prerenders static, both API routes still dynamic. Browser-driven at 1440×1000 and 390×844 against live Neon with **zero console errors**: full 5/5 lineup drafted off real rosters (Gasol MEM '10, Drexler POR '87, Harper DAL '88, Maggette MIL '10, B. Williams NJN '90); all three reroll buttons drew one pool 3 → 0; `Another Season` held the franchise (LAC '14 → LAC '16) and `Another Team` changed it (ORL '07 → MIL '99); "Pick a PG" filtering correct with `Not a PG` on non-PGs and `Slot filled` on every C once C was taken; roster grid scrolls (831px of content in a 416px box) with no horizontal overflow at either width.

Not verified: **the cross-season duplicate block was never exercised in the browser** — the offered team is server-random and can't be targeted from the UI, so the same player can't be forced onto a second board. It is covered by unit test, and this phase changed neither `validateDraft` nor `playerAvailability`, but it is a real gap against the spec's verification list. Also unverified: no Vitest coverage of the four Prisma query functions in `src/lib/db/draft.ts` (unchanged from Phase 11 — testing them needs a live database, which `coding-standards.md` forbids).

Still open: no touch-drag support (unchanged since Phase 6). `Start Tournament` still routes to the `/play/tournament` placeholder until Phase 18. The team-rating positional distortion is unchanged and still flows into Phase 15's seeding. There is no refresh recovery — a page reload drops the run, and endpoint 4 (`GET /api/draft/team/[teamSeasonId]`) still has no caller; persisting run state is Phase 12.

### Fix — Another Team stays in the same season

**A behaviour correction to Phase 11's endpoint 2, not a bug in Phase 13.** `Another Team` drew a different franchise from *any* season; it must draw a different franchise from the **same season** as the team on the board. The two anchored rerolls are now symmetric — `Another Team` pins the season and varies the franchise, `Another Season` pins the franchise and varies the season. Ships 9 Vitest tests (133 → 142). No client change, no schema change, no migration, no data write.

**The endpoint contract changed, not its signature.** `GET /api/draft/team?mode=another-team&exclude=<id>` takes the same parameters and returns the same shape; only the filter behind it moved. `draftTeamUrl` and `rerollRequest` were already correct and were not touched.

Gotchas:

- **The filters were lifted out of the Prisma call into `anotherTeamFilter` / `anotherSeasonFilter` in `src/lib/draft-api.ts`.** Editing the inline `where` clause would have been a one-line fix, but this is precisely the rule that was misremembered once, and inline it cannot be tested — `src/lib/db/*` can never be imported by a test (Phase 11's `PrismaClient`-at-module-scope constraint). The pure module is the only place a rule like this can be pinned.
- **`teamSlugOf` became `anchorOf`, returning `{ teamSlug, seasonYear }`.** Still one `findUnique`, still no string-splitting of `{teamSlug}-{seasonYear}` — the id format stays a convention rather than an API contract.
- **Shape assertions were not enough.** The first 5 tests asserted what the filter object *looks like*; 4 more were added that apply both filters to a 3-franchise × 2-season pool and assert the ids selected, plus the invariants that neither filter can return the anchor and that the two selections never overlap. These pin behaviour rather than representation.
- **Mutation-checked.** Reverting `anotherTeamFilter` to the old version turns 3 tests red, including the new behaviour test — the suite catches the regression rather than asserting the code back to itself.
- **`Another Team` now draws from ~23–30 rows instead of ~1,270**, so repeats within a run are far more likely than before. With only 3 rerolls this is not a practical problem, but it is a real narrowing of the pool and the reason `excludeSeasons` might eventually earn its place after all.
- **`NO_ELIGIBLE_TEAM` stays unreachable here** — every season has 20+ franchises, so the filter always matches. Unchanged from before.
- **Phase 11 and Phase 13 History entries still describe the old behaviour and were deliberately not rewritten.** They record what was true when written; editing them would erase that the contract ever changed. This entry is the correction.

Verified: `npm test` (142), `tsc --noEmit`, `lint`, `format:check`, `build` — routes unchanged. Against live Neon: 20 draws anchored on `CHI-1996` gave 16 franchises, **every one in 1996**, zero CHI; 15 draws on `LAL-2020` gave 13 franchises, **every one in 2020**, zero LAL; `Another Season` unchanged at 14 distinct CHI seasons, never `CHI-1996`; error paths still `400` on a missing anchor / unknown mode / inapplicable parameter and `404` on an unresolvable anchor. Browser-driven with zero console errors: MEM '20 → **DEN '20** (season held, franchise changed) → **DEN '23** (franchise held, season changed).

Also in this commit: Phase 13 ticked complete in `context/todo.md` (12/27).

### Phase 12 — Squad Confirmation & Run Handoff

**Phase 12 complete.** The draft no longer ends at a dead end. `Start Tournament` opens a confirmation dialog — review the five drafted players, optionally name the squad, pick a conference (required) — and confirming carries the run to `/play/tournament`, which prints it as plain text. Ships `src/lib/run.ts`, `src/components/play/RunProvider.tsx`, `src/app/play/layout.tsx`, `src/components/draft/SquadConfirmDialog.tsx`, the shadcn `dialog` + `input` primitives, and 14 Vitest tests (142 → 156). No schema change, no migration, no new endpoint, no database read.

**This phase is three old todo lines merged into one** — the former Phase 12 (game state), Phase 14 (team review) and Phase 18 (conference select). Bracket generation stayed out; it is the new Phase 14. Everything from the old Phase 19 up was renumbered down by one, so the list now runs 1–25 with no gaps.

Gotchas:

- **The old Phase 12's "duplicate & reroll guards" were already done in Phase 6** and were not touched. Only the *state handoff* half of that line was outstanding.
- **`buildRun` takes `slots` as a second argument**, against the spec's `buildRun(members, name, conference)`. Slot ordering (PG→C) needs the formation, and doing it in the dialog would put untested logic in a component. `orderMembersBySlots` is pure and pinned; members whose position isn't a slot go to the tail rather than being dropped.
- **The handoff is a React context, and `src/app/play/layout.tsx` had to be created for it** — `/play/draft` and `/play/tournament` shared no layout before. The layout stays a server component rendering the client `RunProvider`, so **`/play/draft` and `/play/tournament` both still prerender static** even though the page is now a client component.
- **Context is in-memory, so the run does not survive a reload of `/play/tournament`** — the no-run fallback ("No squad in play" + a link back) is the expected behaviour this phase, not a bug. `sessionStorage` was the alternative and was explicitly rejected by decision.
- **Navigating draft → tournament unmounts `DraftExperience`, so browser Back lands on an empty draft board.** Same root cause: only the confirmed run lives in the provider, the reducer state doesn't. A second, more reachable path to losing a run than the reload case, and it is still open.
- **The dialog's confirm button needed explicit muted styling when disabled.** shadcn's default primary variant renders gold-tinted at reduced opacity, against the mockup's grey — caught in the browser, not in review.
- **Only the roster scrolls, not the dialog.** The first cut let the whole `DialogContent` scroll, which at 1280×600 put `Cancel` and `Start Tournament` below the fold with nothing indicating they existed (703px of content in a 552px box). Now the header, name input, conference row and footer are `shrink-0` and the `<ul>` absorbs the squeeze.
- **The roster's 96px floor is height-gated: `[@media(min-height:40rem)]:min-h-24`.** At a flat `min-h-24` a 320×568 device still clipped the hint text; the floor now only applies where there is room for it, and below that the list shrinks so the controls always win. At 1280×400 the roster collapses to a 4px scroll strip — deliberate, and only reachable on a landscape phone.
- **A test can assert the code back to itself.** The name-cap tests built their expectations from `MAX_SQUAD_NAME_LENGTH`, so moving the constant 40 → 60 left all 13 green. Added one test spelling the literal out; the same mutation now turns it red. Same failure mode the "Another Team" fix hit with its shape assertions.
- **`npx shadcn add dialog` prompts to overwrite `button.tsx`** and aborts the whole add if the prompt isn't answered — answer `n`, then `prettier --write` the generated files as usual.
- `Squad.rating` stays `undefined` — rating a *drafted* squad is a decision for the phase that seeds the bracket.

Verified: `npm test` (156), `tsc --noEmit`, `lint`, `format:check`, `build` — all pages still prerender static, both API routes still dynamic. Browser-driven against live Neon with **zero console errors or warnings**: full 5/5 lineup drafted twice; confirm disabled with no conference picked; Escape and Cancel both dismiss without navigating, leaving the board at 5/5 and the typed name intact on reopen; `"  Dynasty Five  "` arrives trimmed; no name renders `(unnamed)`; EAST and WEST both carry across; reloading `/play/tournament` shows the fallback. Every control checked for clipping at **1440×1000, 1280×600, 1280×500, 1280×400, 390×844, 360×640 and 320×568** — all visible at every size. Mutation-checked: dropping `.trim()` turns 5 red, neutering `orderMembersBySlots` turns 3 red, moving the cap turns 1 red.

Not verified: the `useRun()`-outside-provider throw is unreachable through the UI and has no test — components and providers aren't tested per the standards.

Found but not fixed, pre-existing: **at 320px wide the draft page itself overflows horizontally** (scrollWidth 351 vs 320), identical with the dialog open and closed. The board was styled against ≥390px in Phase 13.

Still open: run state is not persisted (reload or Back loses it); no touch-drag support; `/play/tournament` is text only until the new Phase 14 puts a bracket behind it. The team-rating positional distortion is unchanged and still flows into that seeding.

Also in this commit: the three merged todo lines collapsed into one and phases renumbered in `context/todo.md`, with Phase 12 ticked complete (13/25). The two dialog mockups moved to `context/screenshots/squad/`.
