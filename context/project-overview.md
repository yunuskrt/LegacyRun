## LegacyRun Project Specifications

🏀 **Draft Legends. Build Your Legacy.**

---

## 📌 Core Idea

A browser-based NBA draft & playoff simulation game. The player drafts a **5-player team** from real historical NBA rosters (**1980–2026**, any team+season, playoff or not), then takes that team through a playoff bracket against real historical playoff teams.

Feel: NBA fantasy draft + roguelike decisions + team-building strategy + historical simulation.

> "I built a historical superteam from different eras, survived a difficult playoff bracket, and defeated some of the greatest NBA teams in history."

The player should never just pick the 5 highest-rated players — formation slots, limited rerolls, and the duplicate-player rule force real trade-offs.

---

## 🎮 Game Flow

```text
Home → Start Game → Select Formation → Draft → Team Complete
→ Select Conference → Bracket Generated → Playoff Round → Match Simulation
→ Next Round → Conference Finals → NBA Finals → Victory / Defeat
```

---

## ✨ Core Features

### A) Team Building & Formation

- **MVP formation: traditional positional lineup** — PG / SG / SF / PF / C. Simplest to validate against historical rosters, universally understood, no gameplay complexity cost.
- Post-MVP roadmap: unlockable alternate formations (e.g. a "Twin Towers" slot swap, or a flexible/positionless lineup where a slot accepts a role range instead of one fixed position) for replayability.
- Every slot must eventually be filled; a filled slot can't be selected again. Formation shapes draft strategy — the player can't draft five point guards.

### B) Draft Mechanics

- Player is repeatedly shown a random real historical **team + season** (e.g. "2010 Cleveland Cavaliers") and picks one eligible player from that roster for an open slot.
- **Duplicate rule:** a player (identity normalized across all their seasons — 2008 LeBron and 2010 LeBron are the same person) can be selected only once per run.
- **Reroll/skip system:** a single unified **"Reroll"** action (3 per run) that swaps the current team+season for a new one — simpler than three separately named actions with a shared pool, and trivially satisfies "never exceed 3 combined" since there's only one action type. Always visible as a remaining count.
- Position matching: primary + optional secondary position per player-season; a player must fit an open formation slot to be selectable.

### C) Historical Data Pool

- **The draft pool is every real team+season, playoff or not** — all 1,292 of them. A player may be drafted off a team that missed the playoffs that year; rosters come from regular-season membership (`player_season_teams`).
- **`playoff_participation` is for the tournament only** — it defines the bracket's real historical opponents, their conference, seed, and how far they went. It never filters what the draft offers.
- **Every team-season covers all five positions** — all 1,292 list at least one PG, SG, SF, PF, and C, so any offered roster can fill any open slot. A data change that breaks this makes some draft rounds unplayable.
- Every player-season and team-season carries a reproducible strength rating (not an arbitrary number) — see Data Architecture below.

### D) Tournament

- After team completion, player chooses **Eastern or Western Conference** (kept balanced — not one objectively stronger path).
- **Bracket generation: algorithm-only** — team-strength ratings + seeded randomized bracket, difficulty increasing round over round (Round 1 → moderate, ... → NBA Finals → elite), with enough randomness to stay replayable. No LLM decides matchups or difficulty — this is a hard constraint from the source spec (reproducibility, cost, testability).
- Visible bracket UI, updates after every completed round; player always sees who they beat, who's next, and how far the Finals are.

### E) Match Simulation

- Result comes from a **deterministic/probabilistic simulation engine**, not an LLM — inputs: player ratings, lineup rating, position matchups, offense/defense strength, randomness. Stronger teams win more often; upsets stay possible.
- Layered: Game → Quarter → Possessions → Events → Score, presented as a live-feeling scoreboard (not just a final number).
- **Manual mode:** win → click to continue, loss → run ends. **Automatic mode:** win → auto-advances, loss → stops. Switchable anytime.
- **Slow / Normal / Fast** speeds control presentation pacing only — never the actual result.
- Optional AI-generated commentary may describe simulation facts (e.g. "LeBron scored 12 of his 31 in the 4th") but must never alter or invent stats.

---

## 🗄️ Data Architecture

**Neon PostgreSQL is the single database** — no second database, no Redis/Mongo/SQLite-in-prod. External sources are for one-time controlled ingestion only; the app never scrapes or calls an LLM at runtime for core data.

```text
External Sources → Normalize → Validate → Generate Ratings → Neon PostgreSQL → Next.js → Browser
```

**Persistent (Neon):** players, teams, seasons, rosters, player positions, player-season ratings, team-season ratings, playoff participation/results.
**Runtime only (app state, not persisted unless there's a concrete need):** current draft, used player IDs, rerolls remaining, selected formation/conference, bracket state, current match, sim mode/speed.

### Recommended historical data sources (1980–2026)

| Source                                                                                                                                                                                                                           | Role                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Kaggle "NBA Database"** ([wyattowalsh/basketball](https://www.kaggle.com/datasets/wyattowalsh/basketball)) — daily-updated SQLite dump covering 1946–47 to present: teams, players, games, box scores, playoff picture, awards | **Primary** one-time bulk import into Neon                                               |
| **nba_api** ([swar/nba_api](https://github.com/swar/nba_api), MIT) — Python wrapper around stats.nba.com, 200+ endpoints incl. playoff rosters/stats                                                                             | Gap-filling & refresh on top of the snapshot, ingestion-time only                        |
| **Basketball-Reference** — the authoritative archive most datasets above derive from                                                                                                                                             | Manual spot-checking only — never scraped automatically (ToS + no-runtime-scraping rule) |
| AI model (ChatGPT/Claude/Gemini)                                                                                                                                                                                                 | **Not used as a data source** — never the source of truth for rosters/stats              |

Player-season and team-season ratings should be derived from real stats available consistently from 1980 onward (regular/playoff stats, advanced metrics, awards, team success) — simplest system that stays credible, not an arbitrary hand-set number.

---

## 🧱 Tech Stack

| Category           | Choice                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js (App Router), React                                                                                                                                                                                               |
| Language           | TypeScript                                                                                                                                                                                                                |
| Database           | Neon PostgreSQL — **only** database                                                                                                                                                                                       |
| ORM                | **Prisma** — single declarative `schema.prisma`, generated type-safe client, first-class migrations (`prisma migrate`) and a built-in data browser (`prisma studio`) for eyeballing ingested historical data              |
| State              | React state + Context/useReducer for game flow; **no Zustand** — this game's state isn't complex/global enough to justify the dependency                                                                                  |
| Data ingestion     | One-time Node/Python scripts (Kaggle dump + nba_api) → Neon; rerunnable, not a runtime dependency                                                                                                                         |
| AI usage           | Optional and **non-authoritative**: bracket flavor text, post-match commentary. Never determines matchups, ratings, or results                                                                                            |
| Styling/CSS        | **Tailwind CSS + shadcn/ui** (Radix primitives, unstyled by default, lives in-repo) — best fit for a custom dark/premium look without fighting a themed component library; also keeps consistency with the DevVault stack |
| UI components      | shadcn/ui for scaffolding (dialogs, tabs, badges, sliders, progress, toasts); bespoke Tailwind/SVG for the signature pieces — player cards, team cards, bracket lines — since no library ships those                      |
| Motion/transitions | **Framer Motion** for draft reveals, round advancement, and score updates — standard pairing with this stack, matters more here given the "immersive" goal                                                                |
| Deployment         | Not critical to lock in yet; Vercel is the natural fit for Next.js + Neon if/when it comes up                                                                                                                             |

---

## 🧭 Route Architecture

```text
/               Home — explains the game, rules, Start Game CTA
/play/draft     Formation select → Draft → Team review
/play/tournament Conference select → Bracket → Match simulation → Results
```

Two routes, not five+: keeps the live simulation and bracket experience continuous within a phase (no mid-animation route jumps), while still giving clean browser history/deep-linking between "building your team" and "competing with it."

---

## 🎯 MVP Scope

- **Data:** historical teams/rosters/positions (all team-seasons), player- and team-season ratings, and playoff participation for the bracket (1980–2026)
- **Game:** formation select, draft w/ 3 rerolls, duplicate-player prevention, team completion, conference select, tournament, match simulation, manual/automatic modes, 3 speeds, live bracket, win/loss result
- **UI:** Home, Draft, Team, Bracket, Simulation, Results
- **Postponed:** AI commentary, advanced animation, accounts, leaderboards, multiplayer, deep statistics

---

## 🔒 Hard Constraints

1. Neon PostgreSQL is the only database — no second DB, ever.
2. Player-season and team-season ratings are stored in Neon, not computed ad hoc.
3. No LLM as the source of truth for historical NBA data.
4. No LLM determines core game logic — tournament brackets or match results.
5. No scraping of external sites during normal gameplay; external sources are for controlled, offline ingestion only.
6. A player can be selected once per run, regardless of season (identity normalized).
7. Exactly 3 total reroll/skip opportunities per run.
8. Exactly a 5-player team, respecting the selected formation's slots.
9. Match results are probabilistic — stronger teams win more often, but upsets must stay possible.
10. Simulation speed changes presentation pacing only, never the result.
11. Manual and Automatic simulation modes must be switchable at any time.
12. The bracket must be visible and update after every round.
13. Avoid unnecessary infrastructure and over-engineering — this is a small/medium-sized project.

---

## 📌 Status

- **Playable end to end — 20 of 23 phases complete.** Draft, squad confirmation, bracket, match simulation and the result screen all work against real data; see `todo.md` for the phase list and `current-feature.md` for the build history.
- **Data is ingested and frozen.** Neon holds 69,036 rows across seven tables, loaded from the committed files under `src/data/`. Both are locked — see the 🔒 section in `CLAUDE.md` before running anything that writes to the database or regenerates that data.
- **Remaining:** Phase 21 home screen, Phase 22 AI commentary (post-MVP), Phase 23 production deployment. Nothing has been promoted to a Neon production branch yet.

---

🏀 **LegacyRun — Draft Legends. Build Your Legacy.**
