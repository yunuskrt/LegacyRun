# LegacyRun

🏀 **Draft Legends. Build Your Legacy.**

A browser-based NBA draft & playoff simulation game. Draft a 5-player team from real
historical NBA playoff rosters (1980–2026), then take that team through a playoff
bracket against real historical teams.

## Tech Stack

| Layer      | Choice                                  |
| ---------- | --------------------------------------- |
| Framework  | Next.js (App Router), React, TypeScript |
| Database   | Neon PostgreSQL (the only database)     |
| ORM        | Prisma, via the Neon driver adapter     |
| Styling    | Tailwind CSS v4 + shadcn/ui             |
| Motion     | Motion (Framer Motion)                  |
| Validation | Zod                                     |
| Tests      | Vitest                                  |

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment template and fill in your Neon connection string:

```bash
cp .env.example .env
```

Run the dev server:

```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                      | Purpose                               |
| --------------------------- | ------------------------------------- |
| `npm run dev`               | Start the dev server                  |
| `npm run build`             | Production build                      |
| `npm run start`             | Serve the production build            |
| `npm run lint`              | ESLint                                |
| `npm run format`            | Format with Prettier                  |
| `npm test`                  | Run unit tests                        |
| `npm run db:migrate`        | Create and apply a migration (dev)    |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:status`         | Check migrations are in sync          |
| `npm run db:studio`         | Browse the database in Prisma Studio  |
| `npm run db:generate`       | Regenerate the Prisma client          |

## Project Structure

```text
prisma/            Prisma schema and migrations
scripts/           One-time data ingestion scripts (not a runtime dependency)
src/actions/       Server Actions
src/app/           Routes — / (home), /play/draft, /play/tournament
src/components/    UI components (src/components/ui holds shadcn/ui primitives)
src/generated/     Generated Prisma client (gitignored)
src/lib/           Utilities and the Prisma client singleton
src/types/         Shared domain types
```

## Documentation

Project specs, coding standards, and the phased build plan live in [`context/`](context/).
