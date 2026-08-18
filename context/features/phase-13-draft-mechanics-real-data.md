# Phase 13 — Draft Mechanics (Real Data)

## Overview

Swap the draft from the Phase 4 fixtures to the Phase 11 endpoints. The four buttons already on `/play/draft` stop reading `MOCK_DRAFT_TEAMS` and start hitting `/api/draft/team`, so the draft runs against all 1,292 real team-seasons in Neon.

The reducer, the validation rules, and every component's props stay as they are — Phase 11 deliberately returns the existing `DraftTeam` type. What changes is where a team comes from, and the three states a network round trip introduces that an in-memory array never had: loading, failure, and out-of-order responses.

Scope is the draft round loop only. No schema change, no migration, no new endpoint, no database write.

## Requirements

- `/play/draft` must play end to end on real data: five slots filled from real rosters, duplicate blocking, position matching, and the 3-reroll counter all still working.
- No component prop signature changes. `DraftExperience` absorbs the fetching.
- Randomness stays out of the reducer — `OFFER_TEAM` and `REROLL` keep carrying a resolved `DraftTeam` in the action, exactly as Phase 6 built them.
- Reroll counting, duplicate blocking, and slot matching remain client-side. The endpoints stay stateless and know nothing about the run in progress.
- 🔒 Read-only phase. The `CLAUDE.md` lock applies in full: no migration, no `db:ingest`, and no regeneration of `src/data/`. Nothing in this phase needs any of them — the endpoints already serve everything the draft reads.

## Wiring

### 1. Drop the fixture import

[`src/app/play/draft/page.tsx`](../../src/app/play/draft/page.tsx) stops importing `MOCK_DRAFT_TEAMS` and passes only `slots`. It stays a server component; the first team is fetched on demand when the user clicks, not prefetched, so the page keeps prerendering static.

### 2. Map the buttons onto the endpoints

| Button | Request |
| --- | --- |
| `Get Random Team` | `GET /api/draft/team` |
| `Skip Round` | `GET /api/draft/team` |
| `Another Team` | `GET /api/draft/team?mode=another-team&exclude=<current id>` |
| `Another Season` | `GET /api/draft/team?mode=another-season&exclude=<current id>` |

`RerollKind` already distinguishes the three reroll buttons, so `handleReroll` only swaps its three `random*` calls for three request builders.

### 3. Add a typed client fetcher

New `src/lib/draft-client.ts`:

- Builds the query string for each of the four cases.
- Unwraps the `{ success, data, error }` envelope and returns a discriminated result, not a thrown `DraftTeam`.
- Maps `INVALID_REQUEST` / `NO_ELIGIBLE_TEAM` / `QUERY_FAILED` and transport failure onto messages for the existing `toast.error` path in `DraftExperience`.
- Takes an injectable `fetch` so it is unit-testable with no network — the same dependency-injection shape `fetchDraftTeam` and `drawIndex` use in `src/lib/draft-api.ts`.

### 4. Delete the fixture selectors

Once nothing calls them, remove `randomTeamSeason`, `randomOtherTeam`, and `randomOtherSeason` from [`src/lib/draft.ts`](../../src/lib/draft.ts) along with their tests. Everything else in that file — `validateDraft`, `playerAvailability`, `openPositions`, `createDraftReducer`, the reroll guards — is untouched.

`src/data/` itself stays: the fixtures are still what the reducer tests run against, and deleting them would leave the draft rules untested.

## New states

An in-memory lookup was synchronous and infallible. A fetch is neither.

### 5. Loading

While a request is in flight, `Get Random Team` and all three reroll buttons must be disabled, with a visible pending state on the board. Add a `isFetchingTeam` flag in `DraftExperience` and pass it into `DraftBoard`'s existing `canGetTeam` / `canReroll` props rather than inventing new ones.

### 6. Race guard

Rapid clicks must not let a stale response overwrite a newer team. Use an `AbortController` per request (abort the previous one) or a monotonic request-sequence counter that discards late responses. Either is fine; pick one and note it.

### 7. Failure

A network error or a `500` must leave `state.offeredTeam` unchanged, toast, and — critically — **not consume a reroll**. The reroll is only spent when a team actually arrives, so `dispatch({ type: "REROLL" })` fires on success only. This is already how the code is shaped; keep it that way when the call becomes async.

### 8. No offered-id tracking

`excludeSeasons` is deliberately **not** used, and draft state gains no list of what has been offered. A random draw over 1,292 team-seasons repeats at roughly 1/1292 per draw — rare enough to accept, and not worth the state, the growing query string, or the extra failure mode. `Skip Round` is therefore the same plain random draw as `Get Random Team`; the only difference between them is that one costs a reroll.

The endpoint still supports `excludeSeasons`; nothing client-side sends it.

## Fallout from real data

### 9. Roster length

Real rosters run 17–23 players; [`DraftBoard`](../../src/components/draft/DraftBoard.tsx) renders them in a `grid-cols-2` that was styled against the fixtures' 9–11. Needs a max-height scroll container so the board doesn't push `Start Tournament` off screen. Browser-check at 1440×1000 and 390×844.

The per-card motion `delay: index * 0.03` also becomes a ~0.7s stagger at 23 players — cap or drop it.

### 10. Logos are already fine

The 40 PNGs landed in `0dc03be` named by Basketball-Reference code (`CHI.png`, `UTA.png`), which is exactly what `teamLogoPath()` produces from the real `teamSlug`. The Phase 11 note predicting an initials fallback on every card is stale — verify in the browser and correct the record.

### 11. Position coverage holds on real data

Phase 4 built the fixtures so every team-season could fill all five slots, and a test pins it. **The same invariant holds on the real 1,292** — verified over the committed `player_season.ts` + `player_season_team.ts`: every team-season lists at least one `PG`, `SG`, `SF`, `PF`, and `C`. The two rosters Phase 10 flagged as having no listed `SF` (`LAL-2020`, `MEM-2025`) were corrected in `c9f18ce`.

So no offered team can hand the player an unfillable board, and this phase needs no fallback UI, no reroll prompt, and no server-side filtering of the pool.

The invariant is safe for the foreseeable future: `src/data/` and the ingested Neon branch are both **frozen** under the `CLAUDE.md` lock, and `npm run build:db-data` — the one command that could revert the Kuzma/Wells fix — is one of the locked regeneration scripts. It only becomes a live concern if that lock is lifted, at which point `season_players.ts` (still `PF`/`SG` for those two) has to be corrected first.

## Files

- `src/app/play/draft/page.tsx` — drop the fixture import.
- `src/components/draft/DraftExperience.tsx` — async fetching, loading flag, race guard, offered-id tracking.
- `src/components/draft/DraftBoard.tsx` — scroll container, stagger cap.
- `src/lib/draft-client.ts` — **new**, request builders + envelope unwrapping, injectable `fetch`.
- `src/lib/draft-client.test.ts` — **new**, Vitest.
- `src/lib/draft.ts` — remove the three fixture selectors.
- `src/lib/draft.test.ts` — remove their tests.

## Notes

- Tests run with no network or database access. Test `draft-client.ts` with a stubbed `fetch` — URL construction per mode, envelope unwrapping, each error code, and a transport rejection. Do not test against a running dev server.
- Verification is a real browser run against live Neon: a full 5/5 lineup drafted from real rosters, all three reroll buttons drawing the pool to 0/3, a duplicate identity blocked across two seasons of the same player, and a wrong-slot drop rejected.
- `Start Tournament` still routes to the `/play/tournament` placeholder. Tournament work is Phase 18.
