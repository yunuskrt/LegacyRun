# Phase 20 (part 3) — Tournament Bracket Motion

## Overview

Animate the bracket stage of `/play/tournament`: the round reveal after a series
win, the winner resolving on a decided matchup, the champion stub unlocking, the
difficulty meter filling, and the mobile spine expanding.

Source: `context/docs/motion-animation.md` §Tournament bracket (items 8–12).

Depends on **part 01** for tokens and reduced motion. Part 05 (result screen)
comes after this one, because the result screen's bracket archive is the same
`BracketLadder` / `BracketSpine` in `readOnly` mode.

Item 8 is the "rounds" the Phase 20 todo line names, and it is currently a hard
cut. It is the centrepiece of this part.

## The spoiler hazard — Phase 16's lesson, restated

Phase 16 shipped a defect where far-half scores leaked because `MatchupCard`
read `series` directly instead of through the masked matchup. The fix was
`visibleSeriesFor(matchup, series)`.

**Motion can leak the same information in a new way.** An animation that fires
because a far-half series resolved tells the player something the masking is
trying to withhold.

- Every animation in this part must be driven by the same masked values the
  render is driven by — never raw `series`, never `matchup.winner`, never
  `bracket.rounds` unmasked.
- A far-half result must not advance the reveal or animate anything.
  `revealedThroughFor(bracket)` already refuses to count it (pinned by a Phase 16
  test); the animations inherit that refusal rather than re-deriving it.

This is the one hazard in this part. Animations are otherwise plain mount and
state-change entrances — keep them that way.

## Items

### 8. Round reveal — `BracketLadder` / `MatchupCard`

When the squad wins a series and the next round unlocks, the newly-visible
matchups fade and rise in. Currently a hard cut.

- A round holds at most two visible matchups plus, at the Finals, the champion
  stub. Stagger them with `staggerDelay` — a 2–3 item stagger inside the cap is
  ~120ms end to end, which is the right amount of "one after the other".
- **Slot visibility and winner visibility are different rules** (Phase 16): a
  slot is visible when `index - 1 <= revealed`, a winner when
  `index <= revealed`. The reveal animation attaches to slots appearing, not to
  winners appearing — those are item 9.
- Key the entrance on the matchup id via `AnimatePresence` so a round that
  becomes visible animates in, rather than appearing between frames.
- On the mobile spine the same reveal applies to the spine row, not to the
  desktop column.

### 9. Winner resolve — `TeamSlotRow`

The strike-through and score appearing on a decided matchup.

- The score badge is the primary motion: fade + a small rise into place.
- The strike-through is CSS `line-through` on a `<p>`. Animating a strike
  genuinely growing requires a pseudo-element or an overlaid rule and is more
  machinery than it earns. **Crossfade the row's colour into
  `text-muted-foreground` and let the strike appear with it.** Simple beats
  clever here.
- **The squad's own row must strike through when the squad loses.** Phase 16
  found this missing at 768 and fixed it; the animation must apply to the
  `SQUAD` branch of `TeamSlotRow`, not only the opponent branch.
- Scores are read via `seriesScoreLabel(visibleSeriesFor(...), side)`. Do not
  reach past that.

### 10. Champion stub unlock — `FinalsChampionStub`

The flip from the locked state (`Unknown`, a lock glyph, `3 ROUNDS AWAY`) to the
real other-conference champion at the Conference Finals.

- A crossfade between the two branches, with the revealed team's crest and name
  rising slightly. This is one of the few genuinely dramatic moments in the run —
  it can be the longest transition in the bracket, at `DURATION.base`, but still
  a crossfade, not a flip or a spin.
- **`finalsOpponent(bracket)` returns the drawn champion at all times; the lock
  lives in the caller** (`isFinalsOpponentRevealed`). Phase 16 shipped the 1985
  Lakers into Round 1 by forgetting this, and the type cannot prevent it — both
  branches return `BracketOpponent | null`. **The animation must be driven by the
  same guard**, or the reveal transition itself becomes the leak.

### 11. Difficulty meter fill — `DifficultyMeter`

The three dots filling left-to-right on mount rather than appearing full.

- A per-dot opacity/scale step of ~40ms each, ~120ms total. Do not add a sweeping
  bar — the dots are the meter.
- Only the **filled** dots animate; the unfilled track renders immediately, or
  the meter reads as three dots appearing rather than a level being set.
- The `dimmed` variant (eliminated rows) does not animate — it is a past result,
  not a reveal.
- `DifficultyMeter` appears in every non-compact `TeamSlotRow`, so up to ~10 of
  them can be on screen at once. Keep the per-dot step at the low end and let
  them all run together rather than staggering the meters against each other.
- Part 02 adds a matching dot indicator to `RerollPool`; the two treatments
  should look like the same system.

### 12. Mobile spine expand — `BracketSpine`

Height transition on `Show full bracket`.

- `showFull` toggles a list of sibling matchups into each round. Animate the
  height with `AnimatePresence` + `height: auto`, plus a fade — one transition,
  not a per-item stagger, or a four-round expand becomes a cascade.
- `BracketSpine` opens expanded when `readOnly` (`useState(readOnly)`), so the
  archive arrives already expanded. Confirm that state does not read as a
  collapsed-then-expanded flash on arrival.
- **Known issue to sweep here, not later**: `Show full bracket` and the squad-rail
  toggle are 41px and 36px at 390, under the 44px touch target. Phase 16 found
  them; Phase 18 set the 44px rule for the control bar and left these. Fix both
  while touching the spine.

## Layout stability

The bracket is a 4-column grid at `lg`, `justify-around` columns, with a
per-column `::before` tick as the connector rather than SVG — chosen in Phase 16
precisely because nothing is positioned against anything else's measured height.

**Do not introduce layout animation that changes column heights.** Team names
`break-words` and wrap to two lines, so card heights already vary; an animated
height would move the connector ticks and neighbouring cards. Opacity and
transform only, except item 12's deliberate height transition on the spine.

## Responsiveness

Verify at 1440, 1280, 1024, 768, 390. No horizontal page scroll.

- 1024 is the tight one — four columns with wrapped names. Phase 16 checked it
  at one bracket state only; check the reveal there specifically.
- 768 and below is the spine, not the ladder.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`. `/play/tournament`
  still prerenders static.
- Keep Phase 16's **grep tests** green: no bracket component may reference
  `bracketSlot` or `teamRating`. If a new component is added here, add it to the
  grep list.
- If any masking or reveal decision is written for this part, it goes in
  `src/lib/tournament-view.ts` with a test — components are not tested, so a rule
  left inline is a rule nothing can pin. Mutation-check at least the "a far-half
  result does not trigger the reveal animation" rule.
- Browser at 1440×1000 and a true 390×844 (remember `browser_resize` scales by
  4/3 on this machine — request `width × 0.75`), zero console errors, playing a
  real run against live Neon:
  - Win Round 1 and watch the next round reveal.
  - Confirm no far-half matchup animates or shows a score before its round is
    revealed.
  - Reach the Conference Finals and watch the champion stub unlock — and confirm
    it stays locked at every earlier round.
  - Lose a series and confirm the squad's own row strikes through with the
    opponent's score, squad-side ordering correct.
  - Expand and collapse the mobile spine; measure both toggles at ≥44px.
- Reduced motion emulated: the reveal, the unlock, the meter and the spine all
  resolve instantly, with no information hidden or shown differently.
- **Reaching the later rounds by playing is not reliable** — four phases of
  evidence (16, 17, 18, 19) say most runs go out in Round 1 or the Semifinals.
  Plan a forced route for the Conference Finals and Finals checks. Phases 16 and
  19 both used a temporary `?dev=champion` shortcut that reseeded `playMatchup`
  until the squad won, so games and logs stayed real, and **deleted it before
  commit** — `grep` for `dev=champion`, `DEV SHORTCUT`, `devWin` must return
  nothing.

## Out of scope

The replay (part 04) and the result screen (part 05). `bracketSlot` stays
unrendered by design. The single-bracket debt (only the run's own conference has
a bracket) is a Phase 14 decision and is not reopened.

## References

- `context/docs/motion-animation.md` — §Tournament bracket, items 8–12
- `context/features/phase-20-motion-foundation-01.md` — tokens, reduced motion
- `context/features/phase-16-tournament-shell-bracket-ui.md` — the stage machine,
  masking, the reveal derivation
- `context/docs/tournament-ui-design.md`, `context/docs/bracket-generation.md`
  §10 (why the Finals opponent is a stub)
- `context/current-feature.md` — Phase 16 History (the score leak, the champion
  revealed in Round 1, the un-struck squad row, the 44px findings, the grid
  rationale, the `browser_resize` scaling), Phase 19 (the `readOnly` archive)
- Code: `src/components/tournament/` — `BracketLadder`, `BracketSpine`,
  `MatchupCard`, `TeamSlotRow`, `DifficultyMeter`, `FinalsChampionStub`,
  `TournamentStage`; `src/lib/tournament-view.ts` (`visibleRounds`,
  `visibleSeriesFor`, `revealedThroughFor`, `matchupCardState`,
  `seriesScoreLabel`, `difficultyBand`)
