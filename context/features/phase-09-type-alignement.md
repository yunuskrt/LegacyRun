# Phase 9 — Type Alignement
 
## Overview

DB schema and runtime gameplay type changes for better architecture & type alignement.

## Requirements

- Every model carries `id String @id @default(cuid())`, `createdAt`, and `updatedAt`. Those are omitted from the field tables below. **Delete `updatedAt` column from each db table**
- Implement the each required modification for db tables listed below
- Do not touch Enums. They are fine
- Implement the each modification for runtime gameplay types listed below

### Enums

#### `Position`

The five traditional formation slots. A `PlayerSeason` holds an unordered array of these, and fits a slot if the slot appears in the array.

`PG` · `SG` · `SF` · `PF` · `C`

#### `Conference`

Which side of the bracket a team-season sits on. Stored per playoff appearance rather than on the franchise, because realignments move teams between conferences.

`EAST` · `WEST`

#### `PlayoffRound`

How far a team got that postseason. `CHAMPION` is its own value rather than `NBA_FINALS` plus a boolean, so round-reached ordering is a single comparable field.

`FIRST_ROUND` · `CONFERENCE_SEMIS` · `CONFERENCE_FINALS` · `NBA_FINALS` · `CHAMPION`

## DB Schemas

### `Player` → `players`

- Delete `birthDate` column
- Remove `id String @id @default(cuid())`. Delete `id` column. `slug` column is unique and should be key

Relations: `playerSeasons: PlayerSeason[]`

### `Team` → `teams`

- Delete `abbreviation` column
- Remove `id String @id @default(cuid())`. Delete `id` column. `slug` column is unique and should be key

Relations: `teamSeasons: TeamSeason[]`, `playoffParticipation: PlayoffParticipation[]`

### `TeamSeason` → `team_seasons`
- Rename `overallRating` column to `rating`
- Reference the `Team` table with its `slug` field. `teamId` -> `Team.slug`

Constraints: unique `(teamId, seasonYear)`; indexed on `seasonYear` and `overallRating`.
Relations: `team: Team`, `playerSeasons: PlayerSeasonTeam[]`

### `PlayerSeason` → `player_seasons`
- Change type of `positions` column from `Position[]` to `Position`
- Rename `overallRating` column to `rating`
- Reference the `Player`table with its `slug` field. `playerId` -> `Player.slug`

Constraints: unique `(playerId, seasonYear)`; indexed on `seasonYear`.
Relations: `player: Player`, `teams: PlayerSeasonTeam[]`, `data: PlayerSeasonData?`

### `PlayerSeasonTeam` → `player_season_teams`

- Fine. Do not Change anything. Except the `updatedAt` column which is told at the beginning.

### `PlayerSeasonData` → `player_season_data`

- Remove `id String @id @default(cuid())`. Delete `id` column `playerSeasonId` column is unique and should be key
- Add `rank` column of type number
- Delete `offensiveBoxPlusMinus` column
- Delete `defensiveBoxPlusMinus` column
- Delete `trueShootingPct` column

### `PlayoffParticipation` → `playoff_participation`

- Keep it as it is for now. Do not touch it. Except the `updatedAt` column which is told at the beginning.

## GamePlay Types (Runtime)

- Some minor changes in runtime types according to db schema
- Modify mock data, used areas in ui accordingly

### `DraftablePlayer`

- Change the type of `positions` field from `Position[]` to `Position`

### `DraftTeam`

- Remove `teamId` field. Replace the usage with `teamSlug`. It is used in `src/lib/draft.ts`

### `SquadMember`

- Rename `playerId` field as `playerSlug`
- Update the used areas of `playerId`

### `Squad`

- Make `name` field optional
- Make `rating`field optional