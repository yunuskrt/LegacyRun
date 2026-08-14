# LegacyRun — Todo Overview

Quick-reference list of what's being built, in build order. For the detailed, paste-into-Claude-Code version of each phase.

- [x] **Phase 1 — Project Foundation Setup**: initialize the tech stack (Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion, Prisma + Neon) and folder structure.
- [x] **Phase 2 — Core Entity Schema**: players, teams, seasons, rosters, and positions tables.
- [x] **Phase 3 — Ratings & Playoff History Schema**: player-season and team-season rating tables, playoff results.
- [x] **Phase 4 — Mock Dataset**: small hand-built dataset as typed TS fixtures in `src/data/` for local development — no seed script, nothing written to the database.
- [x] **Phase 7 — Basketball-Reference Scraper**: one rerunnable ingestion script covering both rosters/team-seasons and player-season stats — they come off the same source pages, so they are not split. Per-season CSV exports are uploaded by hand into the root `data/raw` folder (raw, untouched, one or more files per season); the script parses them and converts them to normalized JSON, which is the artifact later phases consume. Nothing is written to Neon here.
- [ ] 🟡 **Phase 9 — Type Alignment with Scraped Data**: reconcile the app's data types with the real shapes the Phase 7 scraper produces — update the Prisma schema (fields, nullability, enums), the `src/data/` mock fixtures from Phase 4, and the shared types in `src/types/` so the mock and scraped datasets are structurally identical. Any field the scraper can't reliably supply for 1980–2026 becomes nullable or is dropped. — partially done: schema, migration, `src/types/game.ts`, and the Phase 4 fixtures built against them are in; still needs the nullability guesses confirmed against real scraper output (Phase 7).
- [ ] **Phase 5 — Draft Page Design (Mock Data)**: **UI only** — build and style the `/play/draft` page — team+season card, roster list, formation slots, reroll counter — driven entirely by the `src/data/` mock dataset. Static markup and styling, no interactivity or state.
- [ ] **Phase 6 — Draft Mechanics (Mock Data)**: make the Phase 5 UI playable against the `src/data/` fixtures — random team+season presentation, position-matched player selection into open formation slots, duplicate-player blocking, the 3-reroll counter, and squad completion. Runtime state only; no database, no queries. Phase 15 re-points the same mechanics at real Neon data.
- [ ] **Phase 8 — Data Normalization & Rating Engine**: map the Phase 7 JSON onto the Prisma schema's field names and types, then derive **one `overallRating` per player-season and per team-season** — no offensive/defensive split. Ratings are normalized onto a **0–100** scale from the stat features Phase 7 actually yields (G, MP, PER, TS%, WS/48, BPM/OBPM/DBPM, VORP), with a documented, reproducible formula and an explicit rule for rows missing advanced metrics (the likely early-1980s gaps). Raw inputs stay in `player_season_data` so a rating can be recomputed without re-ingesting.
- [ ] **Phase 10 — Team Rating Aggregation & Ingestion Runner**: load validated, rated data into Neon.
- [ ] **Phase 11 — Data Access Layer**: typed query API for draft pool, rosters, eligibility, ratings.
- [ ] **Phase 12 — Game State Management System**: draft/tournament runtime state, duplicate & reroll guards.
- [ ] **Phase 13 — Home Screen**: landing page and Start Game CTA.
- [ ] **Phase 14 — Formation Selection**: choose traditional lineup, initialize open slots.
- [ ] **Phase 15 — Draft Mechanics (Real Data)**: swap the Phase 6 mock fixtures for the Phase 11 query API — real random playoff team+season presentation, player selection, position matching.
- [ ] **Phase 16 — Duplicate Prevention & Reroll**: UI for used-player blocking and the 3-reroll system.
- [ ] **Phase 17 — Team Review & Completion**: review filled roster, confirm team.
- [ ] **Phase 18 — Bracket Generation**: seeded, rating-based bracket with increasing round difficulty.
- [ ] **Phase 19 — Match Simulation Engine: Rating-Based Core**: ⏳ TBD — not yet decided.
- [ ] **Phase 20 — Match Simulation: AI-Assisted Decision Layer**: ⏳ TBD — not yet decided.
- [ ] **Phase 21 — Conference & Tournament Setup**: choose conference, generate that run's bracket.
- [ ] **Phase 22 — Live Bracket UI**: visual bracket, updates after every round.
- [ ] **Phase 23 — Live Scoreboard & Match Presentation**: quarter-by-quarter scoreboard, event feed.
- [ ] **Phase 24 — Simulation Mode & Speed Controls**: Manual/Automatic modes, Slow/Normal/Fast speeds.
- [ ] **Phase 25 — Results & Run Summary**: victory/defeat screen, run recap.
- [ ] **Phase 26 — Player & Team Card Components**: bespoke visual cards used across screens.
- [ ] **Phase 27 — Motion & Transition Polish**: Framer Motion across draft reveals, rounds, score updates.
- [ ] **Phase 28 — AI Commentary (Post-MVP)**: optional, non-authoritative match commentary.
- [ ] **Phase 29 — Production Deployment**: Vercel + Neon production setup, smoke test.
