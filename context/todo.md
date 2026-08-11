# LegacyRun — Todo Overview

Quick-reference list of what's being built, in build order. For the detailed, paste-into-Claude-Code version of each phase, see `prompts.md`.

- [x] **Phase 1 — Project Foundation Setup**: initialize the tech stack (Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion, Prisma + Neon) and folder structure.
- [x] **Phase 2 — Core Entity Schema**: players, teams, seasons, rosters, and positions tables.
- [ ] **Phase 3 — Ratings & Playoff History Schema**: player-season and team-season rating tables, playoff results.
- [ ] **Phase 4 — Mock Dataset**: small hand-built dataset as typed TS fixtures in `src/data/` for local development — no seed script, nothing written to the database.
- [ ] **Phase 5 — Draft Page Design (Mock Data)**: build and style the `/play/draft` page — team+season card, roster list, formation slots, reroll counter — driven entirely by the `src/data/` mock dataset. Visual/layout work only; real draft logic lands in Phases 13–15.
- [ ] **Phase 6 — Basketball-Reference Scraper: Rosters & Team Seasons**.
- [ ] **Phase 7 — Basketball-Reference Scraper: Player Season Stats**.
- [ ] **Phase 8 — Data Normalization & Rating Engine**: offensive/defensive rating calculators.
- [ ] **Phase 9 — Team Rating Aggregation & Ingestion Runner**: load validated, rated data into Neon.
- [ ] **Phase 10 — Data Access Layer**: typed query API for draft pool, rosters, eligibility, ratings.
- [ ] **Phase 11 — Game State Management System**: draft/tournament runtime state, duplicate & reroll guards.
- [ ] **Phase 12 — Home Screen**: landing page and Start Game CTA.
- [ ] **Phase 13 — Formation Selection**: choose traditional lineup, initialize open slots.
- [ ] **Phase 14 — Draft Mechanics**: random team+season presentation, player selection, position matching.
- [ ] **Phase 15 — Duplicate Prevention & Reroll**: UI for used-player blocking and the 3-reroll system.
- [ ] **Phase 16 — Team Review & Completion**: review filled roster, confirm team.
- [ ] **Phase 17 — Bracket Generation**: seeded, rating-based bracket with increasing round difficulty.
- [ ] **Phase 18 — Match Simulation Engine: Rating-Based Core**: ⏳ TBD — not yet decided.
- [ ] **Phase 19 — Match Simulation: AI-Assisted Decision Layer**: ⏳ TBD — not yet decided.
- [ ] **Phase 20 — Conference & Tournament Setup**: choose conference, generate that run's bracket.
- [ ] **Phase 21 — Live Bracket UI**: visual bracket, updates after every round.
- [ ] **Phase 22 — Live Scoreboard & Match Presentation**: quarter-by-quarter scoreboard, event feed.
- [ ] **Phase 23 — Simulation Mode & Speed Controls**: Manual/Automatic modes, Slow/Normal/Fast speeds.
- [ ] **Phase 24 — Results & Run Summary**: victory/defeat screen, run recap.
- [ ] **Phase 25 — Player & Team Card Components**: bespoke visual cards used across screens.
- [ ] **Phase 26 — Motion & Transition Polish**: Framer Motion across draft reveals, rounds, score updates.
- [ ] **Phase 27 — AI Commentary (Post-MVP)**: optional, non-authoritative match commentary.
- [ ] **Phase 28 — Production Deployment**: Vercel + Neon production setup, smoke test.
