# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## References

<!-- Spec files, related docs, existing code to follow -->

## History

### Phase 1 — Project Foundation Setup

Cleared all `create-next-app` boilerplate, installed the stack (Prisma 7 + `@prisma/adapter-neon`, `motion`, Zod, shadcn/ui with the `radix`/`nova` preset, Vitest, Prettier), set up the `src/`-based folder structure with `prisma/` and `scripts/` at the root, and reduced the home page to the single text `Legacy Run`.

Notable decisions and gotchas:

- Prisma 7 removed `url` from the `datasource` block — see the Prisma 7 section in `coding-standards.md`.
- `.env*` in `.gitignore` was silently ignoring `.env.example`; fixed with a `!.env.example` negation.
- shadcn's init emitted a self-referential `--font-sans: var(--font-sans)`; repointed at `--font-geist-sans`.
- Geist fonts kept — the `nova` preset is built around them, so they're now intentional rather than leftover scaffolding.
- `@typescript-eslint/no-empty-object-type` relaxed so the mandated `type Props = {}` passes.

Verified: `lint`, `format:check`, `test`, `prisma validate`, and `build` all pass; the dev server renders `Legacy Run` with Tailwind and the shadcn token layer applied. Not verified: a live database connection — needs a real `DATABASE_URL`, and there are no models until Phase 2.

Still open: `next dev` may regenerate a root `AGENTS.md` (the file now lives at `context/AGENTS.md`) — decide then whether to ignore or commit it.

### Phase 2 — Core Entity Schema

Added the identity layer to `prisma/schema.prisma`: a `Position` enum, a `Conference` enum, and four models — `Player` (one row per real person, `slug` as the stable unique key, plus `fullName` and optional `birthDate` for disambiguating same-named players), `Team`, `Season` (`year` unique, ending-year convention: the 2009-10 season is `2010`), and `Roster` (the team–season–player join, unique on the triple).

Notable decisions and gotchas:

- **Positions became an unordered `Position[]` on `Roster`, not primary/secondary.** The original spec called for "primary + optional secondary," but two slots truncates players who legitimately cover three (Draymond at PF/C/SF). No primary is distinguished — a player fits a formation slot if the slot appears in the array, so Phase 13 eligibility is `positions: { has: slot }`.
- **`player_positions` table dropped.** With positions as one array column it was strictly 1:1 with `rosters` and bought only a join — four tables instead of the specced five. Revisit if per-position metadata (minutes at position, depth-chart rank) is ever needed.
- Added a `Conference` enum beyond the spec — `Team.conference` needs it, and Phase 19's conference select reads it.
- **`prisma migrate dev` can't author migrations offline** — it needs a live database for the shadow-DB diff, and `.env` still points at `localhost:5432`. Used `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` instead. Note Prisma 7 renamed `--to-schema-datamodel` to `--to-schema`; most examples still show the old flag.
- Skipped `src/types/` — nothing consumes these shapes until Phase 9, and the generated client already provides them.

Verified: `prisma validate`, `db:generate`, `lint`, `format:check`, `test`, and `build` all pass. Not verified: anything needing a database — the migration at `prisma/migrations/20260811182444_core_entity_schema/` is authored but **unapplied**, and will run on the first `db:migrate` against real Neon.

Still open: `DATABASE_URL` is a placeholder. Phase 4 (seed dataset) is the first phase that genuinely can't proceed without a live Neon database.

### Phase 3 — Ratings & Playoff History Schema

Added the ratings and playoff-history layer to `prisma/schema.prisma`: a `PlayoffRound` enum and three models — `PlayerSeasonRating`, `TeamSeasonRating`, and `PlayoffParticipation` — plus reverse relations on `Player`, `Team`, and `Season`. These tables ship empty; the ingestion pipeline (Phases 8–9) populates them.

Notable decisions and gotchas:

- **`PlayerSeasonRating` keys on `(playerId, seasonId)`, not on `Roster`.** A rating describes the person's season, not their stint with one team, so a mid-season trade (two roster rows, one season) still resolves to a single rating. Cost: the draft screen joins `Roster → Player → PlayerSeasonRating` on `seasonId` rather than reading a rating off the roster row. Revisit if ingestion turns out to produce genuinely per-stint ratings.
- **Playoff participation and results are one table, not two.** A separate `playoff_results` would be strictly 1:1 with participation — seed, round reached, and W/L all describe the same team-season appearance. Same reasoning that collapsed `player_positions` in Phase 2. Split only if per-series records (opponent, game-by-game) are ever needed.
- **`MISSED` dropped from `PlayoffRound`.** The spec listed it, but membership in `playoff_participation` *is* the "made the playoffs" signal — a `MISSED` row is unreachable by construction, and keeping the value only invites someone to write one.
- **`prisma/migrations/migration_lock.toml` was missing.** Phase 2 authored its migration by hand and never created it, so `prisma migrate` couldn't determine the connector — a latent breakage that would have surfaced on the first real `db:migrate`. Added with `provider = "postgresql"`.
- **The Phase 3 spec's suggested `--from-migrations` diff doesn't work offline.** Prisma 7 replays the migrations directory and demands `datasource.shadowDatabaseUrl` — a live database. Authored the migration instead by diffing the committed schema against the working copy: `git show HEAD:prisma/schema.prisma > /tmp/previous.prisma && npx prisma migrate diff --from-schema /tmp/previous.prisma --to-schema prisma/schema.prisma --script`. This is the pattern to reuse for every later offline schema change (Phase 2's `--from-empty` form only works for the first migration).
- Raw rating inputs stored on `PlayerSeasonRating` (games, minutes, points, rebounds, assists, steals, blocks, TS%, usage) are required; `boxPlusMinus` and `defensiveBoxPlusMinus` are nullable, since advanced box-score derivatives are the likeliest gaps in early-1980s data. `TeamSeasonRating` carries only the three ratings — its aggregation inputs already live in the roster and playoff tables.

Verified: `prisma validate`, `db:generate`, `lint`, `format:check`, `test`, and `build` all pass. The migration at `prisma/migrations/20260812120000_ratings_playoff_history/` contains 3 tables, 1 enum type, 3 unique constraints, 4 indexes, and 6 foreign keys. Not verified: anything needing a database — both this migration and Phase 2's are **unapplied** and will run together on the first `db:migrate` against real Neon.

Still open: `DATABASE_URL` is a placeholder. Per the reordered `todo.md`, Phase 4 is now typed TS fixtures in `src/data/` (no seed script, nothing written to the database), so the first phase that genuinely requires live Neon has moved out to Phase 9's ingestion runner.

### Phase 9 (part 1) — Rating & Type Alignment

Reshaped the schema around a single overall rating and the fields the Basketball-Reference advanced table actually provides, then added the first runtime gameplay types in `src/types/game.ts`. Done ahead of Phase 4 so the mock fixtures aren't built against types that were about to change. **Phase 9 stays 🟡 in `todo.md`** — the mock-fixture alignment and the nullability confirmation both depend on later phases.

Scraped fields the schema now targets: Player, Team, G, MP, PER, BPM/OBPM/DBPM (BPM is their sum, so all three cost nothing extra), plus VORP, WS/48, Age, Pos, TS%. All raw inputs are stored so the normalization function can change without re-scraping.

Notable decisions and gotchas:

- **The `seasons` table was dropped** in favour of a plain `seasonYear Int` (same ending-year convention). It only carried a display label the UI can format, and it added a join to every draft and bracket query. Phase 2's decision to model it as an entity didn't survive contact with the query shapes.
- **`rosters` replaced by `team_seasons` + `player_seasons` + `player_season_teams`.** The player-season is now the primary unit, and the join table is the relational form of a `teams: string[]` field — Postgres can't foreign-key an array.
- **One rating per player-season, from the combined `2TM`/`3TM` row.** A traded player shows the same rating whichever of his teams the draft offers, which matches the once-per-run duplicate rule (already per person) and avoids rating a 5-game stint off a 5-game sample. The cost is that "who he was on *that* roster" isn't represented; revisit only if the draft feels wrong.
- **Offensive/defensive ratings dropped** from both player and team ratings — one `overallRating` each. This reverses Phase 3, which stored all three. Off/def splits come back only if Phase 19's sim engine needs them.
- **`player_season_data` is a separate 1:1 audit table** for raw scraped inputs, keyed by a unique `playerSeasonId` FK. It deliberately does **not** repeat playerId/age/positions/teams — the FK reaches all of them and duplicated keys drift. The scraper writes this table; the rating engine reads it and writes `player_seasons.overallRating`.
- **Nullability split on data-availability grounds:** G and MP are required (they're the reliability filter), every advanced metric (PER, TS%, WS/48, BPM, OBPM, DBPM, VORP) is nullable, since early-1980s rows are the likeliest gaps. These are still *guesses* until Phase 7 scrapes real rows.
- `playoff_participation` survived unchanged apart from the `seasonId` → `seasonYear` re-key. It stays separate from `team_seasons` on the Phase 3 logic: `team_seasons` is the lean gameplay row, playoff outcome data is ingestion history.
- Runtime types (`DraftTeam`, `SquadMember`, `Squad`, `DraftablePlayer`) are gameplay-only, never persisted. `seasonYear` is a number, matching the column; `teamLogo` is derived from the team slug at read time rather than stored; `score` became `rating` to match the DB. `SquadMember.position` is a single `Position` — the slot the player was drafted into — with no `positions` array, since his other eligible positions stop mattering once he's on the squad.
- The Phase 3 offline-diff pattern (`git show HEAD:prisma/schema.prisma` → `prisma migrate diff --from-schema … --to-schema …`) worked as documented for a third time. Its output needed one cleanup: the `Loaded Prisma config from prisma.config.ts.` banner goes to stdout and has to be stripped out of `migration.sql`.

Verified: `prisma validate`, `db:generate`, `lint`, `format:check`, `test`, and `build` all pass. The migration at `prisma/migrations/20260812190000_rating_type_alignment/` drops 4 tables and creates 4. Not verified: anything needing a database, and no UI consumes the new types yet — nothing renders until Phase 5.

Still open: `DATABASE_URL` is a placeholder, and all three migrations are **unapplied** — this one drops the tables the other two create, so a first `db:migrate` against real Neon will churn through the whole sequence. Squashing them into one initial migration is worth considering while the database is still empty.

### Phase 4 — Mock Dataset

Hand-built the local development dataset as typed TS fixtures in `src/data/` — 12 real playoff team-seasons (1983 Sixers, 1986 Celtics, 1987 Lakers, 1994 Rockets, 1996 Bulls, 2001 Lakers, 2008 Celtics, 2013 Heat, 2016 Cavaliers, 2017 Warriors, 2021 Bucks, 2023 Nuggets) with 9–11 players each, one completed `Squad`, the `TRADITIONAL` formation definition, and `teamLogoPath()` in `src/lib/`. Nothing touches the database. Phase 5 renders these; Phase 11's query API must eventually return the same shapes.

Notable decisions and gotchas:

- **Rating band is 0–100**, hand-set and commented as placeholders in both fixture files. Phase 8's rating engine has to normalize into this band, and Phase 5's card design will bake it in visually. Enforced by tests on players, teams, and the squad.
- **Ids are readable slugs, not cuids.** `playerId` is the person slug (`lebron-james`), `playerSeasonId` is `<playerId>-<year>`, `teamSeasonId` is `<teamSlug>-<year>`. A test enforces the `playerSeasonId` derivation so the fixtures can't drift. Production rows stay cuids — nothing downstream may assume either format.
- **Team slug = franchise nickname** (`lakers`, `celtics`, `sixers`, `cavaliers`, `warriors`, `nuggets`, `bulls`, `bucks`, `heat`, `rockets`), chosen over abbreviations because the slug doubles as the logo filename. **The uploaded PNGs must match these names exactly.**
- **Franchise identity is reused across eras** — `lakers` covers 1987 and 2001, `celtics` covers 1986 and 2008 — which is what the real `teamId` will do. A test pins one name+slug per `teamId`.
- **`teamLogo` never appears as a literal.** Every value comes from `teamLogoPath(slug)` in `@/lib/team-logo`, the single home of the `/logos/<slug>.png` convention, reused by Phase 11 when it builds real `DraftTeam` rows. Tests assert `teamLogo === teamLogoPath(teamSlug)` but deliberately do **not** check the filesystem — `public/logos/` holds only a `.gitkeep` and the images are uploaded separately, so the paths 404 until then. Phase 5 needs a graceful fallback for the logo slot.
- **Five real duplicate identities** span two team-seasons each — LeBron (2013 Heat / 2016 Cavs), Ray Allen (2008 / 2013), Robert Horry (1994 / 2001), Sam Cassell (1994 / 2008), Ron Harper (1996 / 2001) — so Phase 16's duplicate guard has genuine cases to block rather than a single contrived one.
- Every team-season can fill all five formation slots on its own, which is a test rather than a convention: the draft is unplayable if an offered team can't cover an open slot.
- The mock squad is cross-checked against the draft pool — each member must exist as an offered player-season with a matching rating and an eligible position — so the two fixtures can't drift apart.
- Bones Hyland was initially listed on the 2023 Nuggets; he was traded to the Clippers at that deadline and wasn't on the playoff roster. Replaced with Reggie Jackson. Worth remembering that "made the playoffs" is a roster-level fact, not a season-level one.

Verified: `npm test` (20 tests across 2 files, non-zero as specced), `tsc --noEmit`, `lint`, `format:check`, and `build` all pass. Not verified: nothing renders these yet — no route consumes `src/data/` until Phase 5, and the logo images don't exist.

Still open: the fixture ratings are placeholders, not engine output, and must never be imported by ingestion or rating code. `DATABASE_URL` is still a placeholder and all three migrations remain unapplied — unchanged by this phase, which never touches Neon.

### Phase 7 (part 1) — Scraper Data Load (Raw CSV Export)

**Phase 7 stays in progress** — this covers the scrape and the header gate only; parsing the raw CSVs into the normalized artifact later phases consume is still outstanding.

Scraped the Basketball-Reference advanced season tables for every season from 1981 to 2026 and committed the raw exports untouched: 46 regular-season and 46 playoff CSVs (~4.7 MB) under `src/data/raw/regular/` and `src/data/raw/playoffs/`. Two scripts ship with them — `scripts/scrape-advanced.mts` (`npm run scrape:advanced`) and `scripts/validate-raw-csv.py` (`npm run validate:raw`). Nothing is parsed, normalized, or written to Neon; Phase 8 consumes these files.

Notable decisions and gotchas:

- **The raw files live at `src/data/raw/`, not root `data/raw/`.** The spec assumed a root `data/` directory that doesn't exist in this tree — `src/data/` is where the Phase 4 fixtures already are, so the scraper output joined them. Both scripts hard-code that path.
- **Split into `regular/` and `playoffs/` subdirectories** rather than one flat folder with a `-playoffs` filename suffix. The suffix is still on the playoff filenames, but the split lets the validator glob two groups directly instead of pattern-matching names, and 92 files in one folder is unreadable.
- **Playwright's actionability checks can't drive the Share & Export menu** — it's hover-only and closes on scroll, so a real click never lands. The scraper dispatches tab-switch, export-button click, and `<pre>` read entirely inside one `page.evaluate()`. This is the one part likely to break when Basketball-Reference changes its markup; the element ids (`advanced_sh` / `advanced_post_sh`, `csv_advanced` / `csv_advanced_post`) are the things to re-check.
- **The exported `<pre>` opens with a citation preamble**, so the writer slices from the first line starting with `Rk,` and errors if there isn't one — a truncated or empty export fails loudly rather than writing a junk file.
- Rerun guard is per file, not per season: a season with a regular CSV but no playoff CSV re-fetches only the missing table. Failures are collected and reported at the end with a non-zero exit instead of aborting the run, so one bad season doesn't cost the rest. 6 s delay between seasons; `npm run scrape:advanced 1995 1999` limits the range.
- **The Phase 9 nullability guess is refuted.** The guess was that advanced metrics would be missing in early-1980s rows. They aren't — PER, WS/48, OBPM, DBPM, BPM and VORP are populated on **every** real player row in all 92 files, 1981 included. The only genuinely blank metric is **TS%**, and only for players with zero shot attempts (6 rows in a typical playoff file, e.g. a 1-minute cameo) — an undefined-ratio problem, not an era problem. So the nullable columns are right, but for a different reason, and G/MP being required holds.
- **Every file carries a trailing `League Average` row** with a blank `Rk`, `Age`, `Team`, `Pos`, `G` and `MP`. Phase 8 must filter it before load or it becomes a phantom player — it is the sole source of blank G/MP in the entire dataset.
- **`players-81-82-playoffs.csv` genuinely has no `GS` column**; 1980-81 and 1982-83 both do (mostly empty). Verified against the live site rather than assumed to be a scrape failure. `GS` isn't in the schema, so the validator whitelists it via `ALLOWED_MISSING` instead of failing the gate forever.
- Header shape otherwise: 30 columns, identical across all 46 regular files and across 45 of 46 playoff files.
- `src/data/raw` is prettier-ignored — the files must stay byte-identical to the site's export. `.playwright-mcp` (MCP session artifacts) is gitignored, and `.mcp.json` registers the Playwright server for the repo.

Verified: `npm run validate:raw` passes (46 + 46 files, 30 columns, one accepted known exception), and `lint`, `format:check`, `test` (20 tests), and `build` all pass. Not verified: the *values* beyond header shape and null-density — no row has been cross-checked against Basketball-Reference by hand, and nothing parses these files yet.

Still open: the parsing step — reading these CSVs into the normalized artifact — which owns the `League Average` filter, the `2TM`/`3TM` combined-row rule, and mapping `Team`/`Pos` strings onto the schema's enums. `DATABASE_URL` is still a placeholder and all three migrations remain unapplied — this phase never touches Neon.

### Phase 7 (part 2) — Parser Data (Raw CSV → Parsed JSON)

**Phase 7 is now complete** and marked `[x]` in `todo.md`. Added `scripts/parse-raw-csv.py` (`npm run parse:raw`), which reads the 46 regular-season CSVs in `src/data/raw/regular/` and writes `src/data/parsed/season_players.json` (keyed by season string, 46 keys) and `src/data/parsed/flattened_players.json` (20,263 player objects, `Season` dropped). Twelve fields are kept and renamed: `Rk→Rank`, `Player→PlayerName`, `Age`, `Team→TeamSlug`, `Pos→Position`, `G→GamesPlayed`, `MP→MinutesPlayed`, `PER→PlayerEfficiencyRating`, `BPM→BoxPlusMinus`, `VORP→ValueOverReplacementPlayer`, `WS/48→WinSharesPer48Min`, `Player-additional→PlayerSlug`. Nothing touches Neon.

Notable decisions and gotchas:

- **The parsed artifacts are gitignored, not committed.** The two JSON files total ~14 MB of purely derived data and regenerate in seconds from the committed raw CSVs. Consequence: **Phase 8 and the later ETL must run `npm run parse:raw` first** — on a fresh clone the files do not exist. `src/data/parsed` is prettier-ignored too.
- **`TeamSlug` is a mixed type by design — string for single-team players, array for traded ones** (2,284 of 20,263 rows). This is what the spec asked for, and it's a footgun for the ETL: iterating a string yields characters. Flagged and kept as specced; normalize to a list at the Phase 10 boundary if it bites.
- **Part 1's "every advanced metric is populated" claim is not quite right.** Three rows across all 46 regular files have blank PER, BPM and WS/48 — Alex Scales (2006), JamesOn Curry (2010), Damion James (2013) — and all three have `MP = 0`. Same undefined-ratio cause as the TS% blanks, not an era gap. The nullable columns hold; **Phase 8's rule for missing metrics should key on `MP = 0`, not on season.**
- **The `League Average` row can't be filtered on a blank slug.** Its `Rk`, `Age`, `Team`, `Pos`, `G` and `MP` are blank, but `Player-additional` is the sentinel `-9999`. The filter matches on `Player == "League Average"` instead. League-average values are dropped entirely — no baseline is carried into the output; Phase 8 computes its own from the parsed rows if it needs one.
- **Traded rows are grouped by consecutive `(Rk, PlayerSlug)` pairs**, not by slug globally — Basketball-Reference always emits the `nTM` total row first, then one row per team in order. Tokens run `2TM` through `5TM` in the real data, so the match is `^\d+TM$`, not a hard-coded pair. Verified against the spec's own example: Trybański 2003-04 → `["PHO","NYK"]` with stats off the `2TM` row.
- **The script self-validates and fails loudly**: missing column (names file + column), an `nTM` total row with no per-team rows, a per-team row count that disagrees with the `nTM` prefix, a duplicate slug across separate groups, or an unparseable number. Errors accumulate and report together with a non-zero exit rather than aborting on the first.
- Season keys come from the filename's two-digit pair with century inference (`80–99 → 19xx`, else `20xx`), so `players-99-00.csv` → `"1999-2000"`.
- Embedded repeated header rows are skipped as specced, though none of the 46 current exports actually contains one — it's a defensive rule, not an observed condition.
- The playoff CSVs are deliberately **not** parsed; the spec scoped this to `regular/` only. No team-season or playoff-participation artifact exists yet — Phases 8 and 10 own that.
- `__pycache__/` is now gitignored (the parser is importable and a test run created one).

Verified: `npm run parse:raw` produces 46 seasons / 20,263 players with one object per `PlayerSlug` and per `Rank` in every season, 2,284 array-valued `TeamSlug` rows (exactly the raw `nTM` row count), no `League Average` row, and byte-identical output across two consecutive runs. Failure paths (missing column, orphan total row, duplicate slug, embedded header, blank→`null`) were exercised against synthetic fixtures. `lint`, `format:check`, `test` (20), `build`, and `validate:raw` all pass. Not verified: the parsed stat *values* against Basketball-Reference beyond the one hand-checked traded player, and no Vitest coverage — the script is Python, and the repo's Vitest suite doesn't reach it.

Still open: nothing consumes the artifacts yet. `DATABASE_URL` is still a placeholder and all three migrations remain unapplied — this phase never touches Neon.
