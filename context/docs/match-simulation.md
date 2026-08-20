# Match Simulation

How a Phase 15 match is decided: how the two sides are rated, how a game is played
out possession by possession, how a best-of-7 series resolves, and what the engine
hands the presentation layer.

**Primary input: `player_season_data.boxPlusMinus`, weighted by minutes.** BPM is
defined as points per 100 possessions above league average, which is already the unit
a possession engine works in, and it is era-neutral by construction — a +6 in 1985
and a +6 in 2024 mean the same thing.

**`team_seasons.rating` is not read by this feature at any point**, for the same
reason Phase 14 excludes it. See §2.

**No LLM is involved anywhere in this engine.** See §10.

---

## 1. What a match is

The bracket produces matchups; this feature produces results. Every matchup in the
tournament — all four rounds — is a **best-of-7 series, first to 4 wins**. A series
that reaches 4-0 does not simulate games 5 through 7.

Each game is played as a real game: **4 quarters of ~25 possessions per side**,
overtime if tied, resolved possession by possession. Nothing about the result is
drawn in advance and decorated afterward — the final score is whatever the
possessions produced.

```text
Series (best of 7)
  └── Game (4 quarters + OT if tied)
        └── Quarter (~25 possessions per side)
              └── Possession → event → points
```

---

## 2. 🔒 Team rating is excluded — deliberately

**Do not rate either side on `team_seasons.rating`.**

Phase 10's engine picks one player per position and weights the five. Because Phase 9
gives every player-season exactly one position, a roster's third-best player
contributes **nothing** when he shares a slot with someone better — Draymond Green's
86 is discarded from the 2017 Warriors. The stored numbers show the damage:
`PHI-1983` 95 and `ORL-1995` 94 outrank the 72-10 `CHI-1996` at 91, and the 2020
champions sit at 85.

A simulation needs the *whole* roster, which is precisely what that engine throws
away. Minutes-weighted BPM over every player on the team-season has no positional
collapse, needs no normalization, and is already in points per 100 possessions.

`player_seasons.rating` also stays out of the math. It is the draft's headline number
and the squad-slot input in Phase 14; here it appears only on cards.

---

## 3. Rating the two sides

Both sides reduce to a single **net rating** — points per 100 possessions above
league average. The opponent's comes out of the data directly; the squad's needs a
transformation, because five players at 48 minutes is not a real team.

### 3.1 Opponent (a real team-season)

```text
weightedMeanBpm = Σ(bpm_i × minutesPlayed_i) / Σ(minutesPlayed_i)
opponentNet     = 5 × weightedMeanBpm
```

The ×5 is not a fudge factor: BPM is a per-player on-court figure and five players are
on the court, so the five on-court BPMs sum to the team's net rating. Because a
season's minutes are already distributed across the real rotation, this lands in the
genuine NBA range (roughly −10 to +14) with **no calibration at all**. The 1996 Bulls
should come out near +13, the 2017 Warriors near +11.5.

**Rows with `boxPlusMinus = null` are `MP = 0` players** (Phase 7's finding) and
contribute nothing to a minutes-weighted mean anyway. Skip them; do not substitute.

### 3.2 Squad (five players, no bench)

Summing five elite BPMs gives absurd numbers — five +12 players would be a +60 team,
roughly four times the best team in history. Two corrections:

**Redundancy weighting.** Sort the five BPMs descending and weight them
`[1.00, 0.80, 0.65, 0.52, 0.42]`. Stars share possessions; the fifth option on a team
of legends does not produce what he produced as a first option.

```text
rawSquad = Σ(weight_k × bpm_(k))     // bpm sorted descending
```

**Compression into a plausible band.** The same logistic shape Phases 8 and 10 use:

```text
squadNet = 26 / (1 + e^(−(rawSquad − 16) / 8)) − 8
```

| `rawSquad` | `squadNet` | reads as |
| --- | --- | --- |
| 40 | ≈ +16.8 | better than any real team |
| 25 | ≈ +11.5 | 2017 Warriors territory |
| 16 | ≈ +5.0 | a good playoff team |
| 5 | ≈ −2.8 | below average |
| 0 | ≈ −4.9 | bad |

The ceiling sits deliberately just above the best real team-season. A perfect draft
should be able to beat anyone, and should still lose sometimes.

### 3.3 🔒 No fatigue penalty — deliberately

**The squad is never penalized for having only five players, within a game or across a
series.** `squadNet` is constant from tip-off to game 7.

An earlier draft of this doc charged the squad a fatigue decay as the price of playing
all 48 minutes with no bench. That is the wrong instinct: **the five-player limit is a
rule of the game, not a decision the player made.** Hard constraint 8 fixes the squad
at five; the player never had the option of drafting a bench and declining it. Taxing
them for a constraint they were handed punishes nothing they chose.

Squad strength is already bounded by §3.2 — redundancy weighting stops five stars from
summing into a +60 team, and the logistic caps the band just above the best real
team-season. That is where balance lives. It does not need a second, unfair lever on
top.

The opponent gets no fatigue model either, so the sides stay symmetric. Its rotation
depth is already priced into the minutes-weighted mean.

### 3.4 Home court

2-2-1-1-1, worth **+2.0 net** to the home side (real NBA home advantage runs +1.5 to
+3 depending on era). The squad has no home city, so **it holds home court when its
net rating exceeds the opponent's** — earned rather than assigned. Ties go to the
historical team.

---

## 4. The possession engine

### 4.1 Turning net ratings into scoring rates

Only total BPM was ingested — there is no offensive/defensive split — so the
differential is halved onto each side:

```text
effectivePpp(A) = BASE_PPP + (netA − netB) / 200
```

with `BASE_PPP = 1.08`. This is self-checking: over 100 possessions each, the expected
margin is exactly the net differential. A +10 side beats a +0 side 113-103 on average.

### 4.2 Resolving one possession

Each possession draws one outcome from a table whose scoring probability is tuned to
hit that side's `effectivePpp`:

| Outcome | Rate | Points |
| --- | --- | --- |
| Turnover | 13% | 0 |
| Shot — two | 72% of shots | 2 |
| Shot — three | 20% of shots | 3 |
| Shot — and-one / free throws | 8% of shots | 2 or 3 |

Expected points per made possession ≈ 2.24, so the make probability is
`effectivePpp / (0.87 × 2.24)` — about 0.554 at league average. Missed shots and
turnovers simply end the possession; **offensive rebounds are not modeled**, since no
rebounding data was ingested. Pace is a flat **100 possessions per side per game**
(era pace isn't in the database either); overtime adds ~11 per side.

All of these constants are **calibration targets, not settled values.** §9 says what
the finished engine has to reproduce.

### 4.3 Who scored

Attribution is weighted by a production proxy:

```text
share_i ∝ playerEfficiencyRating_i × minuteShare_i
```

For the squad, minutes are equal, so it reduces to PER share. This is the one place
PER earns its keep — it is per-minute production, which is roughly what "who takes and
makes shots" needs.

**This yields points per player and nothing else.** See §5.

### 4.4 Randomness

Every draw comes from `seededRng` in [`src/lib/rng.ts`](../../src/lib/rng.ts), seeded
`${runSeed}:${matchupId}:g${gameNumber}`. `Math.random` never appears in the engine, no
test stubs it, and replaying a game after a refresh gives the identical result.

Note that with ~200 scoring possessions per game the emergent margin standard deviation
lands near 16 points, which keeps upsets genuinely live: a side that is +10 better wins
a single game about 73% of the time, and the series about 89%.

---

## 5. What the event log contains — and what it does not

**Decision: scoring events only. No box score.**

`player_season_data` holds G, MP, PER, BPM, VORP and WS/48 — there are **no points,
rebounds, assists, or shooting splits in the database**. The engine can say a player
scored; it cannot know he shot 9-of-17 with 6 boards.

So the log carries scoring events, and each event names the scorer and the points. A
**points-only leaderboard falls out for free** and is fair to display. A full box score
does not, and must not be faked — synthesizing plausible rebound and shooting lines
would put invented numbers next to real historical players, which is the one thing the
project's data rules exist to prevent.

Two later options, neither in Phase 15's scope: extend the Phase 7 scraper to ingest
the Per Game table (real data, but a new ingestion pass against a 🔒 frozen database),
or accept synthesized splits (rejected here).

---

## 6. Computed up front, replayed afterward

**The entire game is simulated to a complete event log before anything is presented.**

This is what makes hard constraints 10 and 11 structural rather than remembered:

- **Speed** (Slow/Normal/Fast) chooses how fast the finished log replays. It cannot
  reach the result, because the result already exists.
- **Mode** (Manual/Automatic) chooses only whether advancing needs a click. Switchable
  mid-replay by construction, since nothing is being computed.
- A reload replays the same game rather than rolling a new one.

The alternative — streaming a live simulation — makes both constraints something the
presentation layer has to be careful not to break.

### 6.1 Precomputed is what makes it feel live — and what Phase 17 owes

**Precomputed is not the opposite of live.** A live *feel* comes from pacing, tension
and reveal, none of which require the result to be unknown to the machine — a
broadcast delay does not make a game less thrilling. What kills the feeling is a
**stall**: a spinner between quarters, a pause while the fourth quarter is fetched, a
scoreboard that jumps because two updates arrived at once. Precomputing on the client
removes every one of those by construction. There is no network in the loop and no
computation left to do — the replay can hit a steady frame budget it can actually keep.

**Phase 17 owns the live sense, and it is a real obligation, not a side effect.** The
engine hands over a finished log; a naive renderer that prints it in one pass would
throw away everything this design bought. What that phase owes:

- **Events arrive on a clock, not in a loop.** Pace the log by game clock, so a 12-2
  run takes longer than two trades of free throws. Slow/Normal/Fast scale that clock.
- **The score climbs, never teleports.** Running totals are already on every event
  (§7); animate between them.
- **Quarters land as beats.** End-of-period is a pause and a summary, not one more line
  in a feed.
- **Tension is readable from the data already there** — margin swings, lead changes,
  scoring runs by one player. All of it is derivable from `MatchEvent` without any new
  field.
- **Never reveal ahead of the replay.** The final score exists from the first tick;
  nothing in the UI may show it early, including a series scoreboard that resolves
  before its game has been watched.
- **Fast is fast, not instant.** Even at the fastest speed the run of play should read
  as a game. Skipping to the result is a separate, explicit action if it exists at all.

---

## 7. Shape

```ts
type MatchEvent = {
  possession: number;
  period: number; // 1-4, then 5+ for overtime
  clock: string; // presentation only, derived from possession index
  side: "SQUAD" | "OPPONENT";
  playerSeasonId: string;
  playerName: string;
  points: 2 | 3;
  andOne: boolean;
  squadScore: number; // running totals after this event
  opponentScore: number;
};

type GameResult = {
  gameNumber: number; // 1-7
  seed: string;
  homeSide: "SQUAD" | "OPPONENT";
  squadScore: number;
  opponentScore: number;
  periodScores: { period: number; squad: number; opponent: number }[];
  winner: "SQUAD" | "OPPONENT";
  events: MatchEvent[];
  scoring: { playerSeasonId: string; playerName: string; points: number }[];
};

type SeriesState = {
  matchupId: string;
  squadWins: number; // series ends at 4
  opponentWins: number;
  games: GameResult[];
};
```

`MatchEvent` has no field for rebounds, assists, or shot attempts — the same
enforcement-by-type Phase 14 used to keep team ratings out of the bracket.

---

## 8. Architecture

### 8.1 Modules

| Module | Holds |
| --- | --- |
| `src/types/match.ts` | the types in §7 |
| `src/lib/match.ts` | **all rules** — net ratings, home court, the possession loop, series state |
| `src/lib/db/match.ts` | one query: BPM/MP/PER for a set of team-seasons and for five player-seasons |
| `src/app/api/tournament/match-data/route.ts` | parse → fetch → envelope. **Serves ratings, never results** |
| `src/lib/match-client.ts` | request building and fetch, mirroring `bracket-client.ts` |

The split is the standing constraint from Phase 11: **`src/lib/db/*` can never be
imported by a test**, because `@/lib/db` builds its `PrismaClient` at module scope and
vitest never loads `DATABASE_URL`. Every rule therefore lives in the pure module. Phase
14 learned this the expensive way when the "Finals opponent must have reached the
Finals" rule hid in a Prisma `where` clause where nothing could pin it.

### 8.2 The simulation runs on the client

**The engine runs in the browser. The server serves ratings, never results.**

The endpoint fetches once, when the bracket is built:

```text
GET /api/tournament/match-data
      ?squad=jamesle01-2009,jordami01-1996,bryanko01-2006,duncati01-2003,abdulka01-1977
      &opponents=CHI-1996,LAL-1987,BOS-1986,DET-1989,...
```

It returns BPM, minutes and PER for the five squad player-seasons and for **every
player on every opponent roster** — 8 opponents × ~20 players × 6 fields, comfortably
under 20KB, smaller than the bracket response it accompanies.

**Why the client:**

- **Latency, which is the whole point.** A run is up to 4 series × 7 games = 28 games.
  Per-game requests mean up to 28 round trips to Neon, one of them landing between
  every game in Automatic + Fast mode. That is a stall in exactly the place §6 is
  trying to eliminate. One fetch, then pure local computation, has none.
- **Nothing secret is involved.** The inputs are public NBA history and the rules are
  in the shipped bundle either way.
- **The rules do not move.** `src/lib/match.ts` is a pure module because Phase 11's
  test constraint requires it. Client-vs-server decides only the call site, so this is
  a reversible decision, not an architectural commitment.

**Cheap to reverse, and here is what would reverse it:** the moment results are
persisted, ranked, or shared — accounts, leaderboards, a saved run history — the
client stops being trustworthy and simulation moves behind the endpoint. All of those
are explicitly postponed in the MVP scope. Until one lands, there is nobody to cheat in
a single-player historical sim.

The route stays a GET with Zod-parsed query params, reuses `ApiError`/`apiFailure` from
[`src/lib/api-response.ts`](../../src/lib/api-response.ts), and sends
**`Cache-Control: max-age=31536000` on success only** — the ratings are frozen history,
exactly like `GET /api/draft/team/[teamSeasonId]`. Errors are never cached. Reject a
`squad` list that isn't exactly five distinct ids with `INVALID_REQUEST`; a duplicate
would silently double-count a player's BPM.

### 8.3 When each match is simulated

- **Far-half matchups: immediately**, as soon as match data arrives. Phase 14 puts four
  teams in the far half who resolve against each other to produce the Conference Finals
  opponent, and Phase 16's bracket has to show who is coming. These are not the
  player's games and are never presented as live.
- **The squad's series: per round, as it is reached.** Every result derives from
  `runSeed`, so lazy and eager are byte-identical — this is not a correctness choice.
  It avoids computing the champion before the player has watched game 1, and leaves
  room for anything between-round later (`project-overview.md` names "roguelike
  decisions" as part of the feel; eagerly resolving the whole tournament forecloses
  that quietly).

Worth being clear-eyed about: the run's outcome is **determined** the moment the seed
and the squad exist, whether or not it has been computed. That is already true inside a
single game and it is precisely the property that makes replay and hard constraint 10
work. Running on the client does not change it.

### 8.4 State

Series results live beside the run and the bracket in `RunProvider`, and die with them
on reload — unchanged from Phase 14. `BracketMatchup.winner` finally gets filled in as
each series resolves.

---

## 9. Verification

The engine is arithmetic over committed data, so it can be pinned hard:

- **Determinism:** same seed → byte-identical `GameResult`, asserted directly.
- **Calibration**, over a few thousand simulated games: mean combined score **200–215**,
  margin standard deviation **13–17**, home side wins about **56%** of even matchups.
- **Monotonicity:** across the net-differential range, single-game win probability
  rises monotonically and matches the logistic within tolerance.
- **Upsets stay live:** the strongest realistic favourite still loses a single game
  meaningfully often — a sweep must not be the default outcome (hard constraint 9).
- **Real matchups:** `CHI-1996` and `GSW-2017` come out near +13 and +11.5 net; a
  sub-.500 team-season comes out negative.
- **Series:** first to 4 ends the series; 4-0 simulates exactly 4 games; the series
  score never exceeds 4-3.
- **Log integrity:** running totals in the last event equal `squadScore`/`opponentScore`;
  period scores sum to the final; per-player points sum to the team total.
- **Source grep**, mirroring `bracket.test.ts`: neither match module may reference
  `prisma.teamSeason`, `teamRating`, or `player_seasons.rating` in the math.
- **Mutation-checked:** removing the redundancy weighting or the home-court term must
  each turn tests red. Phase 14 shipped a floor that no test actually covered — don't
  repeat it.
- **No fatigue, asserted:** a squad's net rating in game 7 equals its net rating in
  game 1, and its fourth-quarter scoring rate equals its first-quarter rate over a
  large sample. §3.3 is a rule, so it gets a test rather than a comment.

---

## 10. Out of scope

**No adaptive coaching AI, and no LLM anywhere in the engine.** No model decides a
winner, a score, a quarter, or a possession. This was the former Phase 16, removed
rather than deferred: "who takes the last shot" and "when to double the star" are
possession-resolution rules that live inside this loop, not a layer above it, so
building seams for them now would be structure without a consumer.

Also out: offensive rebounds and second-chance points (no data), era-specific pace (no
data), full box scores (§5), injuries and foul trouble, per-player defensive matchups
beyond the aggregate, and persistence of results across a reload.

Commentary is **Phase 23** — optional, non-authoritative, and permitted only to
describe events this engine already produced.
