# Player Rating Normalization

How a parsed player-season row becomes a single `overallRating` on the 0–100 scale.

This document is the specification for the Phase 8 rating engine. It covers **player-season ratings only** — team-season aggregation is a separate problem and belongs to its own document.

---

## 1. Purpose

The draft is only interesting if a 1983 Sixers player and a 2023 Nuggets player can be compared on one number. That number has to be:

- **Reproducible** — a pure function of stored inputs, recomputable from `player_season_data` without re-scraping.
- **Era-neutral** — the league of 1981 (23 teams, no three-point offense) and the league of 2026 (30 teams) must produce the same rating for the same relative quality of season.
- **Volume-aware** — a 200-minute bench player with a hot per-minute rate must not outrank a starter.
- **Spread across the usable band** — MVPs near the top, deep bench in the 40s, with enough resolution in between that draft picks feel like trade-offs.

No LLM is involved at any point (hard constraint 3/4). The formula is arithmetic over box-score-derived metrics.

---

## 2. Inputs and why each one is used

Phase 7 parses seven usable fields per player-season. Four are metrics, three are context.

| Field | Type | Role in the rating |
| --- | --- | --- |
| `PlayerEfficiencyRating` (PER) | rate | Per-minute box production, **standardized by construction to a league average of 15 in every season**. The most era-stable input available. Offense-heavy and rewards shot volume — this is why it isn't used alone. |
| `BoxPlusMinus` (BPM) | rate | Points per 100 possessions above a league-average player. Possession-normalized (neutralizes pace inflation) and the only input with a real defensive component. Highest weight. |
| `WinSharesPer48Min` (WS/48) | rate | Per-minute contribution to team wins, league-anchored at ≈.100. Adds a *winning* dimension the other two lack, at the cost of team-context bias (see §8). |
| `ValueOverReplacementPlayer` (VORP) | volume | BPM × share of team minutes × games, prorated to 82. Already encodes minutes and availability — this is the term that separates "efficient in 15 minutes" from "carried a team for 36". |
| `MinutesPlayed` (MP) | context | Sample-size / role weight. Drives the reliability shrinkage in §5. |
| `GamesPlayed` (G) | context | Not used directly — VORP's 82-game proration already carries availability, and using G again would double-count it. Kept in `player_season_data` for auditing. |
| `Position` | context | Not used in the rating. It gates *draft eligibility* (formation slots), not quality. A center is not rated against centers — a single cross-position scale is what makes formation slots a real constraint. |

**Not available:** the Phase 7 parser does not extract TS% (an earlier plan mentioned it). Nothing here depends on it. If it is added later, it belongs inside the rate block as a small-weight efficiency term, not as a new stage.

**Source:** regular-season CSVs only. The playoff CSVs are scraped but unparsed; playoff samples are 4–20 games and far too noisy to rate on. A player-season's rating describes the season that earned the playoff berth.

---

## 3. Population and eligibility

Two distinct populations, and conflating them is the classic mistake:

- **Reference population** — the players whose distribution defines "average" and "one standard deviation". Restricted to **MP ≥ 500** in that season. Including the tail of 40-minute call-ups inflates the standard deviation and makes every real rotation player look closer to average than they are.
- **Rated population** — every row with `MP > 0` and all four metrics present. Low-minute players are rated *against* the qualified reference distribution; they just don't get a vote in defining it.

**Missing-metric rule.** A row with `MP = 0`, or with any of the four metrics null, is **not ingested as a player-season at all**. Across all 46 seasons this is exactly three rows (Alex Scales 2005-06, JamesOn Curry 2009-10, Damion James 2012-13), all with `MP = 0`. They never took the floor, so there is nothing to rate and no reason for them to appear in a draft pool. This keeps `PlayerSeason.overallRating` non-nullable in the schema.

Note the empirically-confirmed correction to an earlier assumption: **advanced metrics are not missing in the early 1980s.** They are populated on every real player row from 1981 onward. The only gap is the undefined-ratio case above. There is no era-based fallback rule because there is no era-based gap.

**Traded players** already collapse to one row per `PlayerSlug` per season in Phase 7 (stats from the `nTM` combined row). One player-season, one rating, whichever of his teams offers him — which is exactly what the once-per-run duplicate rule wants.

---

## 4. Stage 1 — Per-season standardization

For each season *s* and each metric *m* ∈ {PER, BPM, WS/48}, compute the mean μ and population standard deviation σ **over the qualified reference population of that season**, then:

```
z_m = (value − μ_s,m) / σ_s,m
```

Why per-season rather than one pooled 46-season distribution: all three metrics are already league-anchored by construction, and the measured means bear that out (PER 14.0–14.6, WS/48 .092–.097 across 1981→2026). But the *spread* drifts — σ(PER) runs 3.79 in 1980-81 against 4.60 in 2022-23 — and league size nearly doubled. Standardizing within season means a rating always answers "how far above his own league was he", which is the only question that makes cross-era drafting fair.

---

## 5. Stage 2 — Rate composite and reliability shrinkage

```
z_rate = 0.30·z_PER + 0.40·z_BPM + 0.30·z_WS/48
```

BPM carries the most weight because it is the only two-way, possession-normalized input. PER and WS/48 split the remainder evenly and pull in opposite directions — PER over-credits high-usage scorers, WS/48 over-credits efficient role players on strong teams — so the blend cancels part of each one's bias.

Small minute samples make all three metrics wild. Shrink toward a replacement-level prior:

```
λ = MP / (MP + 400)
z_rate_adj = λ·z_rate + (1 − λ)·(−1.0)
```

λ is 0.33 at 200 minutes, 0.56 at 500, 0.83 at 2000, 0.86 at 2500. The prior −1.0 is roughly where a replacement-level NBA player sits on the composite z scale. The effect is that an unproven player must earn his rating with minutes, and it doubles as an availability penalty: Michael Jordan's injury-shortened 1985-86 (18 games, 451 MP) rates 83 rather than his usual high 90s — correct behaviour for a game where you are drafting a season, not a name.

K = 400 was chosen so that the highest rating achievable under 200 minutes is 68 (a rotation-quality number, not a star one) while full-season starters lose only ~15% of their edge.

---

## 6. Stage 3 — Volume term

VORP is strongly right-skewed (a 2022-23 league where the mean is 0.83 still produces an 8.8), so z-scoring it raw would hand the top player a z near 6 and dominate the composite. Compress first:

```
v' = sqrt(VORP + 2.5)          // +2.5 keeps the argument positive; VORP floors near −2
z_VORP = (v' − μ_s,v') / σ_s,v'
```

The shift-and-square-root pulls the distribution close to symmetric before standardization, and is applied to the reference population the same way.

---

## 7. Stage 4 — Composite and the 0–100 map

```
C = 0.75·z_rate_adj + 0.25·z_VORP
```

75/25 rather than 50/50 because VORP is a function of BPM and therefore already partly represented inside `z_rate`; a quarter weight adds the volume dimension without counting impact twice.

Map `C` to the rating with a logistic, not a linear scale:

```
overallRating = 25 + 75 / (1 + exp(−(C + 0.316) / 1.072))
```

A logistic is the right shape here for two reasons: it can never leave the [25, 100) band no matter how extreme an outlier season is (no clamping, no arbitrary truncation), and it compresses the tails while keeping the middle linear — which matches how basketball quality actually reads, where the gap between the 8th and 20th best player in a league is larger than the gap between the 1st and 8th.

The two constants are not tuned by feel; they are solved from two anchors:

| Anchor | Meaning | Target |
| --- | --- | --- |
| C = 0 | League-average qualified rotation player | 68 |
| C = 4.3 | The best single season in the 1981–2026 range | 99 |

68 for the average rotation player rather than 50 is deliberate: the draft pool is playoff rosters, and the hand-built Phase 4 fixtures (mean 68.4, range 44–98) established the band the UI was designed against. The engine has to land in the same band or every card in the draft board reads wrong.

Rating is stored rounded to an integer.

---

## 8. Validation

Run against all 46 parsed seasons (20,260 rated player-seasons).

**Distribution** — full league, all seasons:

| Percentile | 1 | 5 | 10 | 25 | 50 | 75 | 90 | 95 | 99 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rating | 42 | 46 | 48 | 52 | 58 | 69 | 79 | 85 | 94 |

Min 34, max 99. Roughly: 40s = fringe/deep bench, 50s = bench, 60s = rotation, 70s = starter, low 80s = very good starter, high 80s = All-Star, 90+ = MVP candidate, 97+ = an all-time season.

**Top seasons produced** (no name list was used as input — this is the formula's own output):

```
99  1987-88 Michael Jordan      99  2008-09 LeBron James
99  2009-10 LeBron James        98  1993-94 David Robinson
98  2021-22 Nikola Jokić        98  2012-13 LeBron James
98  2024-25 Nikola Jokić        98  1988-89 Michael Jordan
98  2015-16 Stephen Curry
```

MVP seasons, MVP+DPOY seasons, and the 73-win Curry year, spread across four decades — the era-neutrality goal is met.

**Low-minute guard:** the highest rating any season under 200 minutes receives is 68.

**Worked example**, 2022-23 (reference population n = 367; μ/σ: PER 14.379/4.595, BPM −0.401/2.821, WS/48 .097/.055, v' 1.792/0.344):

| Player | MP | PER | BPM | WS/48 | VORP | z_rate | λ | z_rate_adj | z_VORP | C | Rating |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nikola Jokić | 2323 | 31.5 | 13.0 | .308 | 8.8 | 4.169 | .853 | 3.410 | 4.568 | 3.699 | **98** |
| Jalen Brunson | 2379 | 21.2 | 3.9 | .175 | 3.5 | 1.481 | .856 | 1.124 | 1.913 | 1.321 | **87** |
| Kevon Looney | 1958 | 17.8 | 2.1 | .212 | 2.0 | 1.205 | .830 | 0.831 | 0.958 | 0.863 | **81** |
| Cody Zeller | 217 | 16.4 | −2.8 | .147 | 0.0 | 0.065 | .352 | −0.626 | −0.614 | −0.623 | **57** |

**Known limitations**, accepted rather than fixed:

- **WS/48 team-context bias.** Looney at 81 is the visible case — a role big whose win shares ride a 50-win team. The 0.30 weight caps how far this can push a player, and PER/BPM pull back against it.
- **Defense is under-measured.** Box-score metrics see blocks and steals; they do not see a Bruce Bowen-type wing stopper, who lands in the 50s–60s. Fixing this needs tracking or on/off data that does not exist for 1981.
- **Era mix, not era level.** Standardizing within season deliberately cannot answer "was the 1981 league weaker than the 2026 league" — it assumes each league's top is comparable. That assumption is the price of a playable cross-era draft.

---

## 9. Tunable constants

Every number the engine can be argued about lives in one place:

| Constant | Value | Meaning |
| --- | --- | --- |
| `QUALIFIED_MINUTES` | 500 | Reference-population minutes floor |
| `RATE_WEIGHTS` | PER .30 / BPM .40 / WS48 .30 | Rate composite blend |
| `SHRINKAGE_K` | 400 | Minutes at which λ = 0.5 |
| `REPLACEMENT_PRIOR` | −1.0 | Composite z shrunk toward |
| `VORP_SHIFT` | 2.5 | Offset inside the sqrt |
| `VOLUME_WEIGHT` | 0.25 | z_VORP share of C |
| `RATING_FLOOR` / `CEILING` | 25 / 100 | Logistic asymptotes |
| `LOGISTIC_CENTER` / `SCALE` | −0.316 / 1.072 | Solved from the §7 anchors |

Because `player_season_data` stores the raw metrics, changing any of these is a recompute, never a re-scrape.

---

## 10. Out of scope

- **Team-season ratings** — aggregating a roster into one team number (minutes-weighted? top-8? include team playoff result?) is a different question with different failure modes. Separate document.
- **Position-relative ratings** — deliberately rejected in §2.
- **Playoff-performance adjustment** — the parsed playoff CSVs could support a small modifier later; the sample size makes it a bad idea for the base rating.
