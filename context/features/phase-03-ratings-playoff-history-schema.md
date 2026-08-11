# Phase 3 — Ratings & Playoff History Schema

## Status

Not Started

## Goals

- Add a `PlayoffRound` enum to `prisma/schema.prisma` (`MISSED`, `FIRST_ROUND`, `CONFERENCE_SEMIS`, `CONFERENCE_FINALS`, `NBA_FINALS`, `CHAMPION`) — the round a team-season reached, used by the Phase 9 team-rating aggregator and the Phase 17 bracket difficulty curve.
- Add the `PlayerSeasonRating` model — `offensiveRating`, `defensiveRating`, `overallRating` (plus the raw inputs the Phase 8 rating engine needs to keep the numbers reproducible), keyed to a player and a season, `@@unique([playerId, seasonId])`, mapped to `player_season_ratings`.
- Add the `TeamSeasonRating` model — `offensiveRating`, `defensiveRating`, `overallRating` for a team-season, `@@unique([teamId, seasonId])`, mapped to `team_season_ratings`. This is the strength value the bracket generator seeds on.
- Add the `PlayoffParticipation` model — one row per team-season that made the playoffs: `teamId`, `seasonId`, `conference`, `seed`, `roundReached` (`PlayoffRound`), `wins`, `losses`, `@@unique([teamId, seasonId])`, mapped to `playoff_participation`. Membership in this table is what makes a team-season eligible for the draft pool (Hard Constraint: only real playoff team-seasons are ever offered).
- Add the reverse relation fields on the existing `Player`, `Team`, and `Season` models so the new tables are reachable from the identity layer.
- Add indexes for the Phase 10 access patterns: playoff team-seasons by season (random draft-pool pick), playoff team-seasons by conference, ratings lookup by season.
- Map all models to snake_case tables via `@@map` and all columns via `@map`, matching the Phase 2 conventions.
- Generate the migration SQL as `prisma/migrations/<ts>_ratings_playoff_history/migration.sql` and commit it.

## Notes

- Scope: schema + migration only. No seed data (Phase 4), no scrapers (Phases 6–7), no rating formulas (Phase 8), no ingestion runner (Phase 9), no query API (Phase 10). Nothing in `src/app/` changes. These tables ship empty.
- Depends on: Phase 2 (`Player`, `Team`, `Season`, `Roster`, `Position`, `Conference` in `prisma/schema.prisma`).
- **A live Neon connection is not required.** Like Phase 2, this is schema-authoring — `prisma migrate dev` cannot author offline (it needs a shadow DB), so use `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema prisma/schema.prisma --script` against the previous migration state, or the equivalent `--from-migrations prisma/migrations --to-schema prisma/schema.prisma` form. Note Prisma 7 renamed `--to-schema-datamodel` to `--to-schema`; most examples online still show the old flag. Do not stall on connection errors.
- Open decision to make explicitly during implementation, and record it in History:
  - **`PlayerSeasonRating` keys on `(playerId, seasonId)`, not on `Roster`.** A rating describes the person's season, not their stint with one team, so a mid-season trade (two `Roster` rows, one season) still resolves to a single rating. The cost is that the draft screen joins `Roster → Player → PlayerSeasonRating` on `seasonId` rather than reading a rating directly off the roster row. If the ingestion pipeline turns out to produce genuinely per-stint ratings, this is the point to revisit.
  - **Playoff participation and results are one table, not two.** `playoff_results` as a separate model would be strictly 1:1 with participation for MVP purposes — seed, round reached, and W/L are all attributes of the same team-season appearance. Same reasoning that collapsed `player_positions` in Phase 2. Split only if per-series records (opponent, game-by-game) are ever needed, which the MVP scope does not call for.
- Constraints:
  - Neon PostgreSQL is the only database.
  - Ratings are **stored, not computed ad hoc** (Hard Constraint 2) — these columns are the persisted source of truth for the draft pool, bracket generator, and match simulation.
  - Only real playoff team-seasons exist in the pool — `PlayoffParticipation` is the gate, so its uniqueness and conference/seed fields must be non-optional.
  - Ratings must stay reproducible from real stats (Phase 8) — no arbitrary hand-set numbers, and store enough input columns that a rating can be recomputed rather than trusted blindly.
  - Prisma 7: no `url` in the `datasource` block; the CLI reads it from `prisma.config.ts`, runtime uses the `@prisma/adapter-neon` driver adapter. Import the client from `@/generated/prisma/client`, always via the `@/lib/db` singleton.
  - Never `db push` (`context/coding-standards.md`).
  - Model/enum names PascalCase; table/column mappings snake_case.
- Verification (all offline):
  - `npx prisma validate` and `npm run db:generate` succeed.
  - The new migration SQL contains all three tables with the expected columns, unique constraints, foreign keys, and the `PlayoffRound` enum type.
  - `npm run lint`, `npm run format:check`, `npm test`, `npm run build` all pass.
  - Deferred until a real `DATABASE_URL` exists: `npm run db:migrate` / `npm run db:status` showing no drift, and `npm run db:studio` rendering the new empty tables. The Phase 2 migration is also still unapplied — both will run together on first connect.

## History
