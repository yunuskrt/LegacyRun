# LegacyRun — Feature Build Plan

🏀 Draft Legends. Build Your Legacy.

Each phase below is a **self-contained feature**, sized to paste directly into Claude Code as one task.
Order follows the original build sequence (foundation → data → core systems → UI/gameplay → polish → deployment).

---

## Phase 1 — Project Foundation Setup

Initialize the full app skeleton in one pass: Next.js (App Router) + TypeScript in strict mode, Tailwind CSS, shadcn/ui with a dark/premium base theme, Framer Motion, and Prisma ORM wired to a Neon Postgres connection via env var (`schema.prisma` datasource + a singleton `PrismaClient` in `/lib/db`, guarded against hot-reload duplication in dev). Set up the folder structure (`/app`, `/lib`, `/prisma`, `/components`, `/scripts`), ESLint/Prettier, and a `.env.example` covering `DATABASE_URL` plus scraper config (user-agent, rate-limit). Outcome: a running "hello world" app with the full stack connected and no unused scaffolding.

---

## Phase 2 — Core Entity Schema (Players, Teams, Seasons, Rosters, Positions)

Define the Prisma models + Neon migration for the identity layer of the game: `players` (normalized identity — one row per real person across all their seasons), `teams`, `seasons`, `rosters` (team–season–player join), and `player_positions` (primary + optional secondary position per player-season). This is the foundation every other data feature builds on — get identity normalization right here, since the duplicate-player rule depends on it later.

---

## Phase 3 — Ratings & Playoff History Schema

Define the Prisma models + migration for `player_season_ratings` (offensive_rating, defensive_rating, overall), `team_season_ratings`, and `playoff_participation`/`playoff_results`. These tables are populated later by the ingestion pipeline (Phases 6–7) and consumed by the draft pool, bracket generator, and match simulation.

---

## Phase 4 — Mock/Seed Dataset Feature

Build a hand-authored seed dataset — roughly 5 team-seasons and 30 players — that fully covers all 5 traditional formation slots and includes at least one deliberate duplicate-identity case (same player, two seasons) so the duplicate rule can be tested. Write a seed script (`npm run db:seed`) that inserts this into Neon via the Phase 2/3 schema. This unblocks UI and game-logic development before real ingestion is ready.

---

## Phase 5 — Basketball-Reference Scraper: Rosters & Team Seasons

Build a one-time, rerunnable scraper that pulls team/season roster pages from basketball-reference.com for playoff teams only (1980–2026). Respect robots.txt, rate-limit requests, and cache raw HTML locally so pages are never re-fetched unnecessarily. Output raw structured roster data ready for normalization — do not write to Neon yet.

---

## Phase 6 — Basketball-Reference Scraper: Player Season Stats

Build a companion scraper that pulls individual player-season stat pages (box score + advanced stats) for every player identified in Phase 5's rosters. Same caching/rate-limit discipline applies. Output raw per-player-season stat records ready for the rating engine.

---

## Phase 7 — Data Normalization & Rating Engine

Build the normalizer that maps scraped fields (Phases 5–6) onto the internal schema's field names/types, plus the rating engine itself: an offensive-rating calculator and a defensive-rating calculator, each derived from real, consistently-available stats (points, TS%, usage, assists / DRB, STL, BLK, defensive box plus-minus, etc.). Document both formulas in `/docs/ratings.md` so ratings are reproducible, not arbitrary.

---

## Phase 8 — Team Rating Aggregation & Ingestion Runner

Build the team-season rating aggregator (roster ratings + playoff success), a validation step (schema conformance against Phase 2/3 schema, duplicate detection, missing-data flags), and the ingestion runner that loads validated, rated data into Neon. Produce a run report (rows inserted/skipped/errored). This is the final step of the ingestion pipeline — after this phase, the real historical dataset is live in the database.

---

## Phase 9 — Data Access Layer (Query API)

Build a typed query module (`/lib/db/queries.ts`) exposing everything the game needs to read: a random real playoff team-season (draft pool source), full roster for a given team-season, player eligibility for an open formation slot, duplicate-player status check (identity-normalized, scoped to the current run), and combined team/player-season ratings for simulation. Every later gameplay feature consumes this layer instead of using the Prisma client directly.

---

## Phase 10 — Game State Management System

Build the game's runtime state system: React Context + useReducer covering draft state, rerolls remaining, selected formation/conference, bracket state, current match, and sim mode/speed — all in-memory only, never persisted, per the spec. Implement the actions (`selectFormation`, `draftPlayer`, `rerollTeamSeason`, `completeTeam`, `selectConference`, `advanceRound`, `setSimMode`, `setSimSpeed`) along with the two hard-rule guards baked into the reducer: duplicate-player prevention and the 3-reroll cap.

---

## Phase 11 — Home Screen Feature

Build the landing page (`/`): hero section, plain-language explanation of the game and its rules, and a "Start Game" CTA that routes into `/play/draft`. This is the player's first impression — should set tone for the "historical superteam" fantasy.

---

## Phase 12 — Formation Selection Feature

Build the formation-select screen at the start of `/play/draft`. For MVP, only the traditional lineup (PG/SG/SF/PF/C) is offered. Selecting a formation initializes the 5 open slots in game state (Phase 10) that the draft screen will fill.

---

## Phase 13 — Draft Mechanics Feature

Build the core draft loop: on each turn, present a random real historical team+season pulled from the data layer (Phase 9), show its roster, and let the player pick one eligible player for the currently open slot. Enforce position matching (primary or secondary must fit the open slot) at selection time, wired into game state (Phase 10).

---

## Phase 14 — Duplicate Prevention & Reroll Feature

Build the UI and logic layer on top of the draft mechanics (Phase 13): visually disable/grey out players already used this run (duplicate rule), and add the single unified Reroll action with a visible remaining-count indicator, capped at 3 total per run. Both rules are already guarded in the Phase 10 reducer — this phase is the UI/UX layer that surfaces them clearly to the player.

---

## Phase 15 — Team Review & Completion Feature

Build the team-review screen shown once all 5 slots are filled: display the completed roster as player cards by slot, let the player confirm, and transition into the tournament flow. This is the natural checkpoint between "building your team" and "competing with it."

---

## Phase 16 — Bracket Generation Feature

Build the tournament bracket generator: a seeded RNG utility (reproducible given a seed), a bracket-seeding function driven by team-strength ratings, a round-by-round difficulty curve (Round 1 moderate → NBA Finals elite), and a conference-balance check so East and West stay comparably difficult. **Hard constraint: algorithm only — no LLM decides matchups or difficulty.** Include unit tests proving determinism given a fixed seed.

---

## Phase 17 — Match Simulation Engine: Rating-Based Core (⏳ TBD — not yet decided)

**Status: undecided — do not build yet.** Original plan: a deterministic/probabilistic simulation core — possession-level event generation (scoring plays, turnovers, rebounds) driven by player ratings, lineup rating, position matchups, and offense/defense strength; aggregate possessions → quarters → game → final score, with win probability favoring the stronger team without making upsets impossible. Holding this open until the approach vs. Phase 18 is settled, since the two are alternative (or possibly complementary) designs for the same system. Downstream phases (21–22, live scoreboard and mode/speed controls) consume whichever engine is eventually chosen here.

---

## Phase 18 — Match Simulation: AI-Assisted Decision Layer (⏳ TBD — not yet decided)

**Status: undecided — do not build yet.** Idea under consideration: let an AI model influence in-simulation decisions (e.g. play-calling, substitution patterns) rather than pure rating-based probability. Flag before starting: this would conflict with the project's existing hard constraint that no LLM determines match results, so it needs a deliberate decision (and likely a spec update) before any code is written.

---

## Phase 19 — Conference & Tournament Setup Feature

Build the conference-select screen at the start of `/play/tournament`: player chooses Eastern or Western Conference, which feeds into the Phase 16 bracket generator to produce that run's bracket.

---

## Phase 20 — Live Bracket UI Feature

Build the visible bracket component: shows the full tournament tree, updates after every completed round, and always makes clear who the player beat, who's next, and how far the Finals are. Bespoke SVG/Tailwind component (no off-the-shelf bracket library fits this look).

---

## Phase 21 — Live Scoreboard & Match Presentation Feature

Build the live-feeling match presentation: a scoreboard that updates quarter-by-quarter with an event feed (not just a final score dump), driven by Phase 17's simulation output. This is what makes a simulated result feel like a game being played rather than a dice roll.

---

## Phase 22 — Simulation Mode & Speed Controls Feature

Build the Manual/Automatic mode toggle (Manual: click-to-continue on win, run ends on loss / Automatic: auto-advances on win, stops on loss — switchable anytime) and the Slow/Normal/Fast speed control. Speed affects presentation pacing only — never the underlying result from Phase 17.

---

## Phase 23 — Results & Run Summary Feature

Build the Victory/Defeat results screen: final outcome, summary of the run (teams beaten, path through the bracket), and a way to start a new run.

---

## Phase 24 — Player & Team Card Components Feature

Build the bespoke `PlayerCard` and `TeamCard` visual components used throughout draft, review, bracket, and results screens — these carry a lot of the game's visual identity and aren't covered by shadcn/ui's generic primitives.

---

## Phase 25 — Motion & Transition Polish Feature

Apply Framer Motion across the key "feel" moments: draft reveals, round advancement, and score updates. This directly serves the "immersive" goal called out in the spec — worth treating as its own feature pass rather than bolting on ad hoc as each screen is built.

---

## Phase 26 — AI Commentary Feature (Post-MVP)

Build optional, non-authoritative AI commentary describing simulation facts (e.g. "LeBron scored 12 of his 31 in the 4th") after each match, with a settings toggle. Hard guardrail: commentary may only describe stats already produced by Phase 17 — it can never alter or invent them.

---

## Phase 27 — Production Deployment Feature

Configure the Vercel project and environment variables, connect the Neon production database, set up preview deployments per PR, and run a full smoke test of the entire flow (home → draft → tournament → results) in production.
