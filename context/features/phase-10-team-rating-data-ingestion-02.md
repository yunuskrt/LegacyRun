# Phase 10 - Team Rating Engine & Ingestion Runner (Part 2)

## Overview

Set up Prisma ORM with Neon PostgreSQL database.

## Requirements

- Use Neon PostgreSQL (serverless)
- Initial schema based on data models in @prisma/prisma.schema
- Only 1 migration will be made after connecting the database

## Data Ingestion to DB

- Data in the below files will be inserted to the according db tables

| File Path | Schema Model | DB Table |
|---|---|---|
| `@src/data/db/player.ts` | `Player` | `players` |
| `@src/data/db/team.ts` | `Team` | `teams` |
| `@src/data/db/team_season.ts` | `TeamSeason` | `team_seasons` |
| `@src/data/db/player_season.ts` | `PlayerSeason` | `player_seasons` |
| `@src/data/db/player_season_team.ts` | `PlayerSeasonTeam` | `player_season_teams` |
| `@src/data/db/player_season_data.ts` | `PlayerSeasonData` | `player_season_data` |
| `@src/data/db/playoff_participation.ts` | `PlayoffParticipation` | `playoff_participation` |

## References

- Initial data models: `@prisma/prisma.schema`
- Database standards: `@context/coding-standards.md`
- Prisma docs: https://prisma.io/docs (Prisma 7 has breaking changes - fetch latest)

## Notes

We will have a development branch that we work on that will be in DATABASE_URL and then we will have a production branch. So we ALWAYS create migrations and never push directly unless specified.

IMPORTANT! Use Prisma 7, which has some breaking changes. Read the entire upgrade guide at https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7 to get a good idea of the changes.

You can also look at the setup guide here - https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres