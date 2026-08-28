# Tournament UI Design

The design brief for `/play/tournament` — every state the page can be in, the
decisions behind them, and the prompt used to generate the reference mockups.

**Scope: Phases 16–19.** Live bracket (16), scoreboard and match presentation
(17), mode and speed controls (18), results and run recap (19). They are
specified together because they share one route, one stage machine, and one run
of state — splitting the brief per phase would design four screens that don't
add up to a page.

**This doc is the design source, not the implementation spec.** Mockups
generated from §7 land in `context/screenshots/tournament/`; the per-phase
specs in `context/features/` are written against those.

---

## 1. One route, three stages

`/play/tournament` stays a single route. The run lives only in `RunProvider`
memory (Phase 12), so a route change mid-replay would remount and lose it.

```text
LOADING → BRACKET → SERIES (replay) → BRACKET → … → RESULT
```

| Stage | Owns | Phase |
| --- | --- | --- |
| BRACKET | The 8-slot ladder, one actionable matchup, one CTA | 16 |
| SERIES | Full-screen scoreboard replaying a finished `SeriesState` | 17, 18 |
| RESULT | Victory/defeat recap, run summary, CTAs | 19 |

**The SERIES stage is a cursor, not a computation.** `playMatchup` returns the
whole best-of-7 already decided; the stage walks it as
`{ matchupId, gameIndex, eventIndex }`. This is what `match-simulation.md` §6.1
buys — no network and no arithmetic in the replay loop, so there is nothing that
can stall.

---

## 2. State inventory

Sixteen states across the three stages. Each needs a mobile variant.

### 2.1 Guard and edge

| # | State | Screen |
| --- | --- | --- |
| S0 | No run | Reload or direct nav — "No squad in play" + link back to the draft |
| S1 | Loading | Bracket fetch then roster fetch, presented as one state |
| S2 | Load error | Message + retry |

### 2.2 Bracket stage — one layout, four progressions

| # | State | Resolved | Finals slot |
| --- | --- | --- | --- |
| S3 | Round 1 ready (initial) | Nothing; 4 first-round matchups live | Locked, "3 rounds away" |
| S4 | Conference Semifinals ready | All 4 first-round series, yours and the far half | Locked, "2 rounds away" |
| S5 | Conference Finals ready | Both semifinals | **Reveals here** |
| S6 | NBA Finals ready | Conference Finals | Revealed — now your opponent |
| S3b | *Advance transient* | Result lands → far half resolves → both cards climb | — |
| S5a | *Reveal transient* | Silhouette → champion stub | — |

### 2.3 Series stage — full takeover

| # | State | Screen |
| --- | --- | --- |
| S7 | Series intro | Full-screen face-off, ~2s, then dissolves into the scoreboard |
| S8 | Live game | Scoreboard, clock, line score, momentum, leaders, feed |
| S9 | Quarter break | Feed pauses behind a period summary card |
| S9b | Overtime | An OT column appears; period indicator reframes |
| S10 | Game final | Series dots update **now**; Manual waits, Automatic beats 2s |
| S11 | Series won | 4-2 card, celebratory, returns to the bracket |
| S12 | Series lost | 2-4 card, waits for a click in **both** modes |

### 2.4 Result

| # | State | Screen |
| --- | --- | --- |
| S13 | Champion | Crown, recap, path, CTAs |
| S14 | Eliminated | Same skeleton, four variants by round reached |
| S15 | Bracket archive | The final bracket, frozen and read-only |

---

## 3. Decisions

Each of these was a live choice; recorded so the mockups and the build don't
re-litigate them.

**The Finals opponent is locked until the Conference Finals.** The slot and the
distance to it stay visible, so `project-overview.md` §D's "always sees how far
the Finals are" still holds, but the team is a silhouette until S5. The reveal
becomes a moment instead of a three-round spoiler. Offered as the cheap option
in `bracket-generation.md` §10; taken.

**Every game replays in full, with an explicit Skip.** A best-of-7 at Normal is
roughly three minutes; a run is around twelve. Condensing to key moments was
rejected — it invents a derived layer and thins out the run of play. `Skip to
final` ends the current game only and is styled clearly secondary, per §6.1's
"skipping to the result is a separate, explicit action".

**The series stage is a full takeover.** The bracket cross-fades out and returns
for the advance animation. A persistent bracket rail would keep context, but
every card on it is a surface a result can leak through; removing it removes the
whole class of bug.

**The squad rides along in a persistent rail.** The five players stay visible
above the bracket rather than hiding behind a button — it is the run's identity
header as much as a roster.

**The result is a full page, with a way back to the bracket.** S15 exists so the
path taken survives the ending. An overlay was rejected: it reads as a modal, not
a conclusion.

**A loss always waits for a click.** S12 holds in Automatic mode too. Auto-
advancing past the one moment the player most wants to sit with is the wrong
kind of smooth.

---

## 4. Invariants the design must not break

These come from decisions recorded elsewhere. A mockup that violates one cannot
be built without reopening the decision behind it.

1. **`bracketSlot` is never rendered.** It is a layout position that looks like a
   seed and is not one — a "1" can sit above a "7". Only `opponent.seed`, the
   real historical seed, may appear as a number next to a team.
   (`bracket-generation.md` §8.)
2. **There is no second bracket.** The Finals opponent is drawn, not played into.
   It renders as a standalone other-conference champion stub — logo, franchise,
   season, real seed, real record. Never a mirrored ladder, never TBD slots.
   The signal is `bracketSlot === null`, not the round id. (§10.)
3. **Nothing reveals ahead of the replay.** Series dots, line score, and the
   bracket read from the replay cursor, never from the finished `SeriesState`.
   A component that takes `SeriesState` directly can leak.
   (`match-simulation.md` §6.1.)
4. **Points are the only stat.** `MatchEvent` carries no rebounds, assists, or
   shot attempts because the database holds none. Inventing one next to a real
   player is what the data rules forbid. (`match-simulation.md` §7.)
5. **Speed never skips.** Slow/Normal/Fast scale the game clock; even Fast reads
   as a game. (Hard constraint 10.)
6. **Pedigree is not shown raw.** `P76` is engine-speak. It maps to a banded
   label — Contender / Elite / Legendary — plus pips.

---

## 5. Pacing model (Phase 17)

The replay is driven by `MatchEvent.clock` deltas: game-seconds between
consecutive events × a speed factor → real milliseconds, clamped at roughly a
120ms floor and a 1.2s ceiling so nothing blurs or stalls. At ~93 scoring events
per game that lands near 25s at Normal, 45s Slow, 9s Fast.

Quarter breaks pause the feed in **both** modes — Manual gates game-to-game and
round-to-round, not quarter-to-quarter. Scores tween between the running totals
already on every event; they never jump.

---

## 6. Open at time of writing

- **Reveal sequencing.** When a series ends, the bracket returns, the far half
  updates, and your card climbs a round. Proposed order: result → 400ms → far
  half resolves → 400ms → both advance together. Simultaneous reads as noise.
- **Skip granularity.** Per-game as specced. A per-series skip is what a player
  reaches for at 0-2 down, but it collapses up to five games at once and sits
  much closer to what §6.1 warns about.
- **Phase boundary with Phase 21.** Stage cross-fades, score tweens, and the
  advance animation are mechanics these phases depend on, not polish. Phase 21
  takes the draft reveals and the flourishes; otherwise 16–19 ship feeling broken
  and 21 becomes a rewrite.
- **Run state is still not persisted.** A reload loses the run, its bracket, and
  its results — including the result screen. Phase 19 either accepts that or is
  where `sessionStorage` finally lands.

---

## 7. The mockup prompt

Generated with Lovable; screenshots return to `context/screenshots/tournament/`.

**Paste the fenced block only — not §1–§6.** Those sections are engineering notes
(Prisma types, phase numbers, `RunProvider`, the pacing math) and reading them as
instructions pushes the tool toward building real logic instead of a mockup. The
block is written to stand alone. Copy it whole: the hard-rules section is
load-bearing and carries §4.

Expect to run it in batches — asking for all 17 screens in one generation
produces thin work on the later ones. Suggested split: **A (bracket) → B (series)
→ C+D (result and edge)**, each as a follow-up on the same project so the design
language carries over.

Target is **23 screenshots**: 17 desktop (A1–A4, B1–B7, C1–C3, D1–D3) plus 6
mobile (A1, A3, A4, B2, C1, C2 at 390px). Both counts are stated inside the block,
so they survive being pasted on its own.

The six mobile screens are the ones whose layout changes structurally rather than
scaling — the ladder becomes a vertical path spine, the squad rail becomes a
bottom sheet, the live game becomes a single column with a viewport-fixed control
bar. They get their own section at the end of the prompt because a generator
treats responsiveness stated only as a constraint as optional. Check them first
when the mockups come back.

Ask for the control strip (screen switcher + width toggle) explicitly, or you get
one screen at one width and re-prompt twenty-two times.

```markdown
# LegacyRun — Tournament Page UI Design

Design a **dark, premium, broadcast-feeling** tournament screen for LegacyRun, a browser
NBA simulation game. The player has already drafted a 5-man superteam from real historical
NBA rosters (1980–2026). This page is where that team plays a playoff bracket against real
historical teams.

**This is a design/mockup task.** Build a static React + Tailwind prototype with mock data
and NO backend, NO real logic, NO API calls. Add a fixed **control strip** pinned top-right,
outside the design, holding two things: a **screen switcher** (dropdown, every state by its
label) and a **width toggle** (`Desktop 1440` / `Tablet 768` / `Mobile 390`) that constrains
the design's viewport so each layout can be viewed and screenshotted without resizing the
browser. Every screen must be a complete, polished, screenshot-ready composition at every
width the toggle offers.

**Deliverable 1 — 17 desktop screens:** A1–A4 (4 bracket states), B1–B7 (7 series states),
C1–C3 (3 result states), D1–D3 (3 edge states). All 17 must be reachable from the switcher
by their label. Do not merge, skip, or combine any of them.

**Deliverable 2 — 6 mobile layouts.** These are not the desktop screens scaled down; they
are structurally different compositions and must be designed as such: **A1, A3, A4, B2, C1,
C2** at 390px. See the MOBILE LAYOUTS section at the end — it is the most important part of
this brief after the hard rules, and the part most likely to be skipped.

---

## Design language — "Dark Trophy Room"

Dark mode only, no light mode. Use these exact colors:

| Role | Hex |
|---|---|
| Page backdrop | `#08101C` with radial gradient `radial-gradient(120% 90% at 50% -10%, #1B2942, #050B16 70%)` |
| Card / panel | `#121B29` |
| Secondary surface | `#1F2939` |
| Muted surface | `#1C2432` |
| Border | `#293342` |
| Primary text | `#EEF2F7` |
| Muted text | `#9099A7` |
| **Gold accent** (CTAs, your team, highlights) | `#EDB333`, gradient to `#F6D56B` |
| Text on gold | `#231103` |
| Destructive / elimination | `#DE3B3D` |
| Court floor | `#172031`, court lines `#79879C` at 45% |

Position colors (for the squad's players): PG `#00D1DA` · SG `#B58BF9` · SF `#46CE83` ·
PF `#FF9045` · C `#FB7188`.

Gold glow for elevated/important elements: `box-shadow: 0 24px 60px -24px #EDB33373`.
Panel shadow: `0 24px 60px -30px #000000CC`.

**Feel:** trophy room, not a sports app. Deep navy, restrained gold, generous spacing,
crisp uppercase micro-labels with wide letter-spacing, large confident numerals for
scores. Think a premium broadcast graphics package. Avoid: neon, glassmorphism, purple
gradients, emoji, stock illustration.

Team logos: use circular placeholders with the 3-letter team code (`CHI`, `NYK`, `GSW`).

---

## Mock data to use throughout

**Your squad:** "DYNASTY FIVE" · Eastern Conference · avg rating 91
- PG Magic Johnson · 1991 Lakers · 96
- SG Michael Jordan · 1996 Bulls · 98
- SF LeBron James · 2013 Heat · 97
- PF Tim Duncan · 2003 Spurs · 94
- C Shaquille O'Neal · 2000 Lakers · 95

**Your path (opponents get harder each round):**
- Round 1: 2005 Indiana Pacers · 6 seed · 6-7 playoff record · difficulty **Contender**
- Conference Semifinals: 1993 New York Knicks · 1 seed · 9-6 · difficulty **Elite**
- Conference Finals: 1989 Detroit Pistons · 1 seed · 15-2 · difficulty **Legendary**
- NBA Finals: 2017 Golden State Warriors · 1 seed · 16-1 · **Western Conference Champion**

**The full 8-slot ladder.** The four Round-1 matchups, and who advances — use this exact
progression so every bracket screen stays consistent. No franchise appears twice.

| Round 1 | Winner → Semifinals | Winner → Conference Finals |
|---|---|---|
| **DYNASTY FIVE** vs 2005 Indiana Pacers (6 seed · 6-7) | Dynasty Five (4-1) | Dynasty Five (4-2) |
| 1993 New York Knicks (1 seed · 9-6) vs 2004 New Jersey Nets (2 seed · 4-7) | 1993 Knicks (4-3) | — |
| 1989 Detroit Pistons (1 seed · 15-2) vs 2010 Orlando Magic (2 seed · 8-6) | 1989 Pistons (4-0) | 1989 Pistons (4-1) |
| 1986 Milwaukee Bucks (1 seed · 6-8) vs 2001 Philadelphia 76ers (1 seed · 12-11) | 2001 76ers (4-2) | — |

So: you beat the Pacers, then the Knicks, then meet the 1989 Pistons in the Conference
Finals, then the 2017 Warriors in the NBA Finals. Two teams carrying a "1 seed" badge in
the same bracket is correct and intentional — these are each team's real historical seed
from its own season, not a position in this bracket.

---

## SCREENS TO DESIGN

### A. Bracket screens (4 states, same layout, different progression)

The bracket is **one conference only, 8 slots**: Round 1 (4 matchups) → Conference
Semifinals (2) → Conference Finals (1) → NBA Finals (1). Left-to-right ladder with drawn
connector lines.

Every matchup card shows both teams: circular logo, `2005 Indiana Pacers`, a **seed badge**
(`6 SEED`), playoff record (`6-7`), and a **difficulty meter** — 3 named bands
(Contender / Elite / Legendary) shown as a label plus filled pips. Your squad's card is
visually distinct: gold border and glow, `YOUR SQUAD`, the squad name, avg rating.

Matchup card states to show: `upcoming` (dimmed), `next` (gold ring — the only actionable
one), `won` (winner solid + series score `4-2`, loser dimmed and struck through).

**A1 — Round 1 ready (initial state).** All 4 Round-1 matchups populated. Semifinals and
Conference Finals slots empty/pending. Your matchup has the gold ring. Primary CTA:
**"Play First Round"**. NBA Finals slot is a **locked silhouette card** (see rule below).

**A2 — Conference Semifinals ready.** All Round-1 results resolved (yours AND the other
three), winners advanced into the two semifinal matchups. Your card sits in its semifinal
slot with the gold ring. CTA: **"Play Conference Semifinals"**. Finals still locked,
countdown now reads "2 rounds away".

**A3 — Conference Finals ready.** Semifinals resolved, one Conference Finals matchup live.
**This is the screen where the Finals opponent reveals** — design the revealed champion
stub here (see rule below). CTA: **"Play Conference Finals"**.

**A4 — NBA Finals ready.** Conference Finals resolved, your squad in the NBA Finals against
the revealed 2017 Warriors. Championship framing — heavier gold, trophy motif. CTA:
**"Play the NBA Finals"**.

**HARD RULES for the bracket — these are gameplay-critical, not stylistic:**

1. **The NBA Finals opponent is a locked silhouette in A1 and A2.** A dark card labeled
   `WESTERN CONFERENCE CHAMPION`, a shadowed/unknown crest, `Revealed at the Conference
   Finals`, and the distance (`3 rounds away` / `2 rounds away`). In A3 and A4 it is
   revealed as a full **champion stub** — logo, `2017 Golden State Warriors`, `1 SEED`,
   `16-1`, still labeled `WESTERN CONFERENCE CHAMPION`.
2. **Never draw a second bracket, a mirrored ladder, or empty "TBD" slots for the other
   conference.** There is no second bracket. The champion stub is a single standalone card
   attached to the Finals matchup.
3. **Never display internal slot/position numbers next to teams.** Only the real historical
   seed (`1 SEED`, `6 SEED`) may appear as a number.
4. No rebounds, assists, shooting percentages or any stat other than **points** anywhere in
   this design. Do not invent stats.

**Persistent squad rail:** a slim always-visible strip at the top of every bracket screen —
squad name, conference, avg rating, and the five players with position-colored badges,
names and ratings. On mobile it collapses to a single summary bar that opens a bottom sheet.

---

### B. Series screens (full-screen takeover — the bracket is NOT visible here)

**B1 — Series intro / face-off.** Full-screen ceremonial moment, ~2 seconds. Round name
(`CONFERENCE SEMIFINALS`) as a wide-tracked overline, two crests facing off across a
centered `VS`, each with team name, seed, record, your squad in gold. Footer: `BEST OF SEVEN`.

**B2 — Live game (the main screen).** Compose:
- **Series banner** (top): both teams, `GAME 4`, venue indicator (which team is at home),
  and **series dots** showing wins so far — e.g. ● ● ○ for 2-1.
- **Scoreboard** (hero): both team scores as very large numerals, current period (`Q3`)
  and game clock (`5:42`) between them. The leading team's score in gold.
- **Line score table**: columns Q1 Q2 Q3 Q4 (+ OT columns only when reached), filling in
  as periods complete. The current period's cell is live/highlighted.
- **Momentum strip**: a thin area/line chart of the score margin over the game so far,
  crossing a center zero line — one team's lead above, the other's below.
- **Scoring leaders**: top 3 scorers per side with running point totals. Points only.
- **Play-by-play feed**: newest at top, e.g. `9:47 Q3 · LeBron James +3 · 78-71`. Include
  small badges on some rows: `AND-1`, `LEAD CHANGE`, `8-0 RUN`.
- **Control bar** (sticky bottom): a segmented **Slow / Normal / Fast** speed control, a
  **Manual / Automatic** toggle, and a secondary **"Skip to final"** button (must read as
  clearly secondary to the speed control, never as the primary action).

**B3 — Quarter break.** Same screen as B2, but the feed is paused behind a centered period
summary card: `END OF 3RD QUARTER`, the period's score, and the period's leading scorers.

**B4 — Overtime.** B2 with an `OT` column added to the line score and an `OVERTIME`
treatment on the period indicator.

**B5 — Game final.** B2 with a `FINAL` state: final score locked in, full line score, full
game scoring leaders, and — only now — the series dots updated to include this game. Action:
**"Next Game"** (Manual mode).

**B6 — Series won.** Full-screen card: `SERIES WON 4-2`, both teams with the game-by-game
scores listed, gold/celebratory, action **"Continue to the Conference Finals"**.

**B7 — Series lost.** Same composition, `SERIES LOST 2-4`, somber — red accent instead of
gold, no celebration. Waits for the player. Action: **"See how the run ended"**.

**Spoiler rule:** in every series screen, the series dots and the line score must only ever
show what has already been played. Never show a final score, a series result, or an
advanced bracket before the game it belongs to is over.

---

### C. Result screens

**C1 — Champion.** Full page. Trophy/crown motif, heavy gold, `NBA CHAMPIONS`, squad name
huge. Then the recap: the five players as cards, the four-round path (each round: opponent,
series score), overall playoff record (e.g. `16-6`), run scoring leader, and a "signature
game" callout (biggest win or a game 7). CTAs: **"Start a new run"** (primary) and
**"Review bracket"** (secondary).

**C2 — Eliminated.** Same layout skeleton, different crown: `ELIMINATED IN THE CONFERENCE
SEMIFINALS`, `1993 New York Knicks won the series 4-2`. Red/muted accent instead of gold,
dignified rather than punishing. Same recap sections, showing only the rounds played. Same
two CTAs.

**C3 — Bracket archive.** The final bracket (as in A4) in a frozen, read-only state — no
CTA on any matchup, every series resolved, a header saying the run is complete, and a
"Back to results" action.

---

### D. Edge states

**D1 — Loading.** `Building your bracket…` — a skeleton ladder or a tasteful gold spinner
over the room gradient. Must not look broken.
**D2 — No run.** `No squad in play` + `Back to the draft` link, centered.
**D3 — Error.** Failed to load, plain message, retry button. Uses the destructive red
sparingly.

---

## RESPONSIVENESS — treat as a requirement, not a polish pass

Design and verify every screen at **1440×900, 1280×800, 1024×768, 768×1024, and 390×844.**
**No horizontal page scroll at any width.** Wide content (line score tables, the ladder)
must scroll inside its own container, never the page body.

**Bracket ladder:**
- ≥1280px: full 4-column left-to-right ladder with connector lines.
- 1024–1279px: same ladder, compressed cards; connectors stay.
- 768–1023px: rounds stack vertically as labeled sections, connectors drop to simple
  vertical indicators.
- <768px: show **your path only** — a vertical spine of your one matchup per round, top to
  bottom, with the locked/revealed Finals card at the bottom. A `Show full bracket` toggle
  expands the other matchups. Do not try to fit 8 slots on a phone.

**Squad rail:** horizontal 5-across ≥1024px; 2-row grid at 768px; a single summary bar on
mobile that opens a bottom sheet with the five.

**Live game:** three-region layout (leaders / scoreboard / feed) on desktop; on tablet the
leaders move under the scoreboard; on mobile it's a single column — series banner,
scoreboard, line score (horizontally scrollable in its own container), momentum strip, feed,
with the control bar pinned to the bottom of the viewport. The scoreboard numerals must
stay large and legible on mobile — scale with clamp(), never shrink to body text.

**Face-off and result screens:** side-by-side crests on desktop become stacked with the `VS`
between them on mobile. Result recap grids go 4-col → 2-col → 1-col.

Touch targets ≥44px. Every control reachable without scrolling past the fold on a 390×844
phone — the control bar and primary CTAs must never be pushed off screen.

---

## MOBILE LAYOUTS — six screens that are redesigns, not shrinks

At 390px these six screens are **different compositions**, not the desktop layout at a
smaller scale. Design each one deliberately and make it reachable from the width toggle.
A mobile screen that is just the desktop screen with smaller text has not been done.

**A1 — Round 1, mobile.** The 4-column ladder is gone. In its place: a **vertical path
spine** showing only YOUR matchup per round, top to bottom — Round 1 (live, gold ring),
Conference Semifinals (pending), Conference Finals (pending), NBA Finals (locked
silhouette, "3 rounds away"). Connected by a vertical line with a round label beside each
node. A `Show full bracket` toggle expands the other three Round-1 matchups inline beneath
their round. The squad rail is collapsed to a single summary bar (`DYNASTY FIVE · EAST ·
91`) that opens a bottom sheet. Primary CTA is a full-width button fixed above the fold.

**A3 — Conference Finals, mobile.** Same spine, mid-run: Round 1 and Semifinals nodes now
show resolved results (opponent, `4-1` / `4-2`, dimmed), the Conference Finals node is live
with the gold ring, and the NBA Finals node at the bottom is the **revealed** champion stub.
Show that the spine scrolls — resolved rounds above, live round centered.

**A4 — NBA Finals, mobile.** Spine fully resolved down to the last node, which is now the
live Finals matchup against the 2017 Warriors with championship framing. The three completed
rounds compress into slimmer summary nodes so the Finals dominates the screen.

**B2 — Live game, mobile.** Single column, in this order: series banner (teams, `GAME 4`,
series dots) → scoreboard (both scores must stay large — clamp() them, never body text) →
line score in its own horizontally scrollable container → momentum strip → scoring leaders
compressed to a 2-column compact list → play-by-play feed filling the remaining height. The
**control bar is fixed to the bottom of the viewport**, above the feed's scroll, and never
scrolls away: speed segmented control on one row, Manual/Automatic and `Skip to final` on
the next if they do not fit on one.

**C1 — Champion, mobile.** Crown and `NBA CHAMPIONS` scale down but stay the hero. Recap
grids collapse to a single column: the five players as a vertical list rather than cards,
the four-round path as a compact timeline, the record and scoring leader as a 2-up stat row.
Both CTAs full-width and stacked, primary on top.

**C2 — Eliminated, mobile.** Same structure as C1 mobile with the elimination treatment —
the round reached and the opponent who ended the run are the hero, red accent, and the path
timeline stops where the run stopped.

For the remaining 11 screens, mobile does not need a separate composition, but the layout
must still hold at 390px with no horizontal page scroll.
```
