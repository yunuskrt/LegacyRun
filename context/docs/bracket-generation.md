# Bracket Generation

How the Phase 14 tournament bracket is built: which historical teams the drafted
squad faces, in what order, and where the difficulty curve comes from.

**Inputs: `playoff_participation` only.** 724 rows, 1981–2026, 362 per conference.

**`team_seasons.rating` is not read by this feature at any point.** Neither is any
aggregate of `player_seasons.rating` over an opponent's roster. See §2.

---

## 1. What the bracket is

The run enters after Phase 12's handoff — a confirmed five-player `Squad` and a
chosen `Conference`. The bracket is a standard 8-slot conference bracket the squad
plays through, followed by a Finals against the other conference:

```text
Conference bracket (8 slots)          Finals
  Round 1        → 1 opponent
  Conf Semis     → 1 opponent          NBA Finals → 1 opponent (opposite conference)
  Conf Finals    → 1 opponent
```

**The squad occupies one of the 8 slots; the other 7 are real historical playoff
team-seasons.** Three share the squad's half — its first-round opponent and the two
teams whose winner it meets in the semifinals; the other four fill the far half and
resolve against each other, so the Conference Finals opponent is produced by the
bracket rather than handed down. A run therefore plays **4 matches** and the bracket shows **8 teams
plus the Finals slot**.

Opponents are identified as `(teamSlug, seasonYear)` — a team-season, not a
franchise. "1996 Chicago Bulls" is the unit, exactly as in the draft.

---

## 2. 🔒 Team rating is excluded — deliberately

**Do not seed, order, band, or tie-break the bracket on `team_seasons.rating`.**

The team-season rating engine (Phase 10) selects one player per position and
weights the five. Because Phase 9 gives every player-season exactly one position, a
roster's third-best player contributes **nothing** when he shares a slot with
someone better — Draymond Green's 86 is discarded from the 2017 Warriors. The
result systematically understates positionally-stacked rosters, which are precisely
the great teams a bracket is supposed to escalate toward. The stored numbers show
it: `PHI-1983` 95, `UTA-1997` 94 and `ORL-1995` 94 all outrank the 72-10 `CHI-1996`
at 91, and the 2020 champion `LAL-2020` sits at 85.

Difficulty comes instead from **what the team actually did in that postseason** —
seed, round reached, and series record. That is verified history rather than a
derived number, it needs no engine, and it cannot be distorted by the positional
collapse.

`team_seasons.rating` keeps its role in the draft (the `TEAM RATING <n>` subtitle on
the offered card). It has no role here.

---

## 3. Pedigree score

One number per playoff appearance, `P ∈ [0, 100]`, computed from the row itself.

### 3.1 Round base

| `roundReached`      | Base | Rows |
| ------------------- | ---- | ---- |
| `FIRST_ROUND`       | 30   | 356  |
| `CONFERENCE_SEMIS`  | 48   | 184  |
| `CONFERENCE_FINALS` | 64   | 92   |
| `NBA_FINALS`        | 80   | 46   |
| `CHAMPION`          | 92   | 46   |

Round reached is the dominant term. It is also the only field whose meaning is
outcome-dependent — every other round value is claimed by appearance alone.

### 3.2 Seed bonus

```text
seedBonus = 12 × (maxSeed + 1 − seed) / maxSeed
```

**`maxSeed` is per season, not a constant 8.** 1981, 1982 and 1983 ran 12-team
brackets with seeds 1–6 and a first-round bye for the top two; every other season is
1–8. Hardcoding 8 would flatten those three seasons' 1 seeds by a quarter of the
bonus. `PHO-1981` is the pinned case — a 1 seed that has no `FIRST_ROUND` series at
all.

### 3.3 Record bonus

```text
recordBonus = 6 × wins / (wins + losses)
```

Separates a champion who went 15-3 from one who went 16-7 without letting the
margin approach a round's worth of difference.

### 3.4 Total

```text
P = round(base + seedBonus + recordBonus)   // clamped to [0, 100]
```

Ties break deterministically on `seed` ascending, then `teamSlug` ascending — never
on rating, and never on insertion order.

---

## 4. Difficulty bands

Each round draws from a band of `P`. Bands **overlap** — a hard band boundary makes
every run's Round 1 feel identical, and the overlap is where replayability lives.

Opponents are drawn in four **groups**, by where they sit relative to the squad
rather than by round number — the squad's semifinal opponent isn't known until the
adjacent matchup resolves, so both teams that could produce it have to be drawn from
the semis band.

| Group             | Teams | Band (inclusive) | Bracket position                          |
| ----------------- | ----- | ---------------- | ----------------------------------------- |
| Round 1           | 1     | `[30, 56]`       | The squad's own first-round opponent       |
| Conference Semis  | 2     | `[50, 72]`       | The other matchup in the squad's half      |
| Conference Finals | 4     | `[64, 88]`       | The entire far half                        |
| NBA Finals        | 1     | `[80, 100]`      | Opposite conference                        |

**Escalation is guaranteed by construction, not by retrying.** Each group is drawn
with a floor set to the previous group's *highest* pedigree, so every team in group
k+1 outranks every team in group k. Whoever wins on the far side, the squad's path
strictly increases. A rejection-and-redraw loop would have been the obvious
alternative and is strictly worse: it can spin, and it can fail non-deterministically
for a seed that should have worked.

The only failure mode left is an empty candidate set after filtering, which returns
`null` → `404`. Against the real 724 rows this does not happen: measured over both
conferences, the tightest step still leaves 44–47 eligible teams, and 400 seeded
generations across both conferences produced 0 failures.

**Every band is non-empty in both conferences** — 195/203 rows in the Round 1 band,
94/97 in Semis, 49/48 in Conference Finals, 54/52 in the Finals band (East/West).
That is the balance requirement from `project-overview.md` §D, and it holds because
the source table is symmetric by construction.

---

## 5. Selection rules

- **Conference.** Slots 1–7 come from the run's conference. The Finals opponent comes
  from the **opposite** conference. `playoff_participation.conference` is per-season
  and is the only correct source — `Team.conference` is a single directory value and
  is wrong for realigned franchises (`NOH` played the East in 2003–2004).
- **No repeated franchise in a bracket.** Uniqueness is on `teamSlug`, not on
  `(teamSlug, seasonYear)` — facing three different Lakers teams in one run reads as
  a bug even though the team-seasons differ.
- **No collision with the drafted squad.** A team-season that contributed a player to
  the squad is excluded, so a run never plays against the roster it drafted from.
  Match on `(teamSlug, seasonYear)` here, since only that exact team-season is the
  awkward case.
- **Randomness is seeded.** `generateBracket(rows, query, runSeed)` builds its own
  `Rng` from the seed, so determinism is a property of the signature rather than of
  the caller. Same seed → same bracket, and no test ever stubs `Math.random`.

### 5.1 Bracket slots are positions, not strength seeds

The squad's slot (1–8) comes from the mean of its five `player_seasons.rating`
values — a squad-side number, unrelated to the excluded team-season ratings. It
decides **where in the bracket the squad sits**, and therefore which positions the
seven opponents fill. It does not make the run easier or harder: every squad's
first-round opponent is drawn from the same band regardless of slot.

**The field is `bracketSlot`, not `bracketSeed`, and that naming is load-bearing.**
Strength-ordered seeding is incompatible with the escalation requirement — in a real
bracket the 4 seed meets the 1 seed in round *two*, which is exactly the difficulty
spike hard constraint 12's "increasing round over round" forbids. So the four
strongest opponents sit in the far half at positions 2/3/6/7, and a position-1 team
can legitimately be weaker than a position-7 team. Calling that a "seed" reads as a
bug; calling it a slot is accurate. Each opponent's **real** historical seed is on
`BracketOpponent.seed` and is what the UI should display.

This was caught by printing real brackets, not in review — a slot-1 team at `P54`
sitting above a slot-7 team at `P76`.

---

## 6. Shape

```ts
type BracketOpponent = {
  teamSeasonId: string      // `${teamSlug}-${seasonYear}`
  teamSlug: string
  teamName: string
  teamLogo: string          // teamLogoPath(teamSlug)
  seasonYear: number
  conference: Conference
  seed: number
  roundReached: PlayoffRound
  wins: number
  losses: number
  pedigree: number
}
```

Note what is absent: **no `teamRating` field**. Leaving it off the type is what keeps
§2 enforced rather than merely documented — a later phase cannot quietly start
sorting on it.

```ts
type BracketSlot =
  | { side: "SQUAD"; bracketSlot: number }
  | { side: "OPPONENT"; bracketSlot: number | null; opponent: BracketOpponent }

type BracketMatchup = {
  id: string                      // `r1-m2`, `finals` — stable across rounds
  round: BracketRoundId           // FIRST_ROUND … NBA_FINALS
  home: BracketSlot | null        // null until the feeding matchup resolves
  away: BracketSlot | null
  winner: BracketSlot | null      // always null in Phase 14
}

type BracketRound = {
  id: BracketRoundId
  label: string
  matchups: BracketMatchup[]
}

type Bracket = {
  runSeed: string                 // reproduces this exact bracket
  conference: Conference          // the squad's conference
  squadSlot: number               // 1–8, a position (see §5.1)
  rounds: BracketRound[]          // 4 rounds: 4 + 2 + 1 + 1 matchups
}
```

`winner` exists on the type from day one but is always `null` here — Phase 15 fills
it. Phase 14 must not invent results, including for the far side of the bracket;
those matchups ship with both slots populated and no winner.

---

## 7. API endpoint

```text
GET /api/tournament/bracket
      ?conference=EAST
      &squadRating=78
      &exclude=CHI-1996,LAL-2020,BOS-2008
      &runSeed=k3f9qv1p
```

| Parameter     | Required | Shape                                    | Notes                                                                 |
| ------------- | -------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `conference`  | ✅       | `EAST` \| `WEST`                         | The run's conference. Slots 1–7 come from it, the Finals from the other |
| `squadRating` | ✅       | int `0–100`                              | Mean of the squad's five `player_seasons.rating` values → `squadSeed`  |
| `exclude`     | —        | comma-separated `teamSeasonId`, ≤ 8      | Team-seasons the squad drafted from. Reuses Phase 11's `idList` schema |
| `runSeed`     | —        | `[a-z0-9]{1,32}`                         | Absent → the server mints one and returns it in the payload            |

**Why `GET`, and why the run travels in the query string.** The run is in-memory
client state (`RunProvider`) and nothing about it is persisted, so the server cannot
look it up — the client must supply the conference, the squad's rating, and the
team-seasons to avoid. Nothing is created or mutated, so `POST` would misdescribe
it. The three parameters total well under 200 characters (`exclude` carries at most
5 ids of ~12 chars), so there is no length concern.

**`runSeed` is returned even when it was not sent.** That is what makes the bracket
reproducible: the same seed with the same three other parameters yields a
byte-identical bracket, which is what a future refresh-recovery or share-a-run
feature would need. It costs one string in the payload, and it is verified: the same
`runSeed` requested twice returns a byte-identical body.

Responses use the existing `ApiResponse<T>` envelope:

| Status | Error              | Cause                                                                   |
| ------ | ------------------ | ----------------------------------------------------------------------- |
| 200    | —                  | `{ success: true, data: Bracket }`                                      |
| 400    | `INVALID_REQUEST`  | Bad or missing `conference` / `squadRating`, malformed `exclude`/`runSeed` |
| 404    | `NO_ELIGIBLE_TEAM` | A band could not be filled after exclusions                             |
| 500    | `QUERY_FAILED`     | Prisma threw                                                            |

**`ApiError` is reused as-is, not extended.** `NO_ELIGIBLE_TEAM` already means "the
pool had nothing for this request", which is exactly the unfillable-band case. Adding
a `BRACKET_UNSATISFIABLE` member would force every existing consumer's error map to
grow for a case that is unreachable against the real 724 rows — at most 5 exclusions
against a 46-row Finals band. Revisit only if the bands tighten.

`Cache-Control: no-store` — brackets are random by definition, exactly like the
draft's endpoints 1–3.

---

## 8. Architecture

### 8.1 Modules

| File                                      | Holds                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `src/types/bracket.ts`                    | `BracketOpponent`, `BracketSlot`, `BracketMatchup`, `BracketRound`, `Bracket` |
| `src/lib/rng.ts`                          | `seededRng(seed: string): Rng`, `mintSeed(rng)` — pure                  |
| `src/lib/bracket.ts`                      | pedigree, bands, seeding, selection, post-conditions, query parsing — **pure, testable** |
| `src/lib/db/bracket.ts`                   | one Prisma read over `playoff_participation`. **No logic**              |
| `src/app/api/tournament/bracket/route.ts` | parse → fetch → generate → envelope. No logic                           |
| `src/lib/bracket-client.ts`               | `bracketUrl`, `requestBracket`, the failure→message map — pure          |
| `src/components/play/RunProvider.tsx`     | gains `bracket` + `setBracket`                                          |

**`src/lib/db/*` can never be imported by a test** — `@/lib/db` builds the
`PrismaClient` at module scope and throws without `DATABASE_URL`, which vitest never
loads. Every rule in this document therefore has to live in `src/lib/bracket.ts` or
it cannot be pinned. This constraint has already been rediscovered twice (Phase 11,
and the "Another Team" fix); this feature is designed around it from the start.

### 8.2 Selection happens in memory, not in SQL

**This is the one deliberate departure from the Phase 11 draft pattern.** The draft
draws with `count` + `skip`/`take` because the pool is 1,292 team-seasons with
rosters attached. Here the entire eligible pool is at most **408 rows** — 362 for the
run's conference plus the 46 Finals-band rows on the other side — with no joins
beyond the team name. So `src/lib/db/bracket.ts` fetches candidates and does nothing
else:

```ts
where: {
  OR: [
    { conference },
    { conference: other, roundReached: { in: ["NBA_FINALS", "CHAMPION"] } },
  ],
}
```

**The `roundReached` filter in that clause is an optimization, not the rule.** The
same restriction is applied again in `src/lib/bracket.ts`, because the Finals band
alone would admit a conference finalist scoring 82 — and a rule that exists only in a
`where` clause is a rule no test can reach. `FINALS_ROUNDS` is the tested home of it.

Every rule — pedigree, banding, uniqueness, exclusions, the strictly-increasing
floor, the finalist restriction — then runs over a plain array inside `src/lib/bracket.ts`,
where a test can feed it a fixture pool and assert the selected ids. Pushing any of
it into the `where` clause would put the interesting logic in the one file no test can
import, which is precisely the mistake the "Another Team" fix had to undo.

One query, one round trip, no `orderBy`-dependent offset arithmetic.

### 8.3 Flow

```text
/play/tournament (client)
  useRun() → { squad, conference }
  squadRating = mean(squad.players[].rating)
        │
        ▼
  requestBracket({ conference, squadRating, exclude })   src/lib/bracket-client.ts
        │  GET /api/tournament/bracket?…
        ▼
  route.ts ── parseBracketQuery ────────────────────────  src/lib/bracket.ts  (pure)
        │
        ├── getPlayoffCandidates(conference) ───────────  src/lib/db/bracket.ts (Prisma)
        │        724-row table → ≤408 candidate rows
        ▼
  generateBracket(candidates, query, seededRng(runSeed))  src/lib/bracket.ts  (pure)
        │        pedigree → bands → draw → post-conditions
        ▼
  apiSuccess(bracket, { "Cache-Control": "no-store" })
        │
        ▼
  setBracket(bracket) in RunProvider — runtime only
```

### 8.4 State

The bracket lives on `RunProvider` beside the run, not in a second provider: it is
meaningless without a run and must die with it. `Run` gains no field — the provider
exposes `bracket: Bracket | null` and `setBracket` separately, so `buildRun` and its
14 existing tests are untouched.

The page fetches once on mount when `run !== null && bracket === null`, guarded by an
`AbortController` in a ref — the same guard Phase 13 needed, and for the same reason
(React 18 Strict Mode double-invokes effects, so an unguarded fetch fires twice).

Reloading `/play/tournament` still shows the "No squad in play" fallback. Run state
persistence is unchanged by this phase and remains open.

---

## 9. Verification

- Pedigree is monotonic in round for fixed seed and record; `maxSeed` handling
  checked against `PHO-1981` (6-seed bracket, 1 seed, no first round).
- All four bands non-empty in both conferences, over the real 724 rows.
- Strictly increasing path over many seeded runs, no repeated franchise, no
  team-season that appears in the drafted squad.
- Two runs with the same `Rng` seed produce byte-identical brackets.
- **A mutation test that swaps pedigree ordering for `team_seasons.rating` ordering
  must fail the suite.** §2 is the whole point of this feature; it needs a test that
  catches its removal.
- Endpoint driven by curl against live Neon: both conferences, the four error paths
  (missing `conference`, unknown conference, out-of-range `squadRating`, malformed
  `exclude`), and the same `runSeed` twice returning an identical body.
- `grep` proves no bracket module imports `team_seasons` / `teamSeason`.
- A second suite (`bracket-data.test.ts`) runs the generator over the **committed 724
  rows** rather than fixtures: 120 seeded brackets across both conferences and the
  whole squad-rating range, asserting no failures, escalation on every path, franchise
  uniqueness, 7+1 conference split, exclusions, and that the Finals opponent always
  actually reached the Finals. This is what pins the claims in §4 to the real data.

---

## 10. Only one conference has a bracket — and what Phase 17 owes for it

There is no bracket for the other conference. The run plays an 8-slot bracket in its
own conference; the Finals opponent is drawn straight from the Finals band and never
plays a game to get there.

**Why, and why not the 16-team alternative.** If the far conference resolved through
its own three rounds, its survivor would be whoever won — routinely weaker than the
squad's Conference Finals opponent, which turns the Finals into a step *down* and
breaks hard constraint 12. Guaranteeing an elite survivor means banding that bracket
too, i.e. the same trick one level up with seven extra teams as decoration. Those
seven matchups are also games the player never plays, so the whole apparatus exists
to produce one team name. The drawn opponent is not arbitrary in the way a generated
one would be: it is a real champion with a real seed and a real record, and that is
what makes it read as earned.

**The compensation is a UI obligation, and it belongs to Phase 17.** Because the
mechanic is deliberately thin here, the presentation has to carry it:

- Render the Finals slot as an **other-conference champion stub** — logo, franchise,
  season, real seed, real playoff record — labeled as the Eastern/Western Conference
  champion. A lone name in an empty slot reads as unfinished; the same data framed as
  a conference champion reads as a bracket.
- Never draw an empty or "TBD" second bracket beside it. There is no second bracket;
  implying one is worse than omitting it.
- `bracketSlot: null` on that opponent is the signal it sits outside the 8-slot
  bracket. Phase 17 should branch on it rather than special-casing the round id.
- Optional and cheap, worth considering then: **hide the Finals opponent until the
  squad reaches the Conference Finals.** The slot and the distance to it stay visible,
  so `project-overview.md` §D's "always sees how far the Finals are" still holds, and
  the reveal becomes a moment instead of a three-round spoiler.

This is a recorded decision, not an oversight. Revisit only if Phase 15's engine makes
simulating a far-conference bracket nearly free *and* the escalation problem above has
an answer.

---

## 11. Out of scope

Match simulation (Phase 15) — the bracket produces matchups, not results. The visual
bracket (Phase 17). Persistence — bracket state is runtime only, alongside the run,
and is lost on reload like everything else in `RunProvider`.
