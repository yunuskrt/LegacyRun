# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## References

<!-- Spec files, docs, and source files this feature depends on -->

## History

### Phase 1 — Project Foundation Setup

Cleared boilerplate; installed the full stack.

### Phase 2 — Core Entity Schema

Identity layer: Player, Team, Season, Roster.

### Phase 3 — Ratings & Playoff History Schema

Ratings and playoff participation tables.

### Phase 9 (part 1) — Rating & Type Alignment

Schema reshaped around one `overallRating`.

### Phase 4 — Mock Dataset

12 real team-seasons as typed TS fixtures.

### Phase 7 (part 1) — Scraper Data Load (Raw CSV Export)

92 raw Basketball-Reference CSVs, 1981-2026.

### Phase 7 (part 2) — Parser Data (Raw CSV → Parsed JSON)

Parser: 46 CSVs into 20,263 parsed players.

### Phase 5 (part 1) — Draft Page Design (Layout & Theme Scaffolding)

`/play/draft` plus the Dark Trophy Room palette.

### Phase 5 (part 2) — Draft Page Design (Court, Cards & Motion)

Court, roster cards and reroll pool.

### Phase 6 — Draft Mechanics (Mock Data)

Draft playable on fixtures; pure rules, reducer.

### Phase 8 — Data Normalization & Player Rating Engine

20,260 player-seasons rated 0-100, reproducibly.

### Phase 9 (part 2) — Type Alignment

Keyed by slug; one Position per player-season.

### Phase 10 (part 1) — Team Rating Engine & DB Data Files

Team rating engine and the seven db table files.

### Phase 10 (part 1b) — Playoff Participation Data

724 team-level playoff appearances, 1981-2026.

### Phase 10 (part 2) — Neon Setup & Ingestion Runner

Neon migrated and loaded with all 69,036 rows.

### Phase 11 — Data Access Layer

Four GET route handlers over a typed query API.

### Phase 13 — Draft Mechanics (Real Data)

Draft re-pointed at 1,292 team-seasons in Neon.

### Fix — Another Team stays in the same season

Another Team holds the season, varies the club.

### Phase 12 — Squad Confirmation & Run Handoff

Squad confirm dialog and handoff to the tournament.

### Phase 14 — Bracket Generation

Brackets from playoff pedigree, escalating by round.

### Phase 15 — Match Simulation Engine

Best-of-7 simulated possession by possession.

### Phase 16 — Tournament Shell & Bracket UI

Stage machine and the live bracket UI.

### Phase 17 — Match Replay & Live Scoreboard

Replay on a game clock: scoreboard to play-by-play.

### Phase 18 — Modes, Speeds & Series Flow

Three speeds, two modes, skip, and series flow.

### Phase 19 — Results & Run Summary

Result screen, run recap and bracket archive.

### Phase 20 (part 1) — Motion Foundation, Reduced Motion & Route Transition

One motion vocabulary plus the route transition.

### Phase 20 (part 1) — Browser verification pass

Browser-verified part 1 per frame; nothing to fix.

### Phase 20 (part 2) — Draft Screen Motion

Draft screen motion, items 1-7.

### Phase 20 (part 3) — Tournament Bracket Motion

Bracket motion 8-12 and a 44px touch sweep.

### Phase 20 (part 4) — Match Replay Motion

Match replay motion, items 13-18.

### Phase 20 (part 5) — Result Screen Motion

Result screen motion, closing all 24 items.

### Refactor — `src/lib` deduplication

Six duplications collapsed; equivalence proven.

### Refactor — `src/hooks` cleanup

Dead `advance` deleted; tick handler now a switch.

### Refactor — `src/components/draft` cleanup

`resolvePreviewPlayer` out; shared `RatingBadge`.

### Refactor — `src/components/tournament` cleanup

Six crest renderings unified into `TeamCrest`.

### Refactor — `src/app/api` cleanup

Cache headers unified; `force-dynamic` is inert.

### Refactor — `src/app/play` cleanup

Tournament page split; wrong-label defect fixed.

### Cleanup — Orphan Removal, Context Accuracy & Comment Collapse

Orphans removed, comments collapsed, docs corrected.

### Fix — Accessibility Fixes from the UI Review

Reroll labels, a missing `h1`, a readable loss badge.

### Fix — Code Scan Follow-ups

`excludeSeasons` bounded; `teamInitials` tested.

### Feature — Draft Ergonomics & Replay Control Placement

Five rerolls, capped court, click-to-draft.

### Phase 21 — Home Screen

Landing page: hero, counters, rules, ladder, CTA.

### Fix — Skip-in-Automatic, Host-First Scoreboard & Court Card Redesign

Skip chains in Automatic; host team leads the board.

### Feature — Shareable Run Card

Share your run: a vertical PNG card from the URL.

### Fix — Momentum Polarity & Config Guards

Momentum rises for the displayed side; config guards.

### Fix — Public Deploy Hardening

Crests read off disk; routes and renders throttled.

### Fix — Pre-Deploy UI Pass

Six mobile and focus defects closed pre-deploy.

### Chore — Untrack the `src/data` Pipeline Files

`src/data` pipeline files gitignored; build kept green.
