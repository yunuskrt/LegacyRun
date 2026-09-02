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

### Phase 14 — Bracket Generation

**Phase 14 complete.** `/play/tournament` is no longer a dead end: on arrival it fetches a real playoff bracket built from the 724 committed `playoff_participation` rows and renders it as plain text. Ships `src/types/bracket.ts`, `src/lib/rng.ts`, `src/lib/bracket.ts`, `src/lib/db/bracket.ts`, `src/lib/bracket-client.ts`, `GET /api/tournament/bracket`, and 46 Vitest tests (156 → 202). No schema change, no migration, no new dependency, no database write.

**The defining constraint: `team_seasons.rating` is never read.** Phase 10's engine drops a roster's third-best player when he shares a position slot with someone better, so it ranks `PHI-1983` (95) and `ORL-1995` (94) above the 72-10 `CHI-1996` (91) and puts the 2020 champions at 85 — backwards for a difficulty ladder. Difficulty instead comes from a **pedigree score** (0–100) computed from what a team actually did that postseason: round reached (dominant), seed, series record.

Gotchas:

- **The type is the enforcement.** `BracketOpponent` has no `teamRating` field, so a later phase cannot quietly start sorting on one. A test greps both bracket modules for `prisma.teamSeason` / `rating` / `teamRating`, and mutation-swapping pedigree ordering for rating ordering turns the suite red.
- **Escalation is by construction, not by retry.** Opponents are drawn in four *groups* (1 first-round, 2 semis-pool, 4 far-half, 1 Finals), each with a floor set to the previous group's **highest** pedigree. The spec's original "redraw when a later opponent comes out weaker" is strictly worse — it can spin and can fail non-deterministically for a seed that should have worked. The floor makes the squad's path strictly increasing for *any* far-side winner.
- **`bracketSeed` was renamed `bracketSlot` after printing real brackets** showed a "1 seed" at P54 above a "7 seed" at P76. That is not a draw bug: strength-ordered seeding puts the best opponent in round two, which hard constraint 12 forbids, so the four strongest necessarily occupy far-half positions. They are structural positions, not seeds; the real historical seed stays on `BracketOpponent.seed`. **Phase 17 must not render `bracketSlot` as a seed.**
- **The squad's slot does not change difficulty.** It comes from the mean of the five `player_seasons.rating` values and decides only *where* the squad sits. Every squad's first-round opponent is drawn from the same band. The doc's original claim that stronger squads get easier openers was written before the code and is false.
- **Selection runs in memory, not in SQL** — the deliberate departure from Phase 11. The eligible pool is ≤408 rows, so `src/lib/db/bracket.ts` does one filtered read and nothing else. `src/lib/db/*` can never be imported by a test, so a rule in a `where` clause is a rule nothing can pin.
- **That rule bit once, and `/feature test` caught it.** "The Finals opponent must have actually reached the Finals" lived *only* in the Prisma `where`. The band alone doesn't imply it — a conference finalist can score 82, inside `[80, 100]` — so `generateBracket` on its own could seat a team in the Finals that never played in one. `FINALS_ROUNDS` now lives in the pure module; the query filter is an optimization. Mutation-checked.
- **A fixture pool whose bands don't overlap makes the escalation floor look load-bearing when it isn't.** Removing the floor initially passed every test. Four rows that sit in two bands at once (`EOV1`–`EOV4`) were added; the mutation now fails. Same class of hole as Phase 12's name-cap test asserting the code back to itself.
- **`maxSeed` is per season** — 6 for the 1981–83 12-team brackets, 8 after. Hardcoding 8 under-credits those seasons' top seeds.
- **Determinism is a property of the signature**: `generateBracket(rows, query, runSeed)` builds its own seeded `Rng` (mulberry32 over an FNV-1a hash) rather than taking one, and `runSeed` is echoed in the response even when the client didn't send one. No test stubs `Math.random`.
- **Only the run's own conference gets a bracket.** The Finals opponent is drawn, not played into — a resolved far-conference bracket would routinely produce a survivor weaker than the squad's Conference Finals opponent. Decided, not overlooked: the compensating UI work (an other-conference champion stub, never an empty second bracket) is recorded on the Phase 17 line in `context/todo.md` and specced in `context/docs/bracket-generation.md` §10, where `bracketSlot: null` is the signal that slot sits outside the 8-slot bracket.
- `ApiError` is reused as-is — `NO_ELIGIBLE_TEAM` already means "the pool had nothing", which is exactly an unfillable band. A new member would grow every existing consumer's error map for a case unreachable against real data.
- Bracket state sits beside the run in `RunProvider` and dies with it; `Run` gains no field, so `buildRun` and its tests are untouched.

Verified: `npm test` (202), `tsc --noEmit`, `lint`, `format:check`, `build` — all pages still prerender static, `/api/tournament/bracket` renders dynamic. Against live Neon: both conferences produce fully disjoint fields from the same `runSeed` (EAST → East teams + 2001 Lakers; WEST → West teams + 2011 Heat); same `runSeed` twice is byte-identical; 25 draws with 5 exclusions gave 0 violations, 0 franchise duplicates and 130 distinct team-seasons; all six error paths return 400; `Cache-Control: no-store` present. A second suite runs the generator over the committed 724 rows — 120 seeded brackets across both conferences and the whole squad-rating range — asserting no failures, escalation on every path, franchise uniqueness, the 7+1 conference split, exclusions, and that the Finals opponent always reached the Finals. Browser-driven at 1440×1000 with **zero console errors**: full 5/5 draft → confirm EAST → bracket rendered with a correct ladder (P38 → P55/61 → P64–79 → LAL '87-88 at P100); reload correctly shows the "No squad in play" fallback and fires no stray fetch.

Not verified: **no Vitest coverage of `getPlayoffCandidates`** in `src/lib/db/bracket.ts` — unchanged constraint from Phases 11 and 13, covered by the curl runs instead. The mobile check ran at **520px, not 390** — the browser would not resize below that; the page is plain wrapping text and did not overflow.

Still open: run state is still not persisted (a reload of `/play/tournament` loses the run and its bracket). `BracketMatchup.winner` is always `null` — Phase 15 owns results, and until then the bracket's later rounds read `TBD`. No touch-drag support.

Also in this commit: Phase 14 ticked complete in `context/todo.md` (14/25), with the Phase 17 line amended to carry the single-bracket UI debt.

### Phase 15 — Match Simulation Engine

**Phase 15 complete.** The tournament plays. Every bracket matchup resolves as a real best-of-7, simulated possession by possession from `player_season_data.boxPlusMinus` and computed to a finished event log before anything is presented. Ships `src/types/match.ts`, `src/lib/match.ts`, `src/lib/db/match.ts`, `src/lib/match-client.ts`, `GET /api/tournament/match-data`, and 96 Vitest tests (202 → 298). No schema change, no migration, no new dependency, no database write.

**The defining constraint, unchanged from Phase 14: `team_seasons.rating` is never read** — and this phase proved the §2 argument with numbers rather than asserting it. Minutes-weighted BPM lands on real history with *no calibration at all*: `CHI-1996` **+13.9** (real +13.4), `GSW-2017` **+10.8** (+11.6), `CHI-1992` **+10.1** (+9.9), `LAL-2020` **+6.0** (+6.4), `VAN-1997` **−13.1** (−11.4). The stored rating puts `PHI-1983` (95) and `ORL-1995` (94) above the 72-10 Bulls (91); this formula gives them +6.0 and +7.4 against Chicago's +13.9. Pinned by test.

Gotchas:

- **§7's types could not compile against §8.3, and the doc was corrected rather than worked around.** Sides were specced `"SQUAD" | "OPPONENT"`, but §8.3 requires the far half to play itself out — and both sides of *those* matchups are historical teams. Sides are now `"HOME" | "AWAY"` (the two slots of a `BracketMatchup`, fixed for a series) with `hostSide` naming the per-game venue. `MatchTeam.kind` still dispatches between the §3.1 and §3.2 rating rules. **This is the one shape change from the spec; everything downstream in Phases 16–19 reads `HOME`/`AWAY`.**
- **`BASE_PPP = 1.08` contradicted §9's own calibration target.** 1.08 × 100 possessions × 2 sides is 216 combined points, outside the specced 200–215. Now **1.05**, measured at 210.8. A constant and its acceptance test disagreeing is exactly what the verification list is for.
- **Points-per-made is 2.26, not the doc's 2.24, and is now derived from the outcome table in code.** Writing it down as a literal lets the table and the target drift; deriving it makes them impossible to separate.
- **Margin SD is emergent, not a parameter** — nobody chose how often upsets happen; it falls out of ~200 possession draws. Measured **16.9**, against the real NBA's ~13.5. Independent possessions overstate variance (real games have correlated ones — garbage time, pace adjustment). Inside §9's 13–17 band but at the top of it, so **upsets here run livelier than history's**. Damping it means modelling possession correlation, which is out of scope; the number is documented in §4.4 rather than quietly left.
- **A best-of-7 at an even matchup favours home 52.1%, *below* its 54.8% per-game rate.** Not a bug: the home-court holder hosts games 1, 2, 5 and 7, but short series never reach game 7, so the edge is diluted. Real basketball behaves identically. This was investigated as a suspected seeding correlation first — the RNG was checked across game indices and is clean.
- **`AbortController` is not the race guard here — there is no network in the loop.** The whole run's ratings arrive in one ~18.7 KB fetch (8 opponents), then every game is pure local arithmetic. That is what §6.1 buys Phase 17.
- **The engine refuses rather than improvises.** `teamForSlot` and `playMatchup` return `null` on an unfilled slot, a roster that never arrived, an empty roster, an already-decided matchup, or an unknown id. Simulating a phantom team would be silent and wrong; each refusal is pinned by test.
- **The `minutesPlayed <= 0` half of the BPM guard is an equivalent mutant** — a zero-minute row contributes `bpm × 0` to the numerator and `0` to the denominator, so it cannot move a minutes-weighted mean. Mutation testing surfaced it as a survivor; it is belt-and-braces, not a coverage hole. The **null-BPM half was a genuine gap** (no test paired a null BPM with real minutes, which real data never produces but the nullable column allows) and now has one.
- **Overtime that never resolves throws instead of looping or inventing a tiebreak.** Twelve consecutive tied overtimes is unreachable in practice; a loud bug beats a silent fake result.
- The far half resolves as a fixed point — repeatedly play any matchup with both slots filled and no `SQUAD` side — so it works whichever half the squad is seeded into. **The squad's half varies with `squadSlot`**: slots 1, 4, 5, 8 feed `conf-finals.home`, slots 2, 3, 6, 7 feed `conf-finals.away`. A first cut of the test hardcoded `r1-m1`/`r1-m2` and failed on half the seeds.

**Mutation-checked, and it caught real gaps.** Thirteen mutations, each against a clean copy: removing the redundancy weighting, home court, the BPM sort, the logistic, the ×5 scaling, either half of the null guard, minute-weighted attribution, the duplicate-id refusal, the series stop-at-four, the URL separator, squad-slot leakage into the opponent list, and opponent deduplication. Eleven died on the first run; the two survivors are recorded above.

Verified: `npm test` (298), `tsc --noEmit`, `lint`, `format:check`, `build` — all pages still prerender static, `/api/tournament/match-data` dynamic. Against live Neon: all nine endpoint error paths return the right code (`400` on a squad that isn't five distinct ids, duplicate or missing opponents, more than eight opponents; `404` on an unknown player-season or team-season), `Cache-Control: max-age=31536000` on success only. A second suite drives 40 real brackets from the committed 724 playoff rows through to a champion, asserting every series ends 4-x, the far half resolves to exactly 4 series, and replays are byte-identical.

Browser-driven at 1440×1000 with **zero console errors or warnings**: two full runs, drafted → confirmed → bracket → played. Run 1 lost game 7 at home to a P35 opponent (a real upset); run 2 won Round 1 in seven and lost the semis in seven, with Olajuwon (93) and LeBron (97) topping nearly every game while the 58-rated SF never did. Escalation reads correctly on screen (P35 → P62 → P78 → P91).

**Found but not fixed, pre-existing:** hammering `Get Random Team` can wedge the draft board permanently on "Drawing a team" with no recovery. It is Phase 13's race guard in `src/components/draft/DraftExperience.tsx` — `loadTeam` returns on abort without clearing `isFetchingTeam`, relying on the superseding request to clear it. Nothing under `src/components/draft/` is in this phase's diff. It needs a deliberate click storm to reproduce.

**Open calibration concern, unchanged:** §3.2's logistic saturates at the top — a best-possible squad (+17.3) separates from a 2nd-best (+17.0) by 0.3 and from a 10th-best (+15.1) by 2.2. It matters less than it looks, because random offers put real squads around raw 15–25 where the curve is steepest, but widening the denominator would preserve separation at the top.

Still open: run state is still not persisted (a reload loses the run, its bracket and its results). **The event log is computed but not rendered** — the tournament page prints final scores as plain text; pacing it into a live-feeling replay is Phase 17's obligation, specced in §6.1, and is the whole reason the engine hands over a finished log. No touch-drag support.

### Phase 16 — Tournament Shell & Bracket UI

**Phase 16 complete.** `/play/tournament` is no longer plain text: it is the stage shell every later phase plugs into (`BRACKET | SERIES | RESULT` plus loading/error guards) with the live bracket built inside it. Ships `src/lib/tournament-view.ts`, ten components under `src/components/tournament/`, and 48 Vitest tests (298 → 346). No schema change, no migration, no new dependency, no database write, and nothing in `src/lib/bracket.ts`, `src/lib/match.ts` or any API route was touched.

**The run is completable, and that is the point of the seam.** `Play <round>` calls the existing `playMatchup` and renders a plain `SeriesResultCard`. Phase 17 replaces that card with a paced replay; Phase 18 wraps it in controls. Nothing about the simulation changed.

Gotchas:

- **The far half leaks through the series log, not through the bracket.** `visibleRounds` correctly masked far-half *winners*, but `MatchupCard` read its score straight from `series`, so three matchups printed `4-2` before the player had played a game. Masking a matchup is not enough — anything derived from `SeriesState` has to be looked up **through** the masked matchup. That is now `visibleSeriesFor(matchup, series)`, and it is mutation-checked. **Phase 17 inherits the same hazard**, since its whole job is deriving from a log that already holds the answer.
- **`revealedThrough` is derived, not page state**, against the spec's suggestion. The squad completing a round *is* the reveal trigger, so `revealedThroughFor(bracket)` reads it off the bracket and removes a whole class of desync. `visibleRounds(bracket, revealedThrough)` stays parameterized so the masking is testable independently of the derivation. A test pins that a **far-half result never advances it**.
- **Slot masking needs the feeding round, not the matchup's own round.** A semifinal's slots exist only because round 1 resolved, so a slot is visible when `index - 1 <= revealed`, while a *winner* is visible when `index <= revealed`. First-round slots come from generation and are always visible — which is why A1 shows all four matchups' teams but no scores.
- **`isFinalsOpponentRevealed` guards the stub, and I forgot to call it.** `finalsOpponent(bracket)` returns the drawn champion at all times; the lock lives in the caller. The 1985 Lakers appeared in Round 1 until the page gated it. The type can't prevent this one — both branches are the same `BracketOpponent | null`.
- **Scores must read from the squad's side.** `SeriesState` is home/away, so a squad loss printed `4-2` instead of `2-4`. `squadSeriesScore(matchup, series)` is the only correct source for anything squad-facing; `seriesScoreLabel` stays home/away because it labels bracket *rows*, where home/away is right.
- **"Round 1" takes no article and every other round does**, so `Eliminated in the ${ROUND_LABELS[round]}` reads "in the Round 1". `ROUND_PHRASE` carries the article; `ROUND_LABELS` stays the bare heading. Both are needed — the heading says `Round 1`, the sentence says `Round 1`, and the CTA says `the Conference Semifinals`.
- **Band thresholds are `ELITE ≥ 64`, `LEGENDARY ≥ 84`**, chosen here and pinned. Checked against the generator's draw bands rather than the mockups: R1 `[30,56]` is always CONTENDER, semis `[50,72]` spans two bands, conference finals `[64,88]` spans ELITE/LEGENDARY, finals `[80,100]` is mostly LEGENDARY. The mockups' own assignments are inconsistent (a 78 reads CONTENDER while an 80 reads ELITE) and were not followed.
- **`bracketSlot` is kept off screen by a grep test** over all six bracket components, alongside one for `teamRating`. The invariant is structural — `BracketOpponent` has no rating field — but the grep catches a component reaching for the layout position as if it were a seed.
- **The ladder is a 4-column grid with `justify-around` columns, not absolute positioning.** Connectors are a per-column `::before` tick rather than SVG. Cheaper than the spec's SVG connectors and it cannot misalign, since nothing is positioned against anything else's measured height.
- **`truncate` was wrong for team names.** At 1024 the four columns cut "2023 Miam…" and "YOUR SQU…". Names now `break-words` and wrap to two lines; card heights vary slightly and nothing else moves.
- **The squad's own row must strike through when the squad loses.** `TeamSlotRow` ignored `eliminated` on the `SQUAD` branch, so a lost series showed the opponent's `4-2` with the squad un-struck, which reads ambiguous. Found at 768, not at 1440.
- **`POSITION_SOFT_BG` had to be a fifth literal record.** `${POSITION_BG[pos]}/20` builds `bg-pos-pg/20` at runtime and Tailwind never sees it — the same rule Phase 5 recorded. A sixth position now means editing five records.
- **`TeamLogoBadge` gained a `size` prop** rather than being moved to `src/components/shared/`; it is imported from `src/components/draft/` as the spec allows. The bracket needs a 36px crest against the draft's 56px.
- **Playwright's `browser_resize` scales requests by 4/3 on this machine.** A requested 1440 is really 1920, and requests below ~293 clamp. Phase 14 recorded "the browser would not resize below 520" — that was this, not a floor. Requesting `width × 0.75` gives the real CSS width, which made a true 390 check possible for the first time in the project.
- **A champion run is rarer than the verification list assumes.** Eight real runs — squads carrying Bird 95, Robinson 96, Pippen 94, Sabonis 93 — never reached the NBA Finals, and three went out in Round 1. A4 and the champion screen were verified through a **temporary `?dev=champion` shortcut that forced squad wins, then deleted before commit** (`grep` for `dev=champion`, `DEV SHORTCUT`, `devWin` returns nothing). This is a Phase 15 calibration signal, not a Phase 16 defect — it matches the §3.2 saturation concern already recorded — but it means **Phase 18 cannot plan to reach the later rounds by playing**.
- The `RESULT` stage is deliberately plain — an outcome line, `Review bracket`, and a link to the draft. Phase 19 owns the real recap, and `runOutcome` is exported here for it to build on.

**Six defects, all found by driving the UI rather than reading it:** the score leak, the champion revealed in Round 1, home-first series scores, "in the Round 1", the un-struck squad row, and a `See how the run ended` CTA after *winning* the Finals (now `See the result`).

**Mutation-checked, four guards, each dying on the first run:** `visibleSeriesFor` ignoring the winner, `revealedThroughFor` counting any resolved matchup (kills 4 tests), `seriesScoreLabel` ignoring the winner, and `runOutcome` accepting an undecided series.

Verified: `npm test` (346), `tsc --noEmit`, `lint`, `format:check`, `build` — `/play/tournament` still prerenders static, both API routes still dynamic. Browser-driven against live Neon with **zero console errors or warnings**, at true CSS widths of **390, 768, 1024, 1280 and 1440 with no horizontal overflow at any**: A1 with the stub locked at `3 ROUNDS AWAY` and no far-half scores; the reveal advancing exactly one round at a time; the stub unlocking at the Conference Finals; A4's banner, trophy heading and ringed Finals card; `Series won` / `Series lost` cards; both `NBA Champions` and `Run ended`; `Review bracket` round-tripping; reload showing D2; the mobile spine with its squad-rail sheet and `Show full bracket`. Runs played both named and unnamed — `Dynasty Five` appears nowhere in `src/` outside tests.

Not verified: the components themselves have no tests, per `coding-standards.md` — the grep tests are the only thing asserting anything about their source. The 1024 four-column layout is legible but tight; it was checked at one bracket state, not all four. `SQUAD_SHORT_CODE`, `CONFERENCE_NAME`, `ROUND_ORDER` and `roundIndexOf` have no direct tests by decision — they are constant lookups whose tests would assert the code back to itself, and `roundIndexOf` is covered thoroughly through `visibleRounds`.

**Found but not fixed:** two buttons sit under the 44px touch target at 390 (36px and 41px) — the squad-rail toggle and `Show full bracket`, both full-width rows. Phase 18 owns the 44px rule for the control bar and should sweep these with it. Phase 13's draft-board race guard still wedges the board under fast scripted clicking, reproduced twice here and unchanged since Phase 15 recorded it.

Still open: run state is not persisted, so a reload loses the run, its bracket and its results — D2 is the reload behaviour everywhere, and **Phase 19 owns the decision**. `bracketSlot` remains unrendered by design. No touch-drag support.

Also in this commit: Phase 16 ticked complete in `context/todo.md` (16/24).

### Phase 17 — Match Replay & Live Scoreboard

**Phase 17 complete.** Phase 16's `SeriesResultCard` seam is now a real replay: the finished `GameResult` log paced onto a game clock and presented as a live scoreboard — series banner, tweened score, line score, momentum strip, scoring leaders, play-by-play, quarter breaks, overtime, final. Ships `src/lib/replay.ts`, `src/hooks/useReplay.ts`, eleven components under `src/components/tournament/`, `seriesSides` in `src/lib/tournament-view.ts`, and 53 Vitest tests (346 → 399). No schema change, no migration, no new dependency, no database write, and — as the spec required — **`src/lib/match.ts`, `src/types/match.ts` and every route are untouched**, verified by `git diff --name-only`.

**Phase 15 computed the log precisely so this phase could pace it, and that is what makes the replay cheap:** there is no network and no arithmetic in the loop, so `AbortController` — the race guard of Phases 13 and 16 — has nothing to guard here.

Gotchas:

- **The spoiler invariant is enforced by a test that truncates the log.** Asserting "the score is below the final" is nearly vacuous, because scores are monotonic and a team that stops scoring legitimately reaches its final total early. The real assertion is that `replayFrame(game, cursor)` deep-equals `replayFrame({ events: events.slice(0, cursor + 1) }, cursor)` at **every** cursor of three real games: if deleting the rest of the log changes nothing, nothing in the frame came from it. Mutation-checked — reading `game.homeScore` kills it.
- **Line-score columns come from the periods actually reached, never `periodScores.length`.** That field announces an overtime before it is played. The `T` column is the running total, which also fixes the mockup's own defect (it prints 78/74 against a scoreboard of 78/71).
- **`replayStatus` has an ordering that the first cut got right only by luck: `FINAL` must outrank `paused`.** If a pause could win, the last quarter break of a game would hold the board forever. It became a named rule with a test only during `/feature test`; the inline ternary it replaced was never exercised at that boundary.
- **`useReplay`'s scheduling was lifted into the pure module during `/feature test`** as `replayStatus` and `nextTick`. A hook is as untestable as `src/lib/db/*` under `coding-standards.md`, so the rules could not be pinned where they sat — the same move Phase 11 made with the `mode` dispatch and Phase 13 with `rerollRequest`. The hook is now a timer and a cursor with no rules in it, and a drive test walks `nextTick` end to end, asserting it lands on the final event and pauses exactly `periodScores.length - 1` times.
- **`setState` in an effect body fails lint** (`react-hooks/set-state-in-effect`). `FINAL` is now derived rather than set, and the reset on game change happens **during render** via the sanctioned prev-props pattern — not in an effect.
- **The specced ~25s is the *event* budget, not the wall clock.** Measured 25.5s mean at Normal over 12 real games (93.1 events/game, matching the spec's ~93), but three quarter breaks add ~4.5s, so a regulation game runs **~30s on screen**. An overtime game with four breaks measured 37.5s.
- **§5's 9s Fast target is unreachable as specced.** The 120ms floor puts a hard ~11.2s minimum on a 93-event game at any speed; Fast measures 12.2s. Lowering the floor is a Phase 18 decision, not something to change underneath it.
- **A best-of-7 is walked one game at a time, and the existing `SeriesResultCard` is kept as the hand-off** once every game has been watched. B6/B7 are Phase 18, so the series card is not a leak by then — the player has seen every result it lists.
- **Series dots must update at B5 and not before**, and the winner at the buzzer is read off `frame.homeScore > frame.awayScore`, not `game.winner`. Verified in the browser: `0-1` before game 2, held all through it, `0-2` only at the final.
- **The control bar ships rendered-disabled**, which the spec explicitly permits, so the space it occupies is real at every width and Phase 18 only has to wire it.
- **Two mockup defects corrected, as the spec directed**: the live-game screen has no series banner (built one, with venue from `hostSide`), and its `T` column disagreed with its own scoreboard.
- `momentumSeries` prepends `{ x: 0, margin: 0 }` so the chart opens at the tip rather than at the first basket, and `isLeadChange` fires only on a genuine flip — going ahead from a tie is not a lead change, because a tie has no leader to take the lead from.

**Three defects found by driving the UI, two of them only by measuring it:**

- **The momentum line was clipped at the viewBox edge** — the widest margin landed exactly on the boundary and lost half its stroke. Amplitude now leaves a 2-unit margin.
- **1024 broke badly.** The `lg:` three-column grid left the centre column ~296px, so the scoreboard numerals collided (`115FINAL`, with `124` overlapping) and the line score clipped its `T`. Three columns now start at `xl:`; `lg:` gets two with the scoreboard stack spanning both.
- **390 overflowed horizontally** (scrollWidth 464 against a 391 viewport). The grid had no base `grid-cols-*`, so its implicit column sized to max-content and the line score's `min-w-md` dragged every sibling past the viewport. **A full-page screenshot hides this** — it captures the overflow rather than revealing it, which is why an earlier visual check read as clean. `grid-cols-1` is load-bearing and commented as such.

**Eleven mutations, all dead on the first run**, `replay.ts` byte-identical afterwards: `replayFrame` reading the finished score, the line score ignoring the cursor, `seriesWinsThrough` counting every game, `isLeadChange` firing from a tie, the delay clamp removed, `periodBoundaries` including the final period, a pause outranking `FINAL`, the period pause never flagged, scheduling past the last event, `RESUME` ignoring speed, and `periodSummary` counting only the home side.

Verified: `npm test` (399), `tsc --noEmit`, `lint`, `format:check`, `build` — `/play/tournament` still prerenders static, both API routes still dynamic. Browser-driven against live Neon with **zero console errors or warnings**, at true CSS widths of **390, 768, 1024, 1280 and 1440 with no horizontal overflow and no scoreboard collision at any**. Two full runs: one **unnamed** (`YOUR SQUAD` in the banner, scoreboard and leaders heading; `YOU` as the crest and line-score code) and one **named** (`IRONSIDE UNION` verbatim). Sampling every 100ms across a whole game, **future periods never once showed a value**. Overtime came up unforced twice — `OT` and `2OT` columns, a `0:27 2OT` feed row, `T` matching the scoreboard. B3 confirmed through the DOM: `END OF 1ST QUARTER`, the quarter score, period leaders across both sides, a 0.7-alpha overlay with a 2px blur, and the scoreboard reframed to `END Q1`.

Not verified: **B3's visual composition was never photographed** — the 1.5s break is shorter than the screenshot round-trip, and freezing the timer to catch it was declined, so the card is confirmed by DOM only. `useReplay`'s React wiring (timer cleanup, the render-phase reset) has no test, by decision — hooks sit outside `coding-standards.md`'s testing scope, and everything worth pinning now lives in `nextTick`/`replayStatus`. `advance` has no caller and no test; the spec exposes it without giving it a purpose, and `jumpToEnd` is explicitly caller-less until Phase 18.

**Found but not fixed, pre-existing:** Phase 13's draft-board race guard wedged the board on "Drawing a team" twice more under scripted clicking, unchanged since Phase 15 first recorded it and still outside any phase's diff. The scripted driver now waits it out rather than working around it.

Still open: run state is still not persisted — a reload loses the run, its bracket and its results, and **Phase 19 owns that decision**. **Phase 18 cannot plan to reach the later rounds by playing** (Phase 16's finding, unchanged): both runs this phase went out in Round 1, so its series won/lost cards need their own route to a conclusion. No touch-drag support.

Also in this commit: Phase 17 ticked complete in `context/todo.md` (17/24).

### Phase 18 — Modes, Speeds & Series Flow

**Phase 18 complete.** Phase 16's instant-resolve seam is gone: a series is now watched, never printed. Phase 17's replay gained its controls (Slow/Normal/Fast, Manual/Automatic, a per-game `Skip to final`) and the series became a unit — face-off, seven games chained by mode, won/lost card. Ships `src/lib/series-flow.ts`, `src/hooks/useAutoAdvance.ts`, `src/components/tournament/SeriesFaceOff.tsx`, and 31 Vitest tests (399 → 430). No schema change, no migration, no new dependency, no database read or write — the whole phase is state and presentation over a log Phase 15 had already computed.

**Both hard constraints are structural here, not remembered.** Nothing gates on speed or mode, because there is nothing to gate: the log exists before the first frame, so 10 (speed changes pacing only) and 11 (modes switchable at any time) cost nothing to honour. `AbortController` — the race guard of Phases 13 and 16 — again has nothing to guard.

Gotchas:

- **The Fast budget is set by the delay floor, not the speed factor, and §5's 9s target was unreachable because of it.** At `FAST = 2.5` an average ~32s scoring gap comes out at 80ms, under the clamp, so essentially every Fast event is floored and the factor is irrelevant. Measured over 20 real games: floor 120ms → 12.0s, 100ms → 10.3s, 80ms → 9.2s (Normal moves 25.3 → 24.5 across that whole range). 9s needs an 80ms floor, which is 12.5 events/sec — the blur the doc's own "must read as a game" forbids. **`MIN_EVENT_DELAY_MS` is now 100**, the perceptual boundary where successive changes still read as discrete events. A test pins that >80% of Fast events sit on the floor, so the next person to tune the factor finds out it does nothing.
- **The ~25s figure is the event budget, not wall clock** — `gameBudgetMs` is the run of play only, and three quarter breaks put a regulation game near 30s on screen. Phase 17 recorded this; the tests now say which they mean.
- **`Skip to final` suppresses Automatic's chaining, and that is a decision, not a fallout.** The spec's verification says skip "must not chain into the next game", which contradicts what Automatic otherwise does. Skipping is treated as an explicit intervention that ends *this* game and stops, in both modes. Verified: skipped in Automatic, still on the same game at FINAL six seconds later.
- **`useCallback` was not available where it was needed.** The page's `continueFromSeries` sits after its early returns, so memoizing it would break the rules of hooks. `useAutoAdvance` holds the callback in a ref and schedules on the delay alone instead — an unmemoized callback would otherwise restart the hold every render and the beat would never elapse. **Any future caller can pass an inline arrow safely; that is the point of the ref.**
- **`/feature test` found three rules with no home.** The skip suppression lived in `GameReplay`, the series' stage in `SeriesReplay`, and "only AUTO schedules" in the hook — none reachable by a test under `coding-standards.md`. They became `gameAdvance`, `seriesStageOf` and `advanceDelayMs`. Same move as Phase 17's `nextTick`/`replayStatus`, Phase 13's `rerollRequest`, Phase 11's `mode` dispatch.
- **`seriesStageOf` fixed a latent spoiler, not just a testability gap.** The old code computed `stageAdvance(seriesEndStage(matchup, series), mode)` every render and discarded it with a `game ? NONE :` guard — deriving the result while games were still unwatched, with only position keeping it off screen. The stage now makes the end unreachable until no game is left. Phase 16's hazard in miniature.
- **The face-off plays once per series because the component's lifetime says so** — `SeriesReplay` mounts when a series starts and unmounts when it hands back to the bracket, so game 1 is the only game that ever sees `tipped === false`. No "seen" flag, nothing to reset.
- **`SQUAD_SHORT_CODE` beats the mockup's crest.** B1 and B6/B7 print `DYN` for "Dynasty Five"; the code stays `YOU`, because Phase 16 established that a crest cannot derive from an optional name. The sub-label is where the fallback shows: named reads `YOUR SQUAD · AVG 74`, unnamed reads `AVG 80` with the tag dropped so the crest never says `YOUR SQUAD` twice.
- **A best-of-7 at even strength favours home 52.1%** (Phase 15) — unchanged, but now visible: series routinely run to six and seven games, so the game-to-game beat is exercised far more than the series-to-series one.
- The control bar is `fixed` below `md` and `static` above it in one element rather than two, so nothing can drift between the desktop and mobile versions.

**Ten mutations, nine dead on the first run; both files byte-identical after.** Killed: `SERIES_LOST` auto-advancing, `squadGameLines` reading home, `faceOffSubLabel` always tagging, `seriesEndStage` comparing to `"HOME"`, the floor back at 120ms, `gameAdvance` ignoring `skipped`, `seriesStageOf` inverting its game guard and dropping its face-off guard, `advanceDelayMs` scheduling `CLICK`. **The survivor was `isSeriesEnd` dropping `SERIES_LOST`** — equivalent today only by luck, since a loss resolves to `CLICK` and both `CLICK` and `NONE` schedule nothing, so the wrong answer produces the right timer. That coincidence dies the moment anything makes a loss auto-advance. Closed with a direct test; the mutant now fails.

Verified: `npm test` (430), `tsc --noEmit`, `lint`, `format:check`, `build` — both pages still prerender static, both API routes still dynamic. Browser-driven against live Neon with **zero console errors or warnings**, at 1440×1000 and a true 390×844. Mode and speed switched mid-game with clock and score strictly monotonic across both switches — no restart, no desync, cursor never moved. A full best-of-7 chained games 3→6 in Automatic on **one click** and auto-continued to the bracket; a second auto-chained series ended `SERIES LOST 3-4` and **held the card nine seconds later**, confirming the one asymmetry in the table. Face-off present at series start, gone by 2.2s, absent for game 2. At 390: bar pinned full-width at the viewport bottom, all six controls exactly 44px, no horizontal overflow. Both name paths driven — `IRONSIDE UNION` verbatim, and `YOUR SQUAD` with no duplicated sub-label; `Dynasty` appears in `src/` only inside test fixtures.

**One defect found by measuring rather than looking:** at 390 the `pb-28` reserve cleared the pinned bar by 3px, and only because the page's own 32px bottom padding made up the difference — a slightly taller bar would have covered the CTA. Now `pb-36`, re-measured at 35px.

Not verified: **the post-Finals hand-off was never exercised** — `CONTINUE TO THE NBA FINALS` and the route to the champion screen are implemented but unreached, since all three runs this phase went out in Round 1 or the Semifinals. Third phase running; **Phase 19 must plan for a forced route rather than playing to it** (Phase 16 used a temporary `?dev=champion` shortcut, deleted before commit). Also: **the face-off is DOM-verified, never photographed** — its fixed 2s beat is shorter than the screenshot round-trip, the same limitation Phase 17 hit with the quarter-break card, which *was* captured this time. The eleven components have no tests and `useAutoAdvance`'s React wiring has none, both per `coding-standards.md`; after the extraction there is nothing left in either that a test would not be asserting back to itself.

**A measurement caveat worth carrying:** `BEST OF SEVEN` is not unique to the face-off — Phase 16 uses the same label on the bracket's NEXT UP card. The face-off checks hold because the bracket is unmounted during the SERIES stage, but a probe on that string alone proves nothing.

Still open: **run state is not persisted** — a reload loses the run, its bracket and its results, unchanged since Phase 12 and now Phase 19's to settle. Phase 13's draft-board race guard still wedges the board on "Drawing a team" under scripted clicking; the driver waits it out. No touch-drag support.

Also in this commit: Phase 18 ticked complete in `context/todo.md` (18/24).

### Phase 19 — Results & Run Summary

**Phase 19 complete.** The run has an ending: `/play/tournament` now runs bracket → series → result with no dead ends, closing the four-phase tournament UI arc. Ships `src/lib/run-summary.ts`, four components under `src/components/tournament/`, a `readOnly` prop on `BracketLadder`/`BracketSpine`, `resetRun` on `RunProvider`, and 27 Vitest tests (430 → 457). No schema change, no migration, no new dependency, no database read or write — every figure is derived from the `SeriesState[]` Phase 15 already computed.

**Run persistence is settled, and the answer is no.** A reload still loses the run, its bracket and its results; D2 (`No squad in play`) remains the reload behaviour everywhere, the result screen included. Phase 12's rejection of `sessionStorage` stands rather than being reversed — the alternative buys re-opening an ending at the cost of a real failure mode (a bracket serialized by an older build rehydrating into new code) against hard constraint 13. **The question open since Phase 12 is now closed, not deferred.**

Gotchas:

- **`runOutcome` was deliberately not reimplemented.** The spec lists it as a `run-summary.ts` function returning `opponent` and `seriesScore` on the eliminated branch, but Phase 16 already exports one and the page routes stages off it; widening its return type breaks that test's `toEqual`. Those two fields are exactly the last `runPath` row's, already computed, so `eliminationRow(path)` supplies them. **One traversal, one source of the CHAMPION/ELIMINATED decision.**
- **`signatureGame`'s ordering rule is stated in the module and pinned by test:** later round → game 7 → larger margin → later game, over the squad's **wins only** (the line reads "over the …", which a defeat cannot be phrased as; a run that never won has no signature). Both mockups reproduce under it. It got a genuine test in the browser — a run whose Round 1 held both a **game-7 win (+8)** and a **+11 blowout** correctly showed the Semifinals' only win at **margin +1**, which is the case that separates this ordering from "biggest margin".
- **The margin-first alternative was rejected on the spec's own wording** ("preferring the latest round"). Putting game 7 above round would also reproduce both mockups, so the mockups alone could not decide it.
- **`RunPathRow` is the module's unit, not the bracket.** `runPath` traverses once via Phase 16's `squadPath`; `playoffRecord`, `runScoringLeader`, `signatureGame` and `eliminationRow` all take rows. That is what makes them testable against hand-built fixtures with no bracket at all — and the fixtures deliberately put the squad on `AWAY`, which catches anything reading `HOME`.
- **Two rules were extracted out of `RunResultScreen` during `/feature test`.** `eliminationHeadline` carries the article (Phase 16's `ROUND_PHRASE`, not the bare label) and `defeatSubtitle` reads **opponent-first** — deliberately the inverse of `squadSeriesScore`'s squad-first ordering used everywhere else on the screen. Neither could be pinned while it sat in a component. Same move as Phase 18's `gameAdvance`/`seriesStageOf`, Phase 17's `nextTick`, Phase 13's `rerollRequest`, Phase 11's `mode` dispatch.
- **`signatureLine` builds the whole sentence in the module** so a matchup with no resolved opponent drops the clause instead of rendering "over the the field".
- **The archive is unmasked on purpose.** C3 passes `bracket.rounds` rather than `visibleRounds(...)`, and reveals `finalsOpponent(bracket)` unconditionally — after the run ends, "3 ROUNDS AWAY" on the champion stub would be wrong. `readOnly` also forces `matchupCardState` to never be `NEXT` and opens `BracketSpine` expanded; `nextSquadMatchup` already returns null on a finished run, so the prop is explicitness, not mechanism.
- **The squad rail is hidden on the RESULT stage only** — the recap lists the five itself, and the rail would print them twice.
- **`resetRun` clears run, bracket, matchData and series but not speed or mode** — those are preferences about how the player watches, not part of any one run.
- **The champion path is still unreachable by playing**, fourth phase running. C1 was reached through a temporary `?dev=champion` shortcut that reseeded `playMatchup` until the squad won — so the games, logs and every recap figure stayed real — **deleted before commit** (`grep` for `dev=champion`, `DEV SHORTCUT`, `devWin` returns nothing). Phase 16 used the same device.
- **Playwright's `browser_resize` still scales by 4/3 on this machine** (request `width × 0.75`), unchanged since Phase 16.

**One defect found by driving, and it was a repeat.** The elimination overline read **"ELIMINATED IN THE ROUND 1"** — precisely the article bug Phase 16 solved with `ROUND_PHRASE`, in a phase that had `ROUND_PHRASE` imported two files away. Fixed, then extracted and pinned across all four rounds during `/feature test`.

**Ten mutations, `run-summary.ts` byte-identical after each.** Killed: signature ordering by margin before round, signature accepting defeats, the leader's opposing-side guard, `runPath` reading `homeWins`, `runPath` including undecided series, the signature tie-break inverted, `eliminationRow` returning the last row regardless of outcome, points-per-game undivided, the headline rebuilt from the bare label with a hardcoded article, and the subtitle flipped to squad-first. **One survived first time:** dropping the leader's side guard passed all 23 tests, because the fixture gave the opponent exactly 60 against Jordan's 60 and the tie resolved back by insertion order. The fixture was raised to 70; the mutant now dies. Same class of hole as Phase 12's name-cap test and Phase 14's non-overlapping bands.

Verified: `npm test` (457), `tsc --noEmit`, `lint`, `format:check`, `build` — both pages still prerender static, both API routes still dynamic. Browser-driven against live Neon with **zero console errors or warnings**, no horizontal overflow at true CSS widths of **391, 768, 1024, 1280 and 1440**, both CTAs 44px and full-width on mobile with the primary on top.

Two full runs, **both unnamed**, so `YOUR SQUAD` was checked as the ~40px hero on C1 and C2: a **champion** reading `16-9` against a path of 4-3 / 4-3 / 4-2 / 4-1, and an **elimination** reading `5-7` against game logs captured off the series cards. A third, earlier run went out in Round 1 and correctly showed a one-row path with `1-4`. C3 round-trips with no `NEXT UP` ring, no play CTA, the far half resolved and the Western champion revealed — and **its four squad rows independently matched the recap path**, which is a cross-check of `runPath` against a different rendering of the same data. `Start a new run` landed on an empty board, and the next run drew a fresh WEST bracket instead of the previous EAST one — that, not the empty board, is what proves `resetRun` cleared the context. `Dynasty` appears in `src/` only inside test fixtures.

Not verified, all recorded before ticking the phase: **C1 was photographed at 1440 but never at 390** (C2 was, and they share components); **the result screen was not re-driven after `/feature test` extracted the two copy rules**, though both are now pinned by test and the wiring typechecks; **reload-shows-`No squad in play` was not re-checked here**, unchanged since Phase 12; and the **Round-1 headline after the fix** rests on its test rather than a browser sighting. The four components have no tests and `resetRun` has none, both per `coding-standards.md` — after the extraction there is nothing left in them a test would not be asserting back to itself.

Still open: **the champion path cannot be reached by playing** — four phases of evidence now, and Phase 15's §3.2 saturation concern is the standing explanation. No touch-drag support. `bracketSlot` remains unrendered by design.

Also in this commit: Phase 19 ticked complete in `context/todo.md` (19/24), and the `next dev` agent-rules block in `CLAUDE.md` committed with the work to keep the tree clean.

### Phase 20 (part 1) — Motion Foundation, Reduced Motion & Route Transition

**Phase 20 stays 🟡** — this is the first of five slices and it ships **no new animation on any feature screen**. It ships the vocabulary the other four are written against: one duration/easing set, one reduced-motion policy, and the draft ↔ tournament route transition. Ships `src/lib/motion.ts`, `src/components/motion/MotionProvider.tsx`, `src/components/play/RouteTransition.tsx`, the `--duration-*`/`--ease-*` tokens and a global `prefers-reduced-motion` block in `globals.css`, and 19 Vitest tests (457 → 476). No schema change, no migration, **no new dependency** (`motion` v13 was already installed), no database read or write.

**The sweep is the real work.** Eight components carried hand-picked values; a grep for `duration:|ease:|stiffness|damping|easeOut|easeIn` across `src/components/` and `src/app/` now returns only the module's own exports in `TweenNumber`. The five tournament conversions are 15 `+/-` lines in total, every one a transition swap — nothing else moved.

Gotchas:

- **`GameReplay` needed no conversion.** It is on the spec's sweep list but imports `AnimatePresence` alone and carries no values, so seven components changed, not eight.
- **The pacing constants were never in reach.** `SeriesFaceOff`'s 2s beat and `PeriodBreakCard`'s 1.5s break already live in `src/lib/series-flow.ts` (`FACE_OFF_MS`) and `src/lib/replay.ts` (`BASE_PERIOD_BREAK_MS`). Those files and `src/hooks/` are absent from the diff, so Phase 17/18's pacing is untouched **by construction rather than by inspection** — which is also what keeps hard constraint 10 honest.
- **`EASE` is written out as beziers, not as `"easeOut"`/`"easeIn"`.** The named strings would have been simpler, but the CSS half cannot use them — `[0, 0, 0.58, 1]` and `[0.42, 0, 1, 1]` are exactly motion's built-ins, so the sweep changed no curve while making `cubic-bezier()` mirrors possible. `EASE` is typed `Record<..., Bezier>` rather than `as const`, because a readonly tuple is not assignable to motion's `ease`.
- **Two swept values moved and both are within "unchanged in effect":** `TournamentStage` 0.22 → `DURATION.base` (0.24) and `SeriesFaceOff` 0.35 → 0.24. The face-off sits inside a beat that holds for a fixed 2s regardless, so its shorter entrance changes nothing about when the game starts.
- **`transitionFor`'s `reduced` parameter has real callers, and it has to.** `MotionConfig reducedMotion="user"` disables transform and layout but **does not stop delays**, so a staggered list would still reveal itself one card at a time. `DraftBoard` and `DraftCourt` read `useReducedMotion()` and pass it through; `staggerDelay`/`staggeredTransition` return 0 for both delay and duration.
- **Reduced motion is therefore honoured at two depths, deliberately.** A component passes `reduced` when it has a *delay* to zero. The four unstaggered components (`TournamentStage`, `PlayByPlayFeed`, `PeriodBreakCard`, `SeriesFaceOff`) do not, so they still cross-fade opacity under reduced motion — which matches `MotionConfig`'s own policy of leaving opacity alone. **Parts 02–05 should follow the same rule rather than passing `reduced` everywhere.**
- **`staggeredTransition` came out of `/feature test`**, the extraction pattern used since Phase 11's `mode` dispatch. Two call sites with different steps were merging transition-plus-delay inline.
- **A mutation proved my own comment wrong.** I wrote that the delay must be spread last "or it is silently dropped"; inverting the order survived. It is a genuine equivalent mutant — no `TransitionKind` carries a `delay` key, so the order cannot clobber anything today. The comment now says what is true: the order is a convention that starts mattering only if a kind gains its own delay. Same class as Phase 15's `minutesPlayed <= 0` survivor.
- **The two-sources-of-truth risk is closed by a test, not by a comment.** The spec proposed cross-referencing comments as the mitigation; a comment does not fail a build. `motion.test.ts` reads `globals.css`, parses `--duration-*`/`--ease-*`, and asserts every value against `DURATION`/`EASE` plus the presence of the reduced-motion block. Precedent is Phase 16's grep tests over component sources. **Editing either half alone now turns the suite red** — verified in both directions.
- **The reduced-motion block is top-level and unlayered**, which is what lets `!important` beat Tailwind's layered utilities and shadcn's `data-closed:animate-out`.
- **The route transition is enter-only by decision, not by omission.** The App Router unmounts the outgoing page before the incoming one renders, so a real exit needs the page tree keyed under `AnimatePresence` in a client layout and could strand a run mid-navigation. The `key={usePathname()}` on a `motion.div` is the whole mechanism — a key change remounts it and replays `initial`.
- **The dialog/route coordination is implemented, not merely recorded.** `handleConfirmSquad` sets `isHandingOff`, which **unmounts** `SquadConfirmDialog` outright so Radix's close animation never starts and cannot run under the arriving page's entrance. **Part 02 implements against this rather than inventing a second answer.** The flag is one-way and never resets, which is safe only because navigating away unmounts `DraftExperience` (Phase 12's Back-button finding).
- **Five exports have no consumer yet** — `DURATION.instant`, the `"exit"` kind, `SPRING` (used internally via `TRANSITIONS`), and `MAX_STAGGER_DELAY`/`STAGGER_STEP` (tests only). That is the part working as intended, but `instant` and `exit` are unexercised by anything but the type checker until part 02.

**Eight mutations, seven dead:** stagger cap removed (3 tests), `staggerDelay` ignoring `reduced` (2), `transitionFor` ignoring `reduced` (2), `DURATION.base` drifting from CSS, `EASE.enter` drifting from CSS, a CSS duration drifting from TS, and the reduced-motion block removed. The survivor is the equivalent mutant recorded above.

Verified: `npm test` (476), `tsc --noEmit`, `lint`, `format:check`, `build` — both `/play` routes still prerender static and all four API routes still dynamic, unchanged by adding a client wrapper to the layout.

**Not verified at ship time — and this was the largest gap any phase has shipped with.** No Playwright tooling was available in the session, so **none of the spec's browser verification ran**: the fade-and-rise on arrival at either width, the six existing animations still playing after the sweep, whether `TweenNumber` still reads as climbing rather than sliding at `DURATION.slow`, and the entire reduced-motion emulation including the wall-clock check that a game still takes ~30s. Everything above rested on the type checker, the unit tests and the build. **That gap is now closed — see the verification pass below.**

**The one risk that browser check was for was closed by source inspection first.** `RouteTransition` animates `y`, and a transformed ancestor makes `position: fixed` resolve against it instead of the viewport — the replay control bar is `fixed` below `md` and now sits inside that wrapper, with Phase 18 having measured its clearance at 3px. Both containing-block vectors were checked in the installed library rather than assumed:

- **`transform` resolves to the literal string `none`.** `motion-dom`'s `buildTransform` tracks a `transformIsDefault` flag and, absent a `transformTemplate`, returns `"none"` when every transform value is at its default. `RouteTransition` supplies no template, so once `y` settles at 0 there is no transform left.
- **`will-change` is never set.** `addValueToWillChange` is a no-op unless `MotionGlobalConfig.WillChange` is assigned, and that assignment appears nowhere in `motion-dom`, `framer-motion` or `motion` — it is opt-in, and this app does not opt in.

The transform does exist during the 240ms entrance, but the control bar only mounts in the SERIES stage, several clicks after the transition has finished, so the two never coexist. **No code change is needed.** A first pass had assumed motion leaves `translateY(0px)` behind, which would have made this a real defect; reading `build-transform.mjs` is what settled it.

### Phase 20 (part 1) — Browser verification pass

Ran after the fact against live Neon, once Playwright was available. **No code changed; nothing was found that needed fixing.** Every claim below is a measurement, not a sighting — the animations here are 180–240ms, far shorter than a screenshot round-trip, so they were sampled per `requestAnimationFrame` off computed style and `document.getAnimations()` rather than photographed. That is the same limitation Phases 17 and 18 hit with the quarter-break card and the face-off, and instrumenting around it is what made the rest of this list possible.

- **Both source-inspection claims confirmed live, closing the standing risk.** The settled `RouteTransition` wrapper reads `transform: none` and `will-change: auto` on every frame after the entrance, at every route and in both motion modes. `position: fixed` descendants therefore resolve against the viewport, and the control bar's 3px clearance is safe.
- **The route transition measured in both directions.** Draft → tournament on squad confirm, and tournament → draft via the fallback link, both start at `opacity 0` / `translateY(8px)` and ramp monotonically to `1` / `none` over ~233–247ms — `DURATION.base` (240ms). Also confirmed on a hard load of `/play/draft`, so the enter-only transition fires on initial mount as well as client-side nav. One ramp, never two: **no double-animated content**.
- **The dialog/route coordination works as designed.** Sampling `[role="dialog"]` every frame across the confirm click, the dialog is **already unmounted on the first frame after the click** and never once renders `data-state="closed"`. Radix's exit animation genuinely never starts, so it cannot overlap the arriving page. The `isHandingOff` decision is confirmed by observation, not just by reading it.
- **The sweep is confirmed at runtime, not just by grep.** Recording live animations through a played round, **every duration is 240ms or 180ms and every easing is exactly `cubic-bezier(0, 0, 0.58, 1)`** — `DURATION.base`/`DURATION.quick` and `EASE.enter`. That covers the `TournamentStage` crossfade (240ms, the swept 0.22 → 0.24), `SeriesFaceOff` (240ms, the swept 0.35 → 0.24, entering after the stage's exit under `mode="wait"`), `PlayByPlayFeed` rows (180ms, firing continuously as the feed streams) and `PeriodBreakCard` (180ms). No hand-picked value survives anywhere in the running app.
- **`TweenNumber` still climbs.** Sampling the scoreboard numeral per frame through a game, the score walks one integer at a time (56 → 57 → … → 78) with ~85–130ms steps inside the 400ms window — a 3-point basket resolves as three increments, not a jump. It reads as climbing, not sliding, at `DURATION.slow`.
- **The stagger cap holds on a real roster.** Across a 19-card board reveal, wrapper settle times step ~33ms (`STAGGER_STEP` = 0.03) and then **plateau from index 10 onward** — 10 × 0.03 = the `MAX_STAGGER_DELAY` cap exactly. First-appear to last-settle spans **300ms**, with the whole reveal finishing in ~532ms (300ms cap + 240ms duration). Phase 13's uncapped-stagger lesson is now confirmed empirically, not only by unit test.
- **The `DraftCourt` spring survived the sweep.** A slot fill bottoms at `scale` exactly **0.82** and `y` exactly **12**, then overshoots to just **1.008** before settling — the 340/26 reference feel, with an overshoot small enough to satisfy the house rule's "springs do not overshoot".
- **Reduced motion: no movement, and this is the sharpest result of the pass.** Under emulated `prefers-reduced-motion: reduce`, the route wrapper's `y` **never interpolates at all** — it is `none` from the first painted frame, with only opacity ramping, against a full 8px → 0 rise with motion on. `MotionConfig reducedMotion="user"` strips the transform while leaving opacity, exactly the two-depth policy this part recorded; `PlayByPlayFeed`'s declared `y: -6` likewise vanishes from its keyframes, leaving opacity alone. Most other animations drop to `dur: 1ms` — the global CSS block doing its job over shadcn's primitives and `transition-colors`.
- **Reduced motion does not change pacing.** A full game measured **33.0s** with motion on and **32.4s** with reduced motion — 1.7% apart, inside game-to-game variance. `useReplay`/`useAutoAdvance` are untouched by the preference, as hard constraint 10's principle requires. Both figures also confirm Phase 17's "~30s on screen" for a regulation game at Normal.
- Zero console errors throughout, at a true 1440 and a true 391, with **no horizontal overflow at either width** on either `/play` route. `npm test` (476), `tsc --noEmit` and `lint` all still clean.

**One cosmetic finding, not a defect:** with reduced motion enabled, `motion` itself logs a dev-time warning ("You have Reduced Motion enabled on your device"). It comes from the library, not from `src/`, and it persisted after emulation was cleared even though `matchMedia` reported `no-preference` and the animations demonstrably ran at full travel — so it is a stale library notice, not a signal about app behaviour. Worth knowing only because it means "zero console warnings" is not literally true while reduced motion is on.

Still not verified: the reduced-motion pass used Playwright's media emulation rather than a real OS setting, and `Start a new run` was exercised through the `No squad in play` fallback link rather than by finishing a run — the same `key={usePathname()}` remount either way, but not the literal Phase 19 button.

Still open: run state is not persisted, settled as a deliberate no in Phase 19. The champion path still cannot be reached by playing. No touch-drag support. `bracketSlot` remains unrendered by design.

### Phase 20 (part 2) — Draft Screen Motion

**Phase 20 stays 🟡** — second of five slices. `/play/draft` gets the seven motion
items from `context/docs/motion-animation.md`, written against the part 01
vocabulary. Ships `src/lib/draft-preview.ts`, `slotAcceptsPlayer` in
`src/lib/draft.ts`, `BREATHE`/`DENY_SHAKE` in `src/lib/motion.ts`, three small UI
additions the doc's motion needed, and 31 Vitest tests (476 → 507). No schema
change, no migration, **no new dependency**, no database write — the draft reads
the same endpoints it did in Phase 13.

**Every value comes from `motion.ts`.** The two new constants are loop and
keyframe values with no CSS half, so they are deliberately not `--duration-*`
tokens and do not join the part 01 mirror test.

Gotchas:

- **`dragleave` fires when the pointer crosses into a child, and that one carries
  the same position** — so the spec's "track the target position, not a boolean"
  is not sufficient on its own. The valid-slot state was being cleared as fast as
  it was set, and the lift and bright glow never appeared at all. The fix is a
  `currentTarget.contains(relatedTarget)` guard; the lift then measured −6.9px and
  **held** across further movement inside the slot. Found by driving, not reading.
- **A card that unmounts under the pointer never fires `pointerleave`**, so
  drafting by click left the drafted player previewed — and since he is now a
  duplicate, **no slot invited anything for the rest of the run**, across whole
  new teams. Measured four dark slots where four glows belonged. `previewPlayer`
  is now gated on the candidate still being on the offered roster, which closes
  every staleness path structurally instead of adding cleanup calls to forget.
  **The `start` browser pass saw this and misread it** as the pointer resting on
  a blocked card; only reading the diff in review turned it up.
- **`MotionConfig reducedMotion="user"` snaps transform targets rather than
  omitting them.** The card hover still jumped 2px and the drag lift still
  applied under emulated reduced motion. Both transient pointer gestures are now
  gated on `reduced`; the selection scale and the glow stay, because they mark a
  state rather than react to the pointer. Verified: `transform: none` on hover,
  no lift on a valid drag — but the glow still steps to BRIGHT, so the slot still
  says it accepts, and drag-to-draft still completes. **Parts 03–05 should assume
  a transform gesture needs an explicit `reduced` guard**, extending part 01's
  rule that only delays did.
- **`motion.button` reserves `onDragStart`/`onDragEnd` for its own drag gesture**,
  which shadows the native HTML5 handlers the `text/plain` payload depends on
  (Phase 6). The `whileHover`/`whileTap` gesture therefore sits on a wrapper.
  That wrapper then becomes the grid item, and the button stopped stretching — a
  row measured `J. Sikma=93` beside `R. Pierce=117` once a slot was selected and
  only one card carried a blocked-reason line. `flex h-full` on the wrapper
  restores it; four mixed rows now measure 117/117.
- **The breathing glow is the app's only permitted looping animation, and
  `MotionConfig` cannot stop a loop** — `isSlotBreathing` checks
  `useReducedMotion()` explicitly. It is also the one easing outside `EASE`:
  a one-way curve reads wrong on a loop, so `BREATHE.ease` is easeInOut, written
  out for the same reason `EASE` is.
- **Every gold glow on an empty slot comes from one overlay**, not from three
  className branches. The first cut left the selected slot's static shadow as a
  class and the drag's bright shadow on the overlay, which double-glowed a valid
  drag. One overlay, three shadow values, one `isSlotBreathing` decision.
- **Transforms on the court are percentages of the slot, never px** (Phase 5's
  `cqw` rule). That makes the specced "~4px lift" and "≤6px shake" width-relative
  rather than absolute: the lift measures 6.9px at 1440 and ~2.9px at 390, the
  shake peaks 6.5px at 1440 and ~2.7px at 390. **A px cap and a percentage
  amplitude cannot both hold at every width**; the percentage is the one that
  matches the court, and the numbers are recorded rather than tuned to satisfy a
  cap at one width only.
- **The `DraftCourt` stagger fix could not use a ref.** `react-hooks/refs`
  rejects reading `ref.current` during render, and `set-state-in-effect` blocks
  the state version (Phase 17 hit that one). The data already distinguishes the
  cases: five empty slots only ever arrive together on mount, and a drafted card
  always lands alone — so the delay keys on `member ? 0 : index`. No hook needed.
- **The 5/5 pulse keyframes are hoisted to a module constant.** An inline array
  is a new target every render, which motion replays as a fresh pulse. Measured
  peak 1.0598 over 24 frames, settling to exactly 1 and staying — non-repeating.
- **The progress bar overflowed the page at 390** (scrollWidth 412 vs 391): an
  intrinsically-sized bar widened the header's `shrink-0` column. Segments are
  now `flex-1` in a `w-full` row, so the bar can never be wider than the column
  already is. **Phase 12's pre-existing 320px overflow is untouched.**
- **The reroll dots cost ~46px the row did not have**, wrapping the label at both
  1024 and 390. Tightened gaps recovered 390, 768 and 1280; 1024 needed the type
  step moved `sm:` → `xl:`, because **the board column is at its narrowest between
  lg and xl, not at 390** — below `lg` the grid is single-column and full width.
- **Item 7 keeps Radix's CSS enter/exit rather than replacing it with motion.**
  A motion exit needs `forceMount` on Portal, Overlay *and* Content, which
  shadcn's `DialogContent` does not expose, and rebuilding the primitive risks
  Phase 12's height-gated scroll structure — precisely what the item warns
  against. The stagger and the `layoutId` indicator are motion; the open/close is
  Radix. **This is the one item not implemented as specced.**
- **The confirm button's disabled styling was verified by diff, not by sighting.**
  Conference and name persist across close/reopen (Phase 12 behaviour, verified
  there), so the dialog could not be returned to its disabled state without a
  fresh draft. No transition was added to that button.
- **`previewPlayer` carries no `source` field**, against the spec's shape.
  `dragPlayer ?? hoverPlayer` makes "DRAG outranks HOVER" structural rather than
  a rule that can be got wrong, and once the drag target is tracked per slot,
  `source` had no consumer.
- **The progress bar fills by count, not by slot**, resolving a spec that
  contradicts itself ("the segments are indexed by slot" versus "the count is
  just `filledSlots`, so nothing needs reordering"). Slot-indexing would leave
  gaps — draft a C first and only the fifth segment lights — which reads wrong
  under a "SLOTS FILLED 5/5" caption and duplicates what the court already shows.
- `slotAcceptsPlayer` takes `(state, slots, player, position)` rather than the
  spec's `(player, position, state)`, matching the argument order every other
  function in `draft.ts` already uses.

**Three rules were extracted into `src/lib/draft-preview.ts` during
`/feature test`** — the invitation rule, the drag response, and the loop guards,
all of which the browser pass had confirmed by observation only. Components are
not tested under `coding-standards.md`, so this is the same move as Phase 11's
`mode` dispatch, Phase 13's `rerollRequest`, Phase 17's `nextTick`, Phase 18's
`gameAdvance`, Phase 19's `eliminationHeadline`. `SlotDragState` moved there too;
it was being exported from a component.

**The two strongest tests are agreement tests, not shape assertions:**
`isInviting` must equal `slotAcceptsPlayer` for every fixture player × every
slot, and `dragState === "VALID"` must hold **exactly** when the reducer would
take the drop. That second one is the phase's whole point — a preview that
disagrees with the rejection that follows is the failure `slotAcceptsPlayer`
exists to prevent. `slotAcceptsPlayer` itself is tested against the **reducer**
rather than against `validateDraft`, which would be tautological given it
delegates. The motion constants are tested for the properties that fail silently
— a loop whose last keyframe differs from its first jumps on repeat, a shake that
does not end at `0%` leaves the slot permanently offset — never for their values.

**Fourteen mutations, all dead**, every file byte-identical afterwards: the slot
substitution dropped from `slotAcceptsPlayer`, the identity check reordered past
slot occupancy, the predicate widened to any open slot, invitation ignoring
selection / a filled slot / the no-preview fallback, drag VALID↔INVALID swapped
(3 tests), every slot responding to the drag, breathing ignoring reduced motion /
selection / the drag, the breathe loop not returning to its start, the shake
leaving a permanent offset, and the shake amplitude in pixels (3 tests).

Verified: `npm test` (507), `tsc --noEmit`, `lint`, `format:check`, `build` —
`/play/draft` still prerenders static, all four API routes still dynamic.

Browser-driven against live Neon at true CSS widths of **1440, 1280, 1024, 768
and 391 with no horizontal overflow at any** and **zero console errors**.
Animations here are 180–400ms, shorter than a screenshot round-trip, so
everything below is a per-`requestAnimationFrame` measurement off computed style
and `document.getAnimations()` rather than a sighting — the same instrumentation
part 01's verification pass established:

- Five slots breathing at rest (one running animation each, opacity mid-cycle
  inside the 0.7–1.0 band); hovering LeBron narrows it to SF alone, Lonzo Ball to
  PG alone, a slot-filled SF card to **none**, and moving off restores all five.
- Selection settles at exactly scale 1.02 with its glow held (`anim0`, opacity
  1.00) while the other four keep breathing, and **no slot is ever left scaled or
  held** once the selection moves — checked across SF, PG and C in turn.
- The deny shake peaks 6.46px over 12 frames (~200ms) then reads **flat zero for
  two further seconds** while the pointer sits on the slot. Fires once, never
  repeats.
- An invalid drop still routes through `validateDraft` to the Phase 6 toast
  (`That slot already has a player.` on a filled slot, `Attempt to place in wrong
  position.` on a wrong-position one) with the board unchanged. Escape cancels a
  drag and clears the preview — no slot left lifted or glowing.
- Segments fill one per draft, the count ticks 0→5, and the bar pulses once at
  5/5. **A 0→1 tween is not visually distinguishable**, so `TweenNumber` here
  rests on part 01's frame-by-frame confirmation rather than this phase's.
- Three rerolls extinguish the **rightmost** dot each time (opacity 1→0, scale
  1→0.6) and the buttons fade to 0.5 at zero. A forced `fetch` rejection toasted
  and held the dots at 3/3 — Phase 13's rule intact.
- Dialog rows stagger ~33ms apart (`STAGGER_STEP`) and settle at ~380ms, well
  inside the 300ms cap plus one duration. The conference indicator slides across
  23 distinct x positions from EAST to WEST while both buttons stay put. Escape
  and Cancel both play `open → closed → unmounted`; **confirm goes `open →
  unmounted` with no `closed` state**, so Radix's exit never starts and the route
  entrance ramps once — part 01's hand-off, confirmed from the other side.
- Reduced motion emulated: the glow is static (`anim0`) but still marks the
  accepting slots, no hover lift, no drag lift, no stagger, and the draft
  completes normally.

Not verified: the reduced-motion pass used Playwright's media emulation rather
than a real OS setting (unchanged from part 01). The **cross-season duplicate is
covered by test only** — the offered team is server-random, so the same player
cannot be forced onto a second board from the UI, the same gap Phase 13 recorded.
The eleven touched components have no tests, per `coding-standards.md`.

**Found but not fixed:** at exactly **1024**, `SHARED REROLL POOL` wraps to two
lines. Nothing clips and nothing overflows; the row is 16px taller. That column
is the narrowest point in the whole layout, and Phase 16 recorded 1024 as "tight"
for the bracket for the same reason.

Still open: no touch-drag support, unchanged since Phase 6 and explicitly out of
scope here. Run state is still not persisted (settled as a deliberate no in
Phase 19). Phase 12's 320px horizontal overflow on this page is untouched.

### Phase 20 (part 3) — Tournament Bracket Motion

**Phase 20 stays 🟡** — third of five slices. The bracket stage of
`/play/tournament` gets items 8–12 of `context/docs/motion-animation.md`: the
round reveal, the winner resolve, the champion stub unlock, the difficulty meter
fill, and the mobile spine expand. Ships `roundMotionFor` + `isChampionUnlocking`
in `src/lib/tournament-view.ts`, `entranceFrom` in `src/lib/motion.ts`, the 44px
touch-target sweep Phases 16 and 18 left, and 14 Vitest tests (507 → 521). No
schema change, no migration, **no new dependency**, no database read or write —
every figure comes from state Phase 15 had already computed.

**The spec's central premise was wrong, and finding that is most of the phase.**
Items 8–10 are all specced as transitions on a surviving element: an
`AnimatePresence` key change for the reveal, a crossfade between the stub's two
branches. None of it can fire. **`TournamentStage` keys on the stage, so
BRACKET → SERIES → BRACKET remounts the entire bracket subtree** — nothing there
lives long enough to see a prop change, and the stub's locked and revealed
branches never coexist. Every bracket entrance is necessarily a *mount*
animation.

Gotchas:

- **My first implementation and my first verification were wrong in the same
  direction, which is what nearly hid it.** I built the specced key change, then
  measured a wrapper ramping `0.00/8.0 → 1.00/0.0` over 240ms and read it as the
  reveal working. It was `TournamentStage`'s own crossfade — the selector matched
  the stage wrapper, which contains every card. The stub is what broke the tie:
  it measured **already settled on the first frame it existed**, which no
  crossfade can do. A measurement that confirms the thing you expected is worth
  less than one that contradicts it.
- **`roundMotionFor` takes `revealedThrough`, not the bracket.** The page already
  computes `revealedThroughFor(bracket)` for `visibleRounds`, so passing the
  value keeps the whole page diff to five lines and makes the rule testable
  against a bare round id with no bracket fixture at all.
- **Two rounds, two different treatments, and conflating them is the bug to
  avoid.** The round the squad just completed is `RESOLVING` (its scores rise
  in); the one after is `REVEALING` (its slots fade in). One rule returns both,
  and a test pins that no round is ever given both — collapsing them replays
  every score on every return to the bracket.
- **The spoiler invariant is inherited, not re-derived.** Both entrances anchor
  on `revealedThroughFor`, which a Phase 16 test already pins as refusing to
  count a far-half result. Mutating it to count any resolved matchup kills 6
  tests, two of them new. The far-half test is not a shape assertion: it builds
  the same bracket with and without the far half resolved, asserts the far half
  genuinely decided more matchups, then asserts the motion is identical.
- **Item 10's guard is the one the type system cannot help with.**
  `finalsOpponent(bracket)` returns the drawn champion at all times; `opponent
  === null` is the lock, and both branches are `BracketOpponent | null`. Phase 16
  shipped the 1985 Lakers into Round 1 by reading past it. `isChampionUnlocking`
  takes the already-guarded value, and a test spells out that it never unlocks
  without one.
- **A zero-duration entrance still paints its initial frame.** Under reduced
  motion the reveal held `0.00/8.0` for ~27ms before snapping — measured, not
  predicted. `entranceFrom(active, reduced, from)` returns `false` (motion's own
  "start where you are") instead of an instant entrance. **This extends part 02's
  finding**: part 01 said only delays need an explicit `reduced` guard, part 02
  added transform gestures, and this adds declared initials.
- **Item 10 ships as an entrance, not the specced crossfade** — forced by the
  remount, not chosen. A real crossfade needs the stage machine restructured,
  which is out of scope.
- **Item 9's strike is CSS `transition-colors`, not motion**, which the spec
  explicitly permits ("simple beats clever"). A rule that genuinely grows needs a
  pseudo-element or an overlay; the colour crossfades and the strike appears with
  it. The global reduced-motion block already flattens it.
- **The ladder animates opacity and transform only.** The connector ticks sit at
  each column's `top-1/2`, so an animated height would move them — Phase 16's
  grid rationale, still load-bearing. Item 12's spine height is the one
  deliberate exception.
- `AnimatePresence initial={false}` on the spine's height panel is what stops the
  `readOnly` archive reading as collapsed-then-expanded: its first painted frame
  is already at full height.
- **The 44px debt is closed.** `Show full bracket` (41px) and the squad-rail
  toggle (36px) both measure exactly 44 now — found by Phase 16, left by Phase 18
  when it set the rule for the control bar.

**Two defects found in review by reading the diff, not the running app** — both
visual, both invisible to the type checker and to every test:

- **Dimmed difficulty dots changed colour.** Splitting the dot into a track plus
  an absolute fill is harmless for `bg-primary` (opaque) but not for the dimmed
  `bg-primary/40`, which began compositing over a `bg-muted-foreground/25` track
  that was never underneath it. The track now paints only where no fill covers
  it; verified that every filled dot reads `hasTrack: false` and every unfilled
  one `hasTrack: true`.
- **The expanded spine had 24px gaps where it had 12px** — the height wrapper
  became a flex child of a `gap-3` parent *and* carried `pt-3`. Re-measured at
  `[12, 12, 12]`.

**Eight mutations, all dead on the first run**, both source files byte-identical
afterwards: `roundMotionFor` ignoring `readOnly` (2 tests), off by one so it
reveals the completed round (5), collapsing `RESOLVING` into `REVEALING` (5);
`revealedThroughFor` counting any resolved matchup — the far-half leak (6);
`isChampionUnlocking` dropping the opponent guard (1) and dropping `readOnly`
(1); `entranceFrom` ignoring `reduced` (1) and always declaring an entrance (3).

Verified: `npm test` (521), `tsc --noEmit`, `lint`, `format:check`, `build` —
`/play/tournament` still prerenders static, all four API routes still dynamic.
Phase 16's grep tests stay green; no component was added, so the grep list is
unchanged.

Browser-driven against live Neon with **zero console errors**, at true CSS widths
of **1440, 1024 and 391 with no horizontal overflow at any**. Everything below is
a per-`requestAnimationFrame` measurement off computed style — these run
180–260ms, far shorter than a screenshot round-trip:

- Both semifinal cards ramp `0.00/8.0 → 1.00/0.0` over ~240ms with ~30ms between
  them (`STAGGER_STEP`), while the other three columns hold flat at `1.00/0.0`
  for every sampled frame.
- Score badges resolve on the completed round **only** — Round 1 does not replay
  when the semis resolve.
- The stub unlocks on the same 240ms beat at the Conference Finals, and read
  `3 ROUNDS AWAY` then `2 ROUNDS AWAY` before it.
- Dots step at ~40ms offsets (`0.00:0.60 → 1.00:1.00`); dimmed ones flat from
  frame one.
- The spine expands `0 → 519px` and collapses back over ~260ms as one transition,
  no per-item cascade; the archive's first painted frame is already full height.
- The archive plays nothing: every card `1.00` from the first frame, no `NEXT UP`.
- At 1024 — the tight width Phase 16 only checked at one bracket state —
  `scrollWidth` stays exactly 1024 through **every frame** of the reveal, so the
  transform never causes a transient overflow.
- Reduced motion, on a live reveal: 27 sampled frames, the only card value
  `1.00/0.0`, zero partial dots, and the reveal still happens (`AWAITING WINNER`
  4 → 2). Nothing is hidden or shown differently.
- Masking confirmed on screen: with the semifinals revealed, the far-half
  semifinal showed both teams and **no score**.
- A squad loss strikes the squad's own row (`YOUR SQUAD`, muted, after a 4-0
  semifinal defeat) — Phase 16's fix survives into the `SQUAD` branch.

**The champion path is still unreachable by playing — fifth phase of evidence.**
Two natural runs went out in Round 1 and the Semifinals. The Conference Finals
and Finals checks used the temporary `?dev=champion` shortcut that reseeds
`playMatchup` until the squad wins, so games and logs stayed real; it produced a
full **NBA CHAMPIONS** run and was **deleted before commit** — `grep` for
`dev=champion`, `DEV SHORTCUT`, `devWin` returns nothing, and the committed page
diff is only the `revealedThrough` wiring. Phases 16 and 19 used the same device.

Not verified: the seven touched components have no tests, per
`coding-standards.md`. The reduced-motion pass used Playwright's media emulation
rather than a real OS setting (unchanged since part 01). The `entranceFrom`
extraction and the two review fixes landed after the main browser pass — the
fixes were re-measured, but the five `entranceFrom` call sites rest on the type
checker and the unit tests rather than a second full drive. 768 was not
re-checked separately; it is the spine, which was driven at 391.

**A note on the dev environment, not the code:** the Neon branch was cold and
returned `P1001` / `QUERY_FAILED` for ~40 seconds on first contact before waking.
Nothing in `src/` was involved. Also, the stale `dragStateFor is not defined`
traces in `.next/dev/logs` are from part 02's HMR window and no longer exist in
`src/`.

Still open: run state is not persisted (settled as a deliberate no in Phase 19).
`bracketSlot` remains unrendered by design. No touch-drag support. Parts 04
(match replay) and 05 (result screen) remain — **part 05 inherits this part's
components in `readOnly` mode**, where `roundMotionFor` already returns `NONE`.

### Phase 20 (part 4) — Match Replay Motion

**Phase 20 stays 🟡** — fourth of five slices. The replay stage of
`/play/tournament` gets items 13–18 of `context/docs/motion-animation.md`: the
lead-change flash, the momentum line extending, scoring leaders reordering, the
series dot at the buzzer, the control bar's sliding indicator, and the series
result card's entrance. Ships `momentumAxisEnd` + `REGULATION_SECONDS` in
`src/lib/replay.ts`, two new `ReplayFrame` fields, seven touched components, and
11 Vitest tests (521 → 532). No schema change, no migration, **no new
dependency**, no database read or write — every figure comes from a log Phase 15
had already computed.

**Both inherited constraints held by construction.** Nothing gates on an
animation, because the log exists before the first frame; measured **33.00s
motion-on against 33.05s reduced** at the same width and speed, which is the
whole of hard constraint 10 in one number. And the two new frame fields went
through `replayFrame`, so **Phase 17's spoiler test covers them with no new test
code** — the invariant enforces itself exactly as the spec predicted.

Gotchas:

- **Item 14 needed the x-axis replaced, and where the replacement lives decided
  whether it was testable at all.** The strip normalized x to `lastX`, so the
  whole curve rescaled every event — it stretched rather than grew, and there was
  no fixed axis to extend along. `momentumAxisEnd` is regulation length until an
  overtime is *actually entered*, and it sits in `replay.ts` reached through
  `ReplayFrame.momentumAxis`. In `MomentumStrip` nothing would have pinned it.
- **The leak and the correct code are indistinguishable on a regulation game.**
  Deriving the axis from `periodScores.length` or the last event's period only
  differs on a game that will *later* run long. The load-bearing test therefore
  asserts the axis is exactly regulation at **every cursor in periods 1–4 of a
  double-overtime game**; that mutation kills 5 tests. `ot-51` (5 periods) and
  `ot-221` (6) were found by probing seeds at even strength.
- **The curve is plotted against regulation and the whole group scaled by
  `REGULATION_SECONDS / axis`.** An overtime compresses it in one transition
  rather than every point jumping at once. The tip dot and the curve stay glued
  through that rescale **by construction, not by tuning**: `left` is linear in
  `scaleX` and both tween the same duration and easing.
- **A test replaces an argument I could not verify on screen.** Because the
  scale factor is `REGULATION_SECONDS / axis`, an axis below regulation would
  scale the curve *up* and past the viewBox edge. `momentumAxisEnd` never falls
  below regulation at any cursor — asserted, so the anti-clipping property is
  pinned rather than reasoned.
- **The tip dot is HTML, not an SVG circle.** `preserveAspectRatio="none"` would
  render a circle as a badly stretched ellipse. Measured: **no ancestor between
  the dot and `<body>` has non-visible overflow**, and its maximum overhang is
  exactly 3px — its own radius, at the end of regulation, inside the card's 16px
  padding.
- **Item 13's flag is threaded, not re-derived, and that is the point.**
  `ReplayScoreboard` derived `leader` locally; `isLeadChange` already drove the
  feed badge. The strongest test is the agreement one: at every cursor of a real
  game, `frame.leadChange` equals whether `frame.feed[0]` carries a
  `LEAD_CHANGE` badge. Flash and badge are now one decision in the module, not
  two in two components.
- **`leadChangeAt` is a cursor, not a boolean, and real data says it has to be.**
  A boolean stays true across two consecutive flips and would flash once.
  Probing found back-to-back lead changes in **5 of the first 7 seeds** — it is
  ordinary, not theoretical — and a test pins that the case exists.
- **`ReplayScoreboard` holds the app's only imperative animation.** Everything
  else is declarative. "A new flash replaces the running one rather than being
  enqueued behind it" is precisely what starting an animation on an element
  does, and no declarative form expresses it; a re-key would remount
  `TweenNumber` and restart the score tween.
- **`entranceFrom(true, reduced, …)` passes a literal `true`** at three call
  sites. It reads oddly, but part 03 made that helper the single home of
  "reduced means no entrance", and duplicating the ternary into components is
  the worse trade.
- **`SeriesBanner`'s dot needed an explicit `reduced` guard, found by
  measuring.** It scales in, and part 02's finding is that `MotionConfig` *snaps*
  a transform target rather than omitting it. The other new opacity fades
  deliberately keep playing under reduced motion, per part 01's rule.
- **`AnimatePresence initial={false}` is what makes item 16 fire at the buzzer
  and nowhere else.** `GameReplay` is keyed by `game.seed`, so the banner
  remounts each game; without it, every existing dot would replay on mount.

**One defect found in review by measuring what I had not measured, and it was
mine.** `ScoringLeaders` bounced the column 44px on every leader change:
`AnimatePresence`'s default mode keeps a departing row **in flow** while its
replacement enters, so a three-row list briefly had four — **159 frames at 4
children, height 124px → 168px**, ~13 times in one game, shoving the momentum
strip and everything below it. The `start` pass measured that rows *slide* (836
transform frames) and read that as the item working; measuring what moves never
asks whether the container grew. Fixed with `mode="popLayout"` and `relative` on
the `<ul>`; re-measured at **never more than 3 in flow, both columns capped at
124px, and `moves: 681`** so the slide survived. Also restored a guard dropped
during the rewrite — `MomentumStrip` read `points[points.length - 1].x` where
the old normalization had `?.`.

**Eight mutations, all dead**, `replay.ts` byte-identical after each: the axis
derived from the whole log (5 tests — the leak the spec named), the axis never
extending (3), the axis losing its regulation floor (2, and 3 for the stronger
form), the frame reading the finished log for `leadChange` (3) or for
`momentumAxis` (1), and a go-ahead from a tie counting as a lead change (4).

**Nothing was extracted this phase, and that is the finding.** Every earlier
slice moved a rule out of a component to make it pinnable — Phase 11's `mode`
dispatch, 13's `rerollRequest`, 17's `nextTick`, 18's `gameAdvance`, 19's
`eliminationHeadline`, part 02's `draft-preview.ts`, part 03's `roundMotionFor`.
Here the two rules that mattered were already in `replay.ts` **because the spec
put them there**. The other six items are transitions with no decisions in them.

Verified: `npm test` (532), `tsc --noEmit`, `lint`, `format:check`, `build` —
both `/play` routes still prerender static, all four API routes still dynamic.
Scope held by diff, not assertion: `git diff --name-only` shows no
`src/lib/match.ts`, no `src/types/match.ts`, no API route, no `src/hooks/`, no
`src/lib/series-flow.ts`.

Browser-driven against live Neon with **zero console errors and zero warnings**,
at true CSS widths of **391, 768, 1024, 1280 and 1440 with no horizontal
overflow, no scoreboard collision and no line-score clipping at any**. These run
135–470ms, shorter than a screenshot round-trip, so everything below is a
per-`requestAnimationFrame` measurement off computed style:

- **The flash is one-for-one with the feed.** A full game produced exactly 2
  flashes against exactly 2 `LEAD_CHANGE` badges, on the sides the badge scores
  name (`87-88` → AWAY, `89-88` → HOME), ramping 0.30 → 1.00 over ~8 frames.
- The momentum tip advances **0px → 340px → 607px** through a game, so the line
  genuinely extends rather than stretching; line-score columns stayed Q1–Q4 and
  `scaleX` stayed 1 across ~18 games.
- Leaders: 681 frames of genuine slide, **2167 frames in 32s — 60fps sustained
  at Fast**, which was the spec's stated risk.
- The series dot: count 3 → 4 at the buzzer, with the new dot alone running
  0.60 → overshoot 1.017 → 1.000 while the three existing ones read `1.00 /
  none` every frame.
- The control bar: speed pill slides 131 → 225 while the mode pill holds at
  1046, then the mode pill slides 1046 → 1140 while speed holds — two
  `layoutId`s confirmed from both directions. All six controls exactly 44px.
- The result card ramps opacity and `y: 7.72 → 0` over ~240ms with lines
  stepping ~32ms apart (`STAGGER_STEP`), settling to `transform: none`. The
  hand-off measured **`maxConcurrent: 1` on every frame** — outgoing fades to 0,
  then incoming fades in. **One transition, not two.**
- Reduced motion is a clean A/B on the same width and speed: **31 flash frames
  and 836 leader slides with motion on, zero and zero with it off**, and the
  game still takes the same wall-clock time.

Not verified: **no overtime game came up in ~18 played games across two runs**,
so the axis rescale was never seen widening on screen. What was verified is the
negative — it never widened when it should not have, in any of them — and the
positive case is covered by four unit tests including the anti-leak one. The
reduced-motion pass used Playwright's media emulation rather than a real OS
setting (unchanged since part 01). The seven touched components have no tests,
per `coding-standards.md`.

**A performance note carried rather than acted on:** the tip dot animates
`left`/`top`, which triggers layout, where a transform would not. Measured 60fps
sustained at Fast with 681 concurrent layout animations beside it, so it costs
nothing today.

Still open: run state is not persisted (settled as a deliberate no in Phase 19).
The champion path still cannot be reached by playing. No touch-drag support.
`bracketSlot` remains unrendered by design. **Part 05 (result screen) is the
last slice**, and inherits part 03's bracket components in `readOnly` mode.
