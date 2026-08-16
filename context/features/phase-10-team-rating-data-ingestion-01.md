# Phase 10 - Team Rating Engine & Ingestion Runner (Part 1)

## Overview

Construct one `.ts` file per database table under `src/data/db/`. Each file is the
complete, committed row set for its table — the input the Part 2 ingestion runner
will push to Neon. Nothing in this part touches the database.

The single source of truth is `src/data/rating/season_players.ts`
(`RATED_PLAYER_SEASONS`, 20,260 rows across 46 seasons, 1981–2026).

## Requirements

- Each `.ts` file exports one array of objects representing that table's rows.
- Row objects must match the Prisma model field names and types in
  `prisma/schema.prisma`, and import `Position` / `Conference` from the generated
  client so a bad value is a type error.
- **Do not modify anything in `src/data/parsed/` or `src/data/rating/`** — they are
  read-only inputs here.
- Files are **generated, not hand-authored** (`player_season.ts` alone is 20,260
  rows). Add a TypeScript generator at `scripts/build-db-data.mts`
  (`npm run build:db-data`) that imports `RATED_PLAYER_SEASONS` directly and
  writes all six files. TS rather than Python so it type-checks against the Prisma
  enums and reads the committed `.ts` source instead of the gitignored parsed JSON.
- Commit the generated output. Add the large files to `.prettierignore` and write
  one object per line, as `season_players.ts` does.
- The generator must be deterministic — two runs produce byte-identical files.
- Every validation rule below is enforced **by the generator**, which must fail
  loudly (non-zero exit, accumulated errors) rather than write a bad file.

## Files to be constructed

| Filename                    | DB Model               | Expected rows |
| --------------------------- | ---------------------- | ------------- |
| `player.ts`                 | `Player`               | 3,755         |
| `team.ts`                   | `Team`                 | 40            |
| `team_season.ts`            | `TeamSeason`           | 1,292         |
| `player_season.ts`          | `PlayerSeason`         | 20,260        |
| `player_season_team.ts`     | `PlayerSeasonTeam`     | 22,705        |
| `player_season_data.ts`     | `PlayerSeasonData`     | 20,260        |
| `playoff_participation.ts`  | `PlayoffParticipation` | deferred      |

Row counts are the values measured against the current `season_players.ts`. Treat
them as assertions: if the generator produces a different count, something changed
upstream and the difference must be explained before committing.

## Player - `player.ts`

### Fields

| Field      | Type   |
| ---------- | ------ |
| `slug`     | string |
| `fullName` | string |

### Methodology

1. Iterate over `RATED_PLAYER_SEASONS`.
2. Deduplicate by `PlayerSlug` — one output row per distinct slug, regardless of
   how many seasons that player has. (This is the identity the once-per-run
   duplicate rule is enforced against.)
3. Map `PlayerSlug` → `slug`, `PlayerName` → `fullName`.

No slug in the source carries two different `PlayerName` values, so the first
occurrence is safe to take. The generator must assert this rather than assume it.

### Validation

- Every `slug` is unique.
- `fullName` is a non-empty string on every row.
- Every `PlayerSlug` in the source appears exactly once in the output.

## Team - `team.ts`

### Fields

| Field        | Type         |
| ------------ | ------------ |
| `slug`       | string       |
| `name`       | string       |
| `conference` | `Conference` |

### Methodology

1. Iterate over `RATED_PLAYER_SEASONS`; `TeamSlug` is a `string[]` on every row
   (a traded player lists each team he played for that season).
2. Collect the distinct union of all `TeamSlug` values into a team set — 40 codes.
3. **`slug` is the Basketball-Reference code as-is** (`CHI`, `UTA`, `LAL`) — not a
   franchise nickname.
4. Fill `name` and `conference` per franchise (e.g. `CHI` → `Chicago Bulls` /
   `EAST`). These are hand-authored constants in the generator, not derived data.

The 40 codes include defunct and relocated franchises — `CHH`, `CHA`, `CHO`,
`KCK`, `NJN`, `NOH`, `NOK`, `NOP`, `SDC`, `SEA`, `VAN`, `WSB`. Each is its own
row with its own historical name (`SEA` → `Seattle SuperSonics`), not folded into
its successor.

`Team.conference` is a single field, but franchises have moved between conferences
across realignments. Store the conference the franchise played in during the
seasons it appears under that code; the per-season conference belongs to
`PlayoffParticipation`, not here.

### Validation

- Every `slug` is unique, and the set is exactly the union of `TeamSlug` values in
  the source — no extra rows, none missing.
- `name` is non-empty and `conference` is a valid `Conference` on every row.

## TeamSeason - `team_season.ts`

### Fields

| Field        | Type   |
| ------------ | ------ |
| `id`         | string |
| `teamSlug`   | string |
| `seasonYear` | number |
| `rating`     | number |

### Methodology

1. Group `RATED_PLAYER_SEASONS` by `Season`, then by team, producing a nested
   shape: `{ "1990-1991": { "CHI": [...], "CLE": [...] }, ... }`.
2. A player with multiple `TeamSlug` entries is pushed into **every** one of his
   team arrays — a traded player appears on each team he played for, carrying the
   same season rating.
3. One output row per team array — 1,292 total across 46 seasons.
4. `teamSlug` is the inner key (e.g. `CLE`).
5. `seasonYear` is the outer key's **ending year** as an integer
   (`"1988-1989"` → `1989`).
6. `id` is `` `${teamSlug}-${seasonYear}` `` (e.g. `CLE-1989`).
7. `rating` is computed in three stages:

   **Stage 1 — lineup.** Take the highest-rated player at each of the five
   positions (`PG`, `SG`, `SF`, `PF`, `C`). **If the roster has no player at some
   position**, fill that slot with the highest-rated player not already counted,
   regardless of position. Repeat until five distinct players are selected.

   **Stage 2 — star-weighted aggregate.** Sort the five by rating descending and
   apply weights `0.32 / 0.24 / 0.19 / 0.14 / 0.11`. A flat mean would rank five
   balanced 80s above a 99 plus four 75s, which is the opposite of how the sim
   plays; basketball is star-driven.

   **Stage 3 — normalize onto the band.** Standardize the weighted value over all
   1,292 team-seasons (population mean and standard deviation), then map the
   z-score through a logistic:

   ```
   rating = 35 + 64 / (1 + e^(−1.15 · z))
   ```

   Round to the nearest integer. This is the same normalization shape Phase 8
   applies to players. Without it the output band is simply wherever a five-man
   average happens to fall — 55–87, with no team above 90.

   The floor is 35 rather than 0 because the worst roster in NBA history is still
   an NBA roster; a plain 0–100 logistic rates the 7-59 Bobcats a `1`. The
   logistic (rather than a linear stretch) squashes the tails smoothly, so no
   clipping is needed and outliers cannot exceed the ceiling.

Two team-seasons in the current data trigger the Stage 1 fallback — 2019-20 `LAL`
and 2024-25 `MEM`, both with no listed `SF`. Every roster has at least 11 players,
so five distinct players are always available.

Resulting distribution: range 36–95, median 69, with 61 team-seasons (4.7%) at 90+
and 20 (1.5%) below 40. The three constants are the tuning dials — `1.15` controls
spread, `35`/`99` set the floor and ceiling.

**Scope:** this file covers **all** team-seasons, not only playoff teams. The
`prisma/schema.prisma` comment describing `team_seasons` as a playoff-only
draftable pool does not hold yet — filtering to playoff teams is deferred until
`playoff_participation.ts` exists.

### Validation

- Every `id` is unique.
- No field is empty or null — `rating` included.
- `id` equals `` `${teamSlug}-${seasonYear}` `` on every row (e.g. `UTA-1981` for
  `UTA` / `"1980-1981"`).
- Every `teamSlug` exists as a `slug` in `team.ts`.
- `rating` is an integer inside the 35–99 band, and every row's rating derives
  from exactly five distinct players.
- The distribution actually uses the band — at least one team-season reaches 90+,
  and the spread exceeds 50 points.

## PlayerSeason - `player_season.ts`

### Fields

| Field        | Type       |
| ------------ | ---------- |
| `id`         | string     |
| `playerSlug` | string     |
| `seasonYear` | number     |
| `age`        | number     |
| `position`   | `Position` |
| `rating`     | number     |

### Methodology

1. Iterate over `RATED_PLAYER_SEASONS` — one source row produces exactly one
   output row, including traded players (rated off the combined `2TM`/`3TM` line).
2. `seasonYear` — the ending year of `Season` as an integer
   (`"1980-1981"` → `1981`).
3. `PlayerSlug` → `playerSlug`
4. `Age` → `age`
5. `Position` → `position`
6. `Rating` → `rating`
7. `id` is `` `${playerSlug}-${seasonYear}` ``.

### Validation

- Every `id` is unique.
- No field is empty or null.
- Within a single `seasonYear`, no `playerSlug` repeats.
- `id` equals `` `${playerSlug}-${seasonYear}` `` on every row (e.g.
  `birdla01-1981` for `birdla01` / `"1980-1981"`).
- Every `playerSlug` exists as a `slug` in `player.ts`.
- **`position` is one of the five `Position` enum values.** `RatedPlayerSeason.Position`
  is typed as a plain `string` and nothing in the scrape/parse/rate pipeline
  normalizes it. The raw CSVs contain a bare `F` (Adam Keefe, 1997-98 UTA) that was
  corrected by hand in `season_players.ts`, so re-running `npm run rate:players`
  reintroduces it. This check must be a hard failure, not a coercion.

## PlayerSeasonTeam - `player_season_team.ts`

### Fields

| Field            | Type   |
| ---------------- | ------ |
| `playerSeasonId` | string |
| `teamSeasonId`   | string |

`PlayerSeasonTeam.id` keeps its `@default(cuid())` and is **not** emitted here —
the ingestion runner lets Prisma generate it.

### Methodology

1. Build the same nested season → team → players grouping used by
   `team_season.ts`.
2. Iterate every player in every team array. A traded player yields one row per
   team he played for that season, which is why the row count (22,705) exceeds
   the player-season count (20,260).
3. `playerSeasonId` = `` `${playerSlug}-${seasonYear}` ``
4. `teamSeasonId` = `` `${teamSlug}-${seasonYear}` ``

### Validation

- Every `playerSeasonId` exists as an `id` in `player_season.ts`.
- Every `teamSeasonId` exists as an `id` in `team_season.ts`.
- The `(playerSeasonId, teamSeasonId)` pair is unique.
- Every `id` in `player_season.ts` is referenced by at least one row — no
  orphaned player-season.

## PlayerSeasonData - `player_season_data.ts`

### Fields

| Field                    | Type    |
| ------------------------ | ------- |
| `playerSeasonId`         | string  |
| `rank`                   | number  |
| `gamesPlayed`            | number  |
| `minutesPlayed`          | number  |
| `playerEfficiencyRating` | number? |
| `boxPlusMinus`           | number? |
| `vorp`                   | number? |
| `winSharesPer48`         | number? |

### Methodology

1. Iterate over `RATED_PLAYER_SEASONS` — one source row produces exactly one
   output row.
2. `playerSeasonId` = `` `${playerSlug}-${seasonYear}` ``
3. `Rank` → `rank`
4. `GamesPlayed` → `gamesPlayed`
5. `MinutesPlayed` → `minutesPlayed`
6. `PlayerEfficiencyRating` → `playerEfficiencyRating`
7. `BoxPlusMinus` → `boxPlusMinus`
8. `ValueOverReplacementPlayer` → `vorp`
9. `WinSharesPer48Min` → `winSharesPer48`

The four metric fields are nullable in the schema because a zero-minute row leaves
them blank upstream, but Phase 8 already dropped those three rows — so every row
here should in practice carry all four values.

### Validation

- Every `playerSeasonId` exists as an `id` in `player_season.ts`.
- Every `playerSeasonId` occurs exactly once — the relation is 1:1.
- `rank`, `gamesPlayed`, and `minutesPlayed` are present and numeric on every row.
- Row count equals `player_season.ts` — every player-season has its audit row.

## PlayoffParticipation - `playoff_participation.ts`

- **Deferred** — to be implemented later.
- Create the file with an empty exported array so the ingestion runner has a
  stable import target.
