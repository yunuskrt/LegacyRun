# Current Feature

## Status

Not Started

## Goals

## Notes

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
