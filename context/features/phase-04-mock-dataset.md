# Phase 4 — Mock Dataset

## Status

Not Started

## Goals

- Add `src/data/mock-draft-teams.ts` — a hand-built `DraftTeam[]` (typed against `@/types/game`, exported as a `SCREAMING_SNAKE_CASE` const) covering roughly 8–12 real playoff team-seasons spread across the eras (early-80s, 90s, 2000s, 2010s, 2020s) and both conferences, each with 8–14 `DraftablePlayer` entries whose `positions` collectively cover all five `Position` values.
- Add `src/data/mock-squad.ts` — one completed `Squad` (five `SquadMember`s, one per formation slot, `formation: "TRADITIONAL"`) for building and styling the team-review UI in Phase 5.
- Add `src/data/formations.ts` — the `TRADITIONAL` formation definition (`FormationId` → ordered `Position[]` slots) so the draft UI and the mock squad read slot order from one place rather than hardcoding `PG/SG/SF/PF/C`.
- Add `src/lib/team-logo.ts` — `teamLogoPath(slug: string): string` returning `/logos/<slug>.png`, the single place the logo convention lives. The fixtures call it rather than hardcoding paths, and Phase 11's data access layer reuses it when building real `DraftTeam` rows.
- Create `public/logos/` (with a `.gitkeep`) as the home for the team logo PNGs — **the actual PNG files are uploaded separately and are not part of this phase**, so the referenced paths will 404 until then.
- Add `src/data/index.ts` re-exporting the fixtures, so consumers import from `@/data` rather than reaching into individual files.
- Add `src/data/mock-draft-teams.test.ts` — fixture-integrity tests: unique `playerSeasonId`s within a team and unique `teamSeasonId`s across teams, one `playerId` per real person reused consistently where the same player appears in multiple team-seasons, `positions` non-empty, ratings inside the agreed 0–100 band, `seasonYear` within 1980–2026, every formation slot fillable from every team.
- Add `src/data/mock-squad.test.ts` — the mock squad has exactly `SQUAD_SIZE` members, one per `TRADITIONAL` slot, no duplicate `playerId`, and every member's `position` is a slot in the formation.
- Cover `teamLogoPath` in the fixture tests: every fixture `teamLogo` equals `teamLogoPath(teamSlug)` (catches hand-written paths drifting from the convention). Do **not** assert the file exists on disk — the PNGs land later.

## Notes

- Scope: typed TS fixtures only. **No seed script, no Prisma writes, nothing touches the database** — the fixtures exist so Phase 5 can build `/play/draft` before the scrapers (Phases 6–7) and ingestion runner (Phase 10) exist. No UI in this phase; no changes to `prisma/schema.prisma` or `src/types/game.ts`.
- Depends on: Phase 9 part 1 (`src/types/game.ts` — `DraftTeam`, `DraftablePlayer`, `Squad`, `SquadMember`, `FormationId`, `SQUAD_SIZE`) and the current `prisma/schema.prisma` shape.
- Feeds: Phase 5 (draft page design) consumes these directly; Phase 11's data access layer must eventually return the *same* shapes, so the fixtures double as the contract the real queries are held to.
- Open decisions to make explicitly during implementation, and record in History:
  - **Rating scale.** `overallRating` is a `Float` in the schema with no stated range. Pick the band here (0–100 is the natural choice for the UI) and write it down — Phase 8's rating engine has to normalize into whatever this picks, and Phase 5's card design will bake it in visually.
  - **ID format.** Real rows use cuids. Fixtures should use readable, stable, deterministic ids (`"lebron-james"`, `"cle-2010"`, `"lebron-james-2010"`) rather than fake cuids — the shapes are `string` either way, and readable ids make the Phase 5 UI debuggable. Note the divergence from production ids so nothing later assumes cuid formatting.
  - **`teamLogo` is settled: logos are stored in the project, not fetched.** PNG files live in `public/logos/` and are referenced as `/logos/<team-slug>.png`. Every `teamLogo` value — in `mock-draft-teams.ts` and `mock-squad.ts` — must come from `teamLogoPath(slug)` in `@/lib/team-logo`, never a literal string, so the convention changes in one place. The PNGs themselves are uploaded later; the paths are correct now, the images just aren't there yet. Team slugs therefore double as logo filenames — keep them stable, lowercase, and hyphenated (`cavaliers` / `lakers`, or the abbreviation form, but pick one convention and apply it to every fixture team).
  - **How much realism to spend.** Names, teams, seasons, and positions should be real (they're the point); ratings are hand-set placeholders and must be commented as such so no one mistakes them for engine output.
- Constraints:
  - Hard Constraint: only real playoff team-seasons — every fixture team-season must be one that actually made the playoffs. No invented franchises or non-playoff years.
  - Hard Constraint 6: a player is once-per-run by identity. Include at least one player appearing in two different fixture team-seasons under the same `playerId` so Phase 16's duplicate guard has something real to block.
  - Hard Constraint 8: exactly five slots — `mock-squad.ts` must be exactly `SQUAD_SIZE`.
  - Ratings here are hand-set fixtures for local development only; they are **not** a substitute for stored, engine-derived ratings (Hard Constraint 2) and must never be imported by ingestion or rating code.
  - `context/coding-standards.md`: strict TS, no `any`; `@/` alias for all internal imports; no block comments — short `//` lines only where a non-obvious rule needs stating; constants `SCREAMING_SNAKE_CASE`; kebab-case filenames; tests colocated as `*.test.ts`, run in Node with no network or database.
  - Type the fixtures with `satisfies`/explicit annotations so a later change to `src/types/game.ts` breaks the fixtures loudly (that is exactly the failure Phase 9's remaining work is looking for).
- Verification:
  - `npm test` passes, and the new fixture tests actually run (the repo currently uses `--passWithNoTests` — confirm the count is non-zero).
  - `npx tsc --noEmit` / `npm run build` type-check the fixtures against `src/types/game.ts` with no errors.
  - `npm run lint` and `npm run format:check` pass.
  - Nothing to verify in the browser this phase — no route renders the fixtures until Phase 5. Expect broken logo images in Phase 5 until the PNGs are added to `public/logos/`; that's the known state, not a bug, and Phase 5 should give the logo slot a graceful fallback.

  ## References

- src/types/game.ts