# Phase 18 - Modes, Speeds & Series Flow

## Overview

Wrap Phase 17's replay in its controls and complete the series as a unit: a
face-off before game 1, seven games chained by mode, and a won/lost card at the
end that hands back to the bracket or on to the result.

Design source: `context/docs/tournament-ui-design.md` §3 (decisions), §5
(pacing); `context/docs/match-simulation.md` §6. Reference mockups:
`desktop-series-start.png` (B1), `desktop-series-won.png` (B6),
`desktop-series-lost.png` (B7), and the control bar in
`desktop-series-stats.png`.

This phase removes the last of Phase 16's instant-resolve seam. After it, a
series is watched, never printed.

## Requirements

- Hard constraints 10 and 11 are structural, not remembered: **speed changes
  presentation pacing only**, and **Manual/Automatic are switchable at any
  time**, including mid-replay. Both are free because the log is already
  computed — do not add anything that makes them conditional.
- Mode and speed are **run-level preferences**, held beside the run and carried
  across games and rounds. They are not per-game state.
- Control state changes must never restart a game or move the cursor.

## Controls

| Control | Values | Behaviour |
| --- | --- | --- |
| Speed | `SLOW \| NORMAL \| FAST` | Segmented; rescales `eventDelayMs`. **Applies from the next event tick** — an in-flight score tween finishes at its old rate |
| Mode | `MANUAL \| AUTOMATIC` | Toggle; decides only whether advancing needs a click |
| Skip to final | action | Ends **the current game only**, jumping the cursor to the end via `jumpToEnd`. Styled clearly secondary — never competing with the speed control |

**`Skip to final` is per-game, not per-series.** A per-series skip collapses up
to five games at once and is much closer to what `match-simulation.md` §6.1
warns against. Recorded as decided, not overlooked.

**Fast is fast, not instant.** Even at `FAST` the run of play must read as a
game (~9s). If `FAST` ends up indistinguishable from a skip, the factor is wrong.

## Squad name - "Dynasty Five" is mockup filler

`Squad.name` is optional. The face-off and both series cards print
`DYNASTY FIVE` in the mockups; that is placeholder text, not a default.

- **Name set** → render it verbatim in the face-off crest label and in the
  `SERIES WON` / `SERIES LOST` card.
- **Name not set** → render **`YOUR SQUAD`**, via `squadDisplayName(squad)` from
  Phase 16's `src/lib/tournament-view.ts`. Never substitute `Dynasty Five`.
- The face-off shows the name **and** a `YOUR SQUAD · AVG 91` sub-label. When
  falling back, drop the redundant `YOUR SQUAD` from the sub-label and keep the
  rating — the crest must not read `YOUR SQUAD` twice.

## Series flow

```text
B1 face-off  →  B2/B3/B4 game replay  →  B5 game final
                        ↑                      │
                        └── next game ─────────┘
                                               │
                                    B6 series won  → bracket (Phase 16)
                                    B7 series lost → result (Phase 19)
```

| Transition | Manual | Automatic |
| --- | --- | --- |
| Face-off → game 1 | auto, ~2s | auto, ~2s |
| Quarter break | auto, ~1.5s scaled | auto, ~1.5s scaled |
| Game final → next game | click `Next Game` | ~2s beat |
| Series won → bracket | click `Continue to …` | auto after the card lands |
| **Series lost → result** | **click, always** | **click, always** |

**A loss always waits for a click, in both modes.** Auto-advancing past the one
moment the player most wants to sit with is the wrong kind of smooth. This is a
recorded decision (`tournament-ui-design.md` §3).

## Screens

**B1 Series intro / face-off.** Full-screen, ~2s: round name as a wide-tracked
overline, two crests across a centered `VS`, seed and record on the historical
side, `YOUR SQUAD · AVG 91` on yours, `BEST OF SEVEN` beneath. Plays once per
series, before game 1 only.

**B6 Series won.** `SERIES WON 4-2`, both crests, the game-by-game score list,
gold. CTA names the next round (`CONTINUE TO THE CONFERENCE FINALS`) — or
`CONTINUE TO THE NBA FINALS`, and after the Finals it hands straight to Phase
19's champion screen.

**B7 Series lost.** Same composition, `SERIES LOST 2-4`, red accent, no
celebration, CTA `SEE HOW THE RUN ENDED`.

Both cards may show the full game-by-game list — the series is over, so nothing
is revealed ahead of its replay.

## Control bar placement

Desktop: a full-width bar below the board — speed on the left, mode and skip on
the right, as in `desktop-series-stats.png`.

Mobile: **fixed to the bottom of the viewport**, above the feed's scroll, never
scrolling away. Speed on one row, mode + skip on the next if they do not fit.
Touch targets ≥44px. The Phase 17 mobile mockup shows no control bar; this is
the phase that adds it.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`.
- Unit: the speed factors produce the documented per-game budgets; the
  transition table above resolves correctly for every `(state, mode)` pair,
  including that `SERIES_LOST` never auto-advances.
- Browser at 1440×1000 and 390×844, zero console errors:
  - Switch speed mid-game at each of the three settings and confirm the pacing
    changes without the cursor jumping or the score desyncing.
  - Switch Manual → Automatic mid-game and back; confirm neither restarts the
    game.
  - `Skip to final` ends the current game and stops — it must not chain into the
    next game or resolve the series.
  - Play a full best-of-7 in Automatic without touching the mouse; confirm it
    stops on a loss.
  - Confirm the face-off plays once per series, not once per game.
  - Confirm the control bar stays pinned and fully reachable at 390×844.
  - Play one series with an unnamed squad: the face-off and both series cards
    read `YOUR SQUAD` with no duplicated sub-label, and `Dynasty Five` appears
    nowhere.

## Out of scope

The result and recap screens (19) — B7's CTA may target a placeholder until that
phase lands. Motion polish beyond these transitions (21). Commentary (23).

## References

**Design and decisions**

- `context/docs/match-simulation.md` — §6 (precomputed is what makes mode and
  speed structural), §6.1 (`Fast is fast, not instant`; skipping is a separate
  explicit action)
- `context/docs/tournament-ui-design.md` — §2.3 series states, §3 decisions
  (full replay + explicit skip; a loss always waits for a click), §5 pacing,
  §6 open items (skip granularity)
- `context/project-overview.md` — §E, hard constraint 10 (speed changes pacing
  only) and hard constraint 11 (modes switchable at any time)
- `context/coding-standards.md` — component template, testing scope
- `context/features/phase-17-match-replay-scoreboard.md` — `useReplay`,
  `eventDelayMs`, the speed factors and `jumpToEnd` this phase drives

**Mockups** (`context/screenshots/tournament/`)

- `desktop-series-start.png` — B1 face-off
- `desktop-series-won.png` — B6 · `desktop-series-lost.png` — B7
- `desktop-series-stats.png` — the control bar · `mobile-series-stats.png` —
  which **omits** the control bar; this phase adds the mobile pinned version

**Code**

- `src/lib/replay.ts`, `src/hooks/useReplay.ts` (Phase 17)
- `src/types/match.ts` — `SeriesState`, `GameResult`
- `src/lib/bracket.ts` — `ROUND_LABELS` for the face-off overline and the B6 CTA
- `src/lib/tournament-view.ts` — `squadDisplayName`
- `src/components/play/RunProvider.tsx` — where the run-level speed and mode
  preferences live
