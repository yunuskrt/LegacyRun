# LegacyRun — Todo Overview

Quick-reference list of what's being built, in build order. For the detailed, paste-into-Claude-Code version of each phase.

- [x] **Phase 1 — Project Foundation Setup**: initialize the tech stack (Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion, Prisma + Neon) and folder structure.
- [x] **Phase 2 — Core Entity Schema**: players, teams, seasons, rosters, and positions tables.
- [x] **Phase 3 — Ratings & Playoff History Schema**: player-season and team-season rating tables, playoff results.
- [x] **Phase 4 — Mock Dataset**: small hand-built dataset as typed TS fixtures in `src/data/` for local development — no seed script, nothing written to the database.
- [x] **Phase 7 — Basketball-Reference Scraper**: one rerunnable ingestion script covering both rosters/team-seasons and player-season stats — they come off the same source pages, so they are not split. Per-season CSV exports are uploaded by hand into the root `data/raw` folder (raw, untouched, one or more files per season); the script parses them and converts them to normalized JSON, which is the artifact later phases consume. Nothing is written to Neon here.
- [x] **Phase 5 — Draft Page Design (Mock Data)**: **UI only** build and style the `/play/draft` page — team+season card, roster list, formation slots, reroll counter — driven entirely by the `src/data/` mock dataset. Static markup and styling, no interactivity or state.
- [x] **Phase 6 — Draft Mechanics UI (Mock Data)**: make the Phase 5 UI playable against the `src/data/` fixtures — random team+season presentation, position-matched player selection into open formation slots, duplicate-player blocking, the 3-reroll counter, and squad completion. Runtime state only; no database, no queries. The same mechanics at real Neon data will be re-pointed in later phase.
- [x] **Phase 8 — Data Normalization & Rating Engine**: map the Phase 7 JSON onto the Prisma schema's field names and types, then derive **one `overallRating` per player-season and per team-season** — no offensive/defensive split. Ratings are normalized onto a **0–100** scale from the stat features Phase 7 actually yields (G, MP, PER, TS%, WS/48, BPM, VORP), with a documented, reproducible formula and an explicit rule for rows missing advanced metrics (the likely early-1980s gaps). Raw inputs stay in `player_season_data` so a rating can be recomputed without re-ingesting. — done for **player-seasons** (`src/data/rating/season_players.ts`); team-season aggregation is Phase 10.
- [x] **Phase 9 — Type Alignment**: reshape the schema and runtime types around what the scraper actually yields — `slug` as the key for `players`/`teams`, a single `Position` per player-season, `overallRating` → `rating`, unused columns dropped, `updatedAt` gone, with fixtures and draft UI updated to match. Full spec: `context/features/phase-09-type-alignement.md`.
- [ ] **Phase 10 — Team Rating Aggregation & Ingestion Runner**: Neon Setup, .ts files formed for db tables, load validated, rated data into Neon.
- [ ] **Phase 11 — Data Access Layer**: typed query API for draft pool, rosters, eligibility, ratings.
- [ ] **Phase 12 — Game State Management System**: draft/tournament runtime state, duplicate & reroll guards.
- [ ] **Phase 13 — Draft Mechanics (Real Data)**: swap the Phase 6 mock fixtures for the Phase 11 query API — real random playoff team+season presentation, player selection, position matching.
- [ ] **Phase 14 — Team Review & Completion**: review filled roster, confirm team.
- [ ] **Phase 15 — Bracket Generation**: seeded, rating-based bracket with increasing round difficulty.
- [ ] **Phase 16 — Match Simulation Engine: Rating-Based Core**: ⏳ TBD — not yet decided.
- [ ] **Phase 17 — Match Simulation: AI-Assisted Decision Layer**: ⏳ TBD — not yet decided.
- [ ] **Phase 18 — Conference & Tournament Setup**: choose conference, generate that run's bracket.
- [ ] **Phase 19 — Live Bracket UI**: visual bracket, updates after every round.
- [ ] **Phase 20 — Live Scoreboard & Match Presentation**: quarter-by-quarter scoreboard, event feed.
- [ ] **Phase 21 — Simulation Mode & Speed Controls**: Manual/Automatic modes, Slow/Normal/Fast speeds.
- [ ] **Phase 22 — Results & Run Summary**: victory/defeat screen, run recap.
- [ ] **Phase 23 — Player & Team Card Components**: bespoke visual cards used across screens.
- [ ] **Phase 24 — Motion & Transition Polish**: Framer Motion across draft reveals, rounds, score updates.
- [ ] **Phase 25 — Home Screen**: landing page and Start Game CTA.
- [ ] **Phase 26 — AI Commentary (Post-MVP)**: optional, non-authoritative match commentary.
- [ ] **Phase 27 — Production Deployment**: Vercel + Neon production setup, smoke test.
