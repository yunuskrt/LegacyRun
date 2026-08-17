# LegacyRun

A browser-based NBA draft & playoff simulation game.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md
- @context/AGENTS.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`

## 🔒 Locked: database writes and data regeneration

As of Phase 10, the Neon development branch is fully ingested — 69,036 rows across the seven tables — and the committed files under `src/data/` are the source of truth for what it holds. **Both are frozen.** Promoting this data to the production branch happens later, by hand, and is not an agent task.

**Never run these without explicit, in-the-moment permission. Do not run them as a "verification step", to fix a failing test, or because a task seems to imply them.**

Schema and data writes:

- `npx prisma migrate deploy` / `npm run db:migrate:deploy`
- `npx prisma migrate dev` / `npm run db:migrate` — also rewrites migration history
- `npx prisma db push`, `npx prisma db execute`, `npx prisma migrate reset`
- `npm run db:ingest` — clears every table before loading

Data regeneration (rewrites committed files that the database was loaded from):

- `npm run build:db-data`, `npm run rate:players`, `npm run parse:raw`, `npm run scrape:advanced`

Read-only and always allowed: `npm run db:status`, `npm run db:generate`, `npm run db:studio`, `npx prisma validate`, and any query through `@/lib/db`.

If a task appears to require a locked command, stop and say so instead of running it.

**IMPORTANT:** Do not add Claude to any commit messages
