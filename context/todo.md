# LegacyRun — Todo Overview

Quick-reference list of what's being built, in build order. For the detailed, paste-into-Claude-Code version of each phase, see `prompts.md`.

- [ ] **Phase 1 — Project Foundation Setup**: initialize the tech stack (Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion, Prisma + Neon) and folder structure.
- [ ] **Phase 2 — Core Entity Schema**: players, teams, seasons, rosters, and positions tables.
- [ ] **Phase 3 — Ratings & Playoff History Schema**: player-season and team-season rating tables, playoff results.
- [ ] **Phase 4 — Mock/Seed Dataset**: small hand-built dataset + seed script for local development.
- [ ] **Phase 5 — Basketball-Reference Scraper: Rosters & Team Seasons**.
- [ ] **Phase 6 — Basketball-Reference Scraper: Player Season Stats**.
- [ ] **Phase 7 — Data Normalization & Rating Engine**: offensive/defensive rating calculators.
- [ ] **Phase 8 — Team Rating Aggregation & Ingestion Runner**: load validated, rated data into Neon.
- [ ] **Phase 9 — Data Access Layer**: typed query API for draft pool, rosters, eligibility, ratings.
- [ ] **Phase 10 — Game State Management System**: draft/tournament runtime state, duplicate & reroll guards.
- [ ] **Phase 11 — Home Screen**: landing page and Start Game CTA.
- [ ] **Phase 12 — Formation Selection**: choose traditional lineup, initialize open slots.
- [ ] **Phase 13 — Draft Mechanics**: random team+season presentation, player selection, position matching.
- [ ] **Phase 14 — Duplicate Prevention & Reroll**: UI for used-player blocking and the 3-reroll system.
- [ ] **Phase 15 — Team Review & Completion**: review filled roster, confirm team.
- [ ] **Phase 16 — Bracket Generation**: seeded, rating-based bracket with increasing round difficulty.
- [ ] **Phase 17 — Match Simulation Engine: Rating-Based Core**: ⏳ TBD — not yet decided.
- [ ] **Phase 18 — Match Simulation: AI-Assisted Decision Layer**: ⏳ TBD — not yet decided.
- [ ] **Phase 19 — Conference & Tournament Setup**: choose conference, generate that run's bracket.
- [ ] **Phase 20 — Live Bracket UI**: visual bracket, updates after every round.
- [ ] **Phase 21 — Live Scoreboard & Match Presentation**: quarter-by-quarter scoreboard, event feed.
- [ ] **Phase 22 — Simulation Mode & Speed Controls**: Manual/Automatic modes, Slow/Normal/Fast speeds.
- [ ] **Phase 23 — Results & Run Summary**: victory/defeat screen, run recap.
- [ ] **Phase 24 — Player & Team Card Components**: bespoke visual cards used across screens.
- [ ] **Phase 25 — Motion & Transition Polish**: Framer Motion across draft reveals, rounds, score updates.
- [ ] **Phase 26 — AI Commentary (Post-MVP)**: optional, non-authoritative match commentary.
- [ ] **Phase 27 — Production Deployment**: Vercel + Neon production setup, smoke test.
