# Phase 2 — Core Entity Schema (Players, Teams, Seasons, Rosters, Positions)

## Status

Not Started

## Goals

- Add a `Position` enum (`PG`, `SG`, `SF`, `PF`, `C`) to `prisma/schema.prisma`.
- Add the `Player` model to `prisma/schema.prisma` — one row per real person, normalized across every season they played (this identity is what the duplicate-player rule keys on). Stable natural key (e.g. a Basketball-Reference player slug) marked `@unique`, plus display name and any identity-disambiguation fields (birth date, full name).
- Add the `Team` model — franchise-level identity (name, abbreviation, conference), with a `@unique` key that survives relocations/renames.
- Add the `Season` model — one row per NBA season in range (1980–2026), keyed by a `@unique` year, with whatever label field the UI needs (e.g. `"2009-10"`).
- Add the `Roster` model — the team–season–player join, `@@unique([teamId, seasonId, playerId])`, with relations to all three.
- Add the `PlayerPosition` model — primary position (required) + secondary position (optional) **per player-season**, so it hangs off the roster entry, not off `Player`. One row per roster entry (`@@unique` on the roster reference).
- Map every model to the snake_case table names from the spec (`players`, `teams`, `seasons`, `rosters`, `player_positions`) via `@@map`, and snake_case columns via `@map`.
- Add indexes for the access patterns Phase 9 will need: roster lookup by team-season, and player lookup by identity key.
- Generate and commit the migration SQL as `prisma/migrations/<ts>_core_entity_schema/migration.sql`. If a live `DATABASE_URL` is available, `npm run db:migrate` produces and applies it; if not, `npx prisma migrate dev --create-only` writes the SQL without needing a database — applying it is deferred.
- Add shared domain types in `src/types/` only if the app needs a shape the generated Prisma client doesn't already give (re-export rather than re-declare).

## Notes

- Scope: schema + migration for the identity layer only. Ratings, playoff participation, and playoff results are **Phase 3**. No seed data (Phase 4), no scrapers (Phases 5–6), no query API (Phase 9). Nothing in `src/app/` changes.
- Depends on: Phase 1 (Prisma 7 + `@prisma/adapter-neon` wiring, `src/lib/db` singleton).
- **Neon connection is not a blocker for this phase.** A live `DATABASE_URL` is not required — this is a schema-authoring phase, and the schema, generated client, and migration SQL can all be produced offline. Standing up the real database and applying the migration is handled later (Phase 4 seeding is the first step that genuinely needs a live database). Do not stall on connection errors here.
- Constraints:
  - Neon PostgreSQL is the only database. No second store.
  - **Identity normalization is the deliverable here** — 2008 LeBron and 2010 LeBron must resolve to a single `Player` row, because Hard Constraint 6 (a player can be selected once per run, regardless of season) is enforced against this identity later.
  - Positions are per player-season, not per player — a player can be listed at different positions in different years, and Phase 13's position matching reads the season-specific row.
  - Prisma 7: no `url` in the `datasource` block; the CLI reads it from `prisma.config.ts` and runtime uses the Neon driver adapter. Import the client from `@/generated/prisma/client`, always via the `@/lib/db` singleton.
  - Use `prisma migrate dev` — never `db push` (`context/coding-standards.md`).
  - Model/enum names PascalCase; table/column mappings snake_case.
- Verification (all offline — none of these need a live database):
  - `npx prisma validate` and `npm run db:generate` succeed.
  - The generated migration SQL contains all five tables with the expected columns, unique constraints, and foreign keys.
  - `npm run lint`, `npm run format:check`, `npm test`, `npm run build` all pass.
  - Deferred until a database exists: `npm run db:migrate` / `npm run db:status` showing no drift, and `npm run db:studio` rendering the five empty tables.

## History
