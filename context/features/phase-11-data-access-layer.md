# Phase 11 — Data Access Layer

## Overview

The first code in `src/` that reads from Neon. Ships a typed query API over the ingested data plus four route handlers that serve the draft board, so Phase 13 can swap the `src/data/` fixtures for real data without touching the draft UI or its reducer.

Scope is **draft selection only** — the four buttons already on `/play/draft`: `Get Random Team`, `Another Team`, `Another Season`, `Skip Round`. Tournament, bracket, and simulation endpoints are out of scope.

## Requirements

- The draft pool is **every team-season, playoff or not** — all 1,292 rows of `team_seasons`, offered with equal probability. A player may be drafted off a team that missed the playoffs that year.
- **`playoff_participation` is never read by this phase.** It exists for bracket generation only.
- Rosters come from regular-season membership (`player_season_teams`). A traded player legitimately appears on both of his teams' boards that season.
- All four endpoints return the existing `DraftTeam` runtime type from `src/types/game.ts` — no new response shape, no schema change, no migration.
- Query logic lives in `src/lib/db/`; route handlers stay thin (parse → call → wrap).
- Always import the shared client from `@/lib/db`. Never construct a `PrismaClient`.

## Endpoints

| # | Method | Endpoint | Triggered by | Purpose |
| --- | --- | --- | --- | --- |
| 1 | `GET` | `/api/draft/team` | `Get Random Team`, `Skip Round` | Draw one random team-season from all 1,292 with its full roster. Opens each draft round. |
| 2 | `GET` | `/api/draft/team?mode=another-team&exclude=<teamSeasonId>` | `Another Team` | Draw a random team-season from a **different franchise** than the one on the board. |
| 3 | `GET` | `/api/draft/team?mode=another-season&exclude=<teamSeasonId>` | `Another Season` | Draw a **different season of the same franchise**. |
| 4 | `GET` | `/api/draft/team/[teamSeasonId]` | Not a button — refresh recovery, deep links, tests | Deterministic fetch of one specific team-season. |

`Skip Round` is endpoint 1 with no extra parameter — it differs from `Get Random Team` only in costing a reroll, which is client state.

### Query parameters

| Param | Applies to | Required | Meaning |
| --- | --- | --- | --- |
| `mode` | 1–3 | **no** | `random` (default) · `another-team` · `another-season`. Omitting it is identical to `mode=random`. |
| `exclude` | 2, 3 | yes for both | The `teamSeasonId` currently on the board — the anchor the filter works against. |
| `excludeSeasons` | 1 | no | Comma-separated `teamSeasonId`s already offered this run, so `Skip Round` doesn't hand back what was just skipped. |

`teamSeasonId` is the deterministic `{teamSlug}-{seasonYear}` id (`CHI-1996`), not a cuid.

### Responses

```
200  { success: true, data: DraftTeam }
400  { success: false, error: "INVALID_REQUEST" }    // Zod rejection, e.g. mode=another-team with no exclude
404  { success: false, error: "NO_ELIGIBLE_TEAM" }   // Another Season on a single-season franchise; unknown teamSeasonId on #4
500  { success: false, error: "QUERY_FAILED" }
```

- Validate `mode`, `exclude`, `excludeSeasons`, and the `teamSeasonId` route segment with Zod. An unknown `mode` value is a `400`, not a silent fallback to random.
- A parameter that doesn't apply to the given `mode` is also a `400` — `exclude` on `random`, `excludeSeasons` on the anchored modes. Ignoring them would let a caller think a filter applied when it didn't.
- Endpoints 1–3 are `no-store` — they are random by definition. Endpoint 4 may cache indefinitely; the data is frozen history.
- Never leak Prisma errors to the client.

## Query Logic

All four resolve the same two-step shape: **pick one `team_seasons` row, then hydrate its roster.** Only step 1 differs.

### Step 1 — selecting the team-season

| Endpoint | Table | Filter | Selection |
| --- | --- | --- | --- |
| 1 · random | `team_seasons` | `id NOT IN excludeSeasons` (when given) | Count matching rows, pick an offset with `Math.random()`, re-query with `skip`/`take: 1`. Cheaper than `ORDER BY random()` over 1,292 rows and keeps randomness in one place. |
| 2 · another-team | `team_seasons` | `teamSlug != <slug of exclude>` | Same count-then-offset draw. Derive the slug from the `exclude` id's own row, not by string-splitting the id. |
| 3 · another-season | `team_seasons` | `teamSlug = <slug of exclude>` AND `id != exclude` | Same draw over a much smaller set (a franchise has ≤ 46 rows). Empty result → `404 NO_ELIGIBLE_TEAM`. |
| 4 · by id | `team_seasons` | `id = <teamSeasonId>` | `findUnique`. Null → `404`. |

Endpoints 2 and 3 need the anchor's `teamSlug` first, so they are two round trips: read `exclude`'s row, then draw. If `exclude` doesn't resolve, that's a `404`.

### Step 2 — hydrating the roster

One nested read from the chosen `team_seasons` row:

```
team_seasons  ──(teamSlug → Team.slug)──────────────►  teams
     │                                                 name, conference
     └──(id → PlayerSeasonTeam.teamSeasonId)────────►  player_season_teams
                    │
                    └──(playerSeasonId → PlayerSeason.id)──►  player_seasons
                                   │                          age, position, rating
                                   └──(playerSlug → Player.slug)──►  players
                                                                     fullName
```

- Include `team` for the display name, and `playerSeasons → playerSeason → player` for the roster. One Prisma query with nested `include`; do not loop per player.
- `player_season_data` is **not** joined, and no gameplay query ever joins it. It is an audit table: it stores the raw scraped inputs so a rating can be recomputed if the rating engine changes, without re-scraping. Gameplay reads the derived `player_seasons.rating` only.
- Sort the roster by `rating` descending in the query, so the board renders in a stable, useful order.

### Step 3 — mapping to `DraftTeam`

| `DraftTeam` field | Source |
| --- | --- |
| `teamSeasonId` | `team_seasons.id` |
| `teamName` | `teams.name` |
| `teamSlug` | `team_seasons.teamSlug` |
| `teamLogo` | `teamLogoPath(teamSlug)` — derived at read time, never stored |
| `teamRating` | `team_seasons.rating` |
| `seasonYear` | `team_seasons.seasonYear` |
| `players[]` | `player_seasons` rows → `DraftablePlayer` |

| `DraftablePlayer` field | Source |
| --- | --- |
| `playerId` | `player_seasons.playerSlug` |
| `playerSeasonId` | `player_seasons.id` |
| `name` | `players.fullName` |
| `age` · `position` · `rating` | `player_seasons` |

The mapper is one shared function used by all four endpoints — the response shape must not drift between them.

## Manual Testing

Start the dev server first (`npm run dev`, port 3000). **Quote every URL** — `&` and `?` are shell metacharacters in zsh. `jq` is optional; drop the pipe to see raw JSON.

### Happy paths

```bash
# 1 · Get Random Team / Skip Round — no params
curl -s "http://localhost:3000/api/draft/team" | jq

# 1 · explicit mode, must behave identically
curl -s "http://localhost:3000/api/draft/team?mode=random" | jq

# 1 · Skip Round with already-offered ids excluded
curl -s "http://localhost:3000/api/draft/team?excludeSeasons=CHI-1996,LAL-2020" | jq

# 2 · Another Team — anchored on the 1996 Bulls, must return a different franchise
curl -s "http://localhost:3000/api/draft/team?mode=another-team&exclude=CHI-1996" | jq

# 3 · Another Season — must return a different Bulls season
curl -s "http://localhost:3000/api/draft/team?mode=another-season&exclude=CHI-1996" | jq

# 4 · deterministic fetch by id
curl -s "http://localhost:3000/api/draft/team/CHI-1996" | jq
```

### What to check

```bash
# #2 never returns the anchor's franchise — run 20 times, CHI must not appear
for i in $(seq 20); do
  curl -s "http://localhost:3000/api/draft/team?mode=another-team&exclude=CHI-1996" \
    | jq -r '.data.teamSlug'
done | sort -u

# #3 always returns CHI, never CHI-1996 itself
for i in $(seq 20); do
  curl -s "http://localhost:3000/api/draft/team?mode=another-season&exclude=CHI-1996" \
    | jq -r '.data.teamSeasonId'
done | sort -u

# #1 spreads across the full pool, not just one era
for i in $(seq 30); do
  curl -s "http://localhost:3000/api/draft/team" | jq -r '.data.seasonYear'
done | sort -n | uniq -c

# roster shape: rating-sorted, one position per player, logo path derived
curl -s "http://localhost:3000/api/draft/team/CHI-1996" \
  | jq '{teamName, teamRating, teamLogo, players: [.data.players[] | "\(.name) \(.position) \(.rating)"]}'

# non-playoff team-seasons are draftable — 1996-97 Vancouver Grizzlies (14-68)
curl -s "http://localhost:3000/api/draft/team/VAN-1997" | jq '.data.teamName, .data.teamRating'
```

### Error paths

```bash
# 400 — mode requires exclude
curl -si "http://localhost:3000/api/draft/team?mode=another-team" | head -1

# 400 — unknown mode is rejected, not silently treated as random
curl -si "http://localhost:3000/api/draft/team?mode=nonsense" | head -1

# 404 — unknown team-season id
curl -si "http://localhost:3000/api/draft/team/NOPE-1996" | head -1

# 404 — exclude anchor that doesn't resolve
curl -si "http://localhost:3000/api/draft/team?mode=another-season&exclude=NOPE-1996" | head -1

# 404 — franchise with a single season has no "another season"
curl -si "http://localhost:3000/api/draft/team?mode=another-season&exclude=<single-season-id>" | head -1
```

The last one needs a franchise that appears exactly once in `team_seasons`; if none exists, the branch is only reachable in a unit test.

## Files

- `src/lib/draft-api.ts` — Zod parsing and the row → `DraftTeam` mapper. **Pure: it must not import `@/lib/db`**, which constructs the `PrismaClient` at module scope and throws without `DATABASE_URL` (vitest loads no env, so anything a test imports has to stay clear of it).
- `src/lib/db/draft.ts` — `getRandomTeamSeason`, `getRandomOtherTeam`, `getRandomOtherSeason`, `getTeamSeasonById`.
- `src/lib/api-response.ts` — `apiSuccess` / `apiFailure`; `src/types/api.ts` — `ApiResponse`, `ApiError`.
- `src/app/api/draft/team/route.ts` — endpoints 1–3, dispatching on `mode`.
- `src/app/api/draft/team/[teamSeasonId]/route.ts` — endpoint 4.
- `src/lib/draft-api.test.ts` — Vitest.

## Notes

- **Tests run without network or database access** (`context/coding-standards.md`). Test the Zod parsing, the `mode` dispatch, and the row → `DraftTeam` mapper against fixture rows. Do not test against live Neon.
- The existing `randomTeamSeason` / `randomOtherTeam` / `randomOtherSeason` selectors in `src/lib/draft.ts` operate on an in-memory array of fixtures. This phase reimplements the same three filters as queries; the fixture selectors stay until Phase 13 removes their last caller.
- Reroll counting, duplicate blocking, and position/slot matching remain client-side in the draft reducer. The endpoints are stateless and know nothing about the run in progress.
- 🔒 No database writes. This phase is read-only — the `CLAUDE.md` lock applies in full.
