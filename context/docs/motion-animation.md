# Motion Animation

## Draft screen — `/play/draft`

1. **Open slot invitation — `CourtSlot`**: a slow breathing glow on slots that can accept the currently-hovered player, replacing the static gold dash.
2. **Slot selection — `CourtSlot`**: the ring/scale change when you click a slot to target it.
3. **Drag-over feedback — `CourtSlot`**: lift + border response as a card is dragged over a valid slot (and a shake/deny on an invalid one).
4. **Roster card hover & press — `RosterPlayerCard`**: subtle lift and shadow; press-down on click.
5. **Reroll spend — `RerollPool`**: the dot extinguishing when a reroll is used, 3 → 2 → 1 → 0.
6. **Progress counter — `DraftTopBar`**: the filled-slot count ticking up, and the bar reaching 5/5.
7. **Squad confirm dialog — `SquadConfirmDialog`**: it currently uses shadcn's CSS transitions; Motion would give it a matching enter/exit, plus a stagger on the five-player review list and a slide on the conference pick.

## Tournament bracket

8. **Round reveal — `BracketLadder` / `MatchupCard`**: the newly-unlocked round fading in after the squad wins a series. This is the "rounds" the todo line names, and it's currently a hard cut.
9. **Winner resolve — `TeamSlotRow`**: the strike-through and score appearing on a decided matchup.
10. **Champion stub unlock — `FinalsChampionStub`**: the reveal when it flips from `3 ROUNDS AWAY` to the actual other-conference champion.
11. **Difficulty meter fill — `DifficultyMeter`**: the bar filling on mount rather than appearing full.
12. **Mobile spine expand — `BracketSpine`**: height transition on `Show full bracket`.

## Match replay

13. **Lead change flash — `ReplayScoreboard`**: a brief accent pulse when the lead flips (the data already knows — `isLeadChange`).
14. **Momentum line draw — `MomentumStrip`**: the SVG path extending with the game rather than redrawing whole.
15. **Scoring leader reordering — `ScoringLeaders`**: `layout` animation so a player moving up the list slides instead of jumping.
16. **Series dot fill — `SeriesBanner`**: the dot filling at the buzzer when a game is decided.
17. **Control bar feedback — `ReplayControlBar`**: a sliding indicator on the Slow/Normal/Fast and Manual/Automatic segments.
18. **Series result card — `SeriesResultCard`**: entrance for the won/lost card and its game lines.

## Result screen

19. **Champion reveal — `RunResultScreen`**: the trophy/banner on a win, and the elimination headline on a loss.
20. **Path list stagger — `RunPathList`**: the four round rows arriving one at a time.
21. **Squad grid stagger — `RunSquadGrid`**: the five players revealing in slot order.

## Global

22. **Route transition** — draft → tournament, and `Start a new run` back to draft.
23. **Reduced-motion support** — honour `prefers-reduced-motion` across everything above.
24. **Shared motion tokens** — one duration/easing set so all of the above match the draft screen's feel instead of each component choosing its own.
