# Playoff Participation Derivation

How `src/data/db/playoff_participation.ts` is built from
`src/data/raw/playoffs/playoff_teams.csv`.

The CSV is a **series-level** log — one row per playoff series, 678 rows, 1981–2026.
The table is **team-level** — one row per team per playoff appearance. The whole job
is folding series into teams.

**Expected output: 724 rows.** (43 seasons × 16 teams + 1981/1982/1983 × 12 teams.)

---

## 1. Source shape

```
Yr,Lg,Series,,,Team,W,,Team,W,,Favorite,Underdog
2026,NBA,Eastern Conf First Round,Apr 19 - May 3 2026,,Detroit Pistons (1),4,,Orlando Magic (8),3,,DET (-600),ORL (+450)
```

| Index | Column    | Used | Notes                                                        |
| ----- | --------- | ---- | ------------------------------------------------------------ |
| 0     | `Yr`      | ✅   | Ending year → `seasonYear` directly. No conversion needed.   |
| 1     | `Lg`      | —    | Always `NBA`.                                                |
| 2     | `Series`  | ✅   | Source of both `conference` and the round.                   |
| 3,4   | dates     | —    |                                                              |
| 5     | `Team`    | ✅   | `"<Full Name> (<seed>)"` — winner of the series.              |
| 6     | `W`       | ✅   | Games won by team at index 5.                                |
| 7     | blank     | —    |                                                              |
| 8     | `Team`    | ✅   | Loser of the series, same `"<Name> (<seed>)"` format.        |
| 9     | `W`       | ✅   | Games won by team at index 8.                                |
| 10–12 | odds      | —    | Empty before ~2000.                                          |

Both teams in a row must be processed — index 5 and index 8 each contribute to
their own output row. The file has no trailing newline; parse with a real CSV
reader, not `split("\n")`.

---

## 2. Field derivation

Accumulate into a map keyed by `(teamSlug, seasonYear)`.

### `seasonYear`

`int(Yr)`.

### `teamSlug`

Parse the name with `/^(.*) \((\d+)\)$/` — the trailing `(n)` is the seed, and the
prefix is the full franchise name **as it was called that season** (`Seattle
SuperSonics`, `Washington Bullets`, `Kansas City Kings`).

**Do not hand-author a second name→slug table.** Reverse-map
`TEAM_DIRECTORY` in `scripts/build-db-data.mts` on its `name` field. Names are
unique there with exactly one exception:

> **`Charlotte Hornets` maps to both `CHH` and `CHO`.** Resolve by year:
> `seasonYear <= 2002 → CHH`, otherwise `CHO`. Playoff appearances are
> 1993–2002 and 2015–2016, so the split is unambiguous.

All 36 distinct playoff names resolve. Fail loudly on any name the directory
doesn't know — a new/renamed franchise must be added to `TEAM_DIRECTORY` first.

### `seed`

The `(n)` captured above. Range 1–8. A team's seed is identical across every
series it plays in a season — **assert this**; a mismatch means the name parse
went wrong.

### `conference`

From the `Series` prefix:

| `Series` starts with | `conference` |
| -------------------- | ------------ |
| `Eastern`            | `EAST`       |
| `Western`            | `WEST`       |
| `Finals`             | — see below  |

`Finals` rows carry no conference. Both finalists also appear in their own
Conference Finals row, so conference is always resolvable — take it from the
first non-`Finals` series and ignore `Finals` rows for this field. Verified: zero
rows end up without a conference.

> **This field is the reason the table exists.** It is *per-season* and does not
> always match `Team.conference`. Real case: `NOH` (New Orleans Hornets) played
> in the **East** in 2003 and 2004, and the West from 2005 — the directory lists
> it as `WEST`. Never fall back to `Team.conference`.

### `roundReached`

Map each series to a depth, then keep the **maximum** depth the team appears at:

| `Series`                | Depth | `PlayoffRound`      |
| ----------------------- | ----- | ------------------- |
| `… First Round`         | 1     | `FIRST_ROUND`       |
| `… Semifinals`          | 2     | `CONFERENCE_SEMIS`  |
| `… Conf Finals`         | 3     | `CONFERENCE_FINALS` |
| `Finals`                | 4     | `NBA_FINALS`        |

Then: **a team that won its `Finals` series is `CHAMPION`**, not `NBA_FINALS`.
That's the only case where the outcome, not just the appearance, changes the value.

Appearing in a series is enough to claim its round — a team that loses the
Conference Finals still reads `CONFERENCE_FINALS`.

> **1981–1983 had 12-team brackets**: the top two seeds in each conference got a
> first-round bye, so their deepest-*shallowest* series is the Semifinals and they
> have no `FIRST_ROUND` row. Taking the max depth handles this for free — don't
> assume every team played a first round.

Expected distribution: `FIRST_ROUND` 356 · `CONFERENCE_SEMIS` 184 ·
`CONFERENCE_FINALS` 92 · `NBA_FINALS` 46 · `CHAMPION` 46.

### `wins` / `losses`

Sum across every series the team played:

- `wins` += its own `W` column
- `losses` += the opponent's `W` column

Playoff totals for the whole run, not a single series. Observed maxima: 16 wins,
11 losses.

### `id`

`PlayoffParticipationRow` includes `id` (unlike `PlayerSeasonTeamRow`, which omits
it), so the generator must supply one. Use the deterministic form the rest of the
pipeline already uses:

```
id = `${teamSlug}-${seasonYear}`
```

It matches the `@@unique([teamSlug, seasonYear])` constraint exactly and makes
ingestion idempotent. If adopted, drop `@default(cuid())` from
`PlayoffParticipation.id` in `prisma/schema.prisma` and regenerate the migration
— the same change already made for `TeamSeason` and `PlayerSeason`. **This is only
free while the migration is still unapplied.**

---

## 3. Output format

Match the other six files in `src/data/db/` exactly — generated by
`scripts/build-db-data.mts`, prettier-ignored, one object per line, fields in
schema order:

```ts
// Generated by scripts/build-db-data.mts — do not edit by hand.
// Regenerate with `npm run build:db-data`.

import type { PlayoffParticipationRow } from "@/types/db-data";

export const PLAYOFF_PARTICIPATION: PlayoffParticipationRow[] = [
  { id: "BOS-1981", teamSlug: "BOS", seasonYear: 1981, conference: "EAST", seed: 1, roundReached: "CHAMPION", wins: 12, losses: 5 },
  { id: "CHI-1981", teamSlug: "CHI", seasonYear: 1981, conference: "EAST", seed: 5, roundReached: "CONFERENCE_SEMIS", wins: 2, losses: 4 },
];
```

Sort by `seasonYear` then `teamSlug` so two runs are byte-identical.

Update `EXPECTED_ROW_COUNTS` in the generator: `"playoff_participation.ts": 724`.

---

## 4. Validation

Enforce in the generator (accumulate errors, exit non-zero, write nothing):

- Row count is **724**.
- Every `id` is unique and equals `` `${teamSlug}-${seasonYear}` ``.
- No field is null or empty.
- Every `(teamSlug, seasonYear)` **exists as an `id` in `team_season.ts`** —
  verified: all 724 do today. A miss means the name→slug map is wrong.
- `conference` is a valid `Conference`; `roundReached` is a valid `PlayoffRound`.
- `seed` is 1–8; `wins` and `losses` are non-negative integers.
- Exactly one `CHAMPION` per `seasonYear` (46 total).
- Teams per season is 16, except 1981/1982/1983 which are 12.
- Every team's `seed` is consistent across all of its series that season.

---

## 5. Downstream consequence

Once this file is populated, membership in `playoff_participation` becomes the
**"made the playoffs" signal** — there is no `MISSED` round by design. The draft
pool must then join `team_seasons` against it, which finally makes the schema
comment describing `team_seasons` as a playoff-only draftable pool true. Today
`team_season.ts` still holds all 1,292 team-seasons, playoff or not.

`conference` and `seed` here are the inputs Phase 15's bracket generation reads.
