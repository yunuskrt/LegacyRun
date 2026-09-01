# Phase 20 (part 2) — Draft Screen Motion

## Overview

Animate `/play/draft`: open-slot invitation, slot selection, drag feedback,
roster card hover and press, the reroll pool, the progress counter, and the
squad confirm dialog.

Source: `context/docs/motion-animation.md` §Draft screen (items 1–7).

Depends on **part 01** — every duration, easing and stagger comes from
`src/lib/motion.ts`, and reduced motion is already wired. Nothing here defines
its own timing.

This screen is where the house feel was set (Phase 5's slot springs and glow
tuning), so the values part 01 codified were derived from it. Keep it that way:
if something here needs a value that is not in `motion.ts`, add it to
`motion.ts` rather than inlining it.

## Three small UI additions this part builds

The motion doc describes three affordances the components do not yet have.
**Build them.** They are small, they are what the doc's motion is written
against, and animating around their absence would leave the intent unmet.

- **Reroll dots — `RerollPool`.** The pool currently renders the text
  `Rerolls left: 3 / 3`. Add a three-dot indicator beside it, filled for
  remaining rerolls, so item 5's "dot extinguishing, 3 → 2 → 1 → 0" has
  something to extinguish. Keep the numeric text — it is the accessible label
  and the dots are `aria-hidden`. Match `DifficultyMeter`'s existing dot
  treatment in `src/components/tournament/` so the two read as the same system.
- **Progress bar — `DraftTopBar`.** The bar currently renders `{filled}/{total}`
  as text only. Add a five-segment progress bar beneath it (segments, not a
  continuous fill — the count is discrete and five slots are countable at a
  glance), so item 6's "the bar reaching 5/5" is real.
- **Hovered-player awareness — `CourtSlot`.** Item 1 wants the glow on slots
  that can accept the *currently-hovered* player. `CourtSlot` receives
  `position`, `member`, `isOpen`, `isSelected`, `onSelect` and knows nothing
  about the roster, so this needs state plumbed from the board to the court.
  See the next section — the same state also makes item 3 work.

These are additive. No existing prop changes meaning, and nothing about the
Phase 6 draft mechanics changes.

## The preview-player state — items 1 and 3 share it

One piece of state in `DraftExperience`, set by `RosterPlayerCard` and consumed
by `DraftCourt` → `CourtSlot`:

```
previewPlayer: { player: DraftablePlayer; source: "HOVER" | "DRAG" } | null
```

- `HOVER` is set on `onPointerEnter` and cleared on `onPointerLeave`. Pointer
  events, not mouse events, so it does not fire spuriously on touch.
- `DRAG` is set on `onDragStart` and cleared on `onDragEnd` **and** on `drop`.
  `dragend` fires even on a cancelled drag, so it is the reliable clear; clearing
  on drop as well guards against the ordering differing across browsers.
- `DRAG` outranks `HOVER` — during a drag the pointer is over the court, not the
  card, so a stale hover must never win.

The reason this is worth the state: **the browser will not tell you what is being
dragged during `dragover`.** `dataTransfer.getData()` is empty until `drop`, for
security. Holding the dragged player in React state is the only way a slot can
know, mid-drag, whether it would accept the drop — which is exactly what item 3
asks for.

### The eligibility predicate — `src/lib/draft.ts`

Add one pure function beside the existing mechanics:

```
slotAcceptsPlayer(player, position, state): boolean
```

It must give the same answer `validateDraft` would give for that player and that
slot — duplicate identity first, then position, then slot occupancy, in that
order (Phase 9 fixed that ordering, because with one position per player a
cross-season LeBron was reporting `WRONG_POSITION` and hiding the real blocker).

**Derive it from the existing rules rather than restating them.** A second copy
of the eligibility logic that drifts from `validateDraft` means the glow invites
a drop the reducer then rejects. Pin by test that the predicate and
`validateDraft` agree across the fixture set, including a cross-season duplicate
and a filled slot. Mutation-check by inverting one branch.

Components are not tested under `coding-standards.md`, so this predicate is the
only place the rule can be pinned — the same reason Phase 11 lifted the `mode`
dispatch out of `route.ts` and Phase 13 lifted `rerollRequest` out of
`DraftExperience`.

## Items

### 1. Open-slot invitation — `CourtSlot`

A slow, low-amplitude breathing glow, replacing the static gold dash.

- **With a `previewPlayer`**: glow only the slots that `slotAcceptsPlayer`
  approves. That is the doc's intent and the reason for the state above.
- **With no `previewPlayer`**: glow every `isOpen` slot. A board with a team on
  it and no pointer anywhere should still read as inviting, and `isOpen` already
  means "a team is offered and this slot is fillable".
- Very subtle: the existing `shadow-[0_0_0.9rem_-0.7rem_var(--primary)]` easing
  between roughly 0.7× and 1.0× of itself, over ~2.5–3s.
- **This is the app's only permitted looping animation** (part 01). It must not
  play on `isSelected` slots — selection is a stronger state with its own
  treatment, and two competing signals on one slot is the "overwhelming" this
  phase avoids.
- Under reduced motion, render the current static open state. `MotionConfig`
  alone will not stop a loop — check `useReducedMotion()`.
- Phase 5 tuned both glows down on review because they bled over the court
  lines. **A breathing glow that reads correctly in a screenshot is too strong
  in motion.** Start below the value that looks right and check it live.

### 2. Slot selection — `CourtSlot`

The `isSelected` branch already swaps to a solid border, `bg-primary/25` and a
larger shadow. Animate that switch: a ~1.02 scale settle plus the border/shadow
crossfade, on the part 01 spring. One beat, no overshoot.

### 3. Drag-over feedback — `CourtSlot` / `DraftCourt`

Lift and border response on a valid slot, deny on an invalid one.

Drop handling lives in `DraftCourt`, not `CourtSlot` — every slot wrapper
preventDefaults `onDragOver` and reads `PLAYER_DRAG_TYPE` on drop. `CourtSlot`
has no drag props at all, so it gains one: which drag state it is in.

- Track the dragged-over position in local `DraftCourt` state via
  `onDragEnter`/`onDragLeave`, and combine it with `previewPlayer` +
  `slotAcceptsPlayer` to get valid / invalid.
- **Valid**: the slot rises ~4px, its border brightens, and its breathing glow
  steps up to a held (non-breathing) bright state. The glow and the lift are one
  gesture, not two animations.
- **Invalid**: a short deny shake — 2 cycles, ≤6px, ~200ms — plus a muted border.
  It must not repeat while the pointer sits there; fire once on enter.
- `onDragEnter`/`onDragLeave` fire on child elements too and will flicker. Track
  the target position, not a boolean, and clear it on `drop` and `dragend`.
- **The drop path is unchanged.** Every slot still accepts the drop so a mistaken
  one can be reported (Phase 6), and an invalid drop still routes through
  `validateDraft` to the existing toast. The drag-over deny is a preview of that
  rejection, never a replacement for it — a slot must never silently refuse a
  drop.
- Native HTML5 drag still does not work on touch (Phase 6). Nothing here changes
  that, and the mobile path stays click-to-draft — which is why the hover half of
  `previewPlayer` uses pointer events.

### 4. Roster card hover & press — `RosterPlayerCard`

A ~2px lift and shadow on hover, a ~0.98 scale on press. Apply only when the
card is interactive — `isDisabled` cards must not respond at all, or the
availability states Phase 6 built (`OFF_SLOT`, `OUT_OF_POSITION`,
`ALREADY_DRAFTED`) stop reading as blocked.

The board renders up to 23 cards. Keep this to `whileHover`/`whileTap` on
transform and shadow only — no layout-affecting properties, or a 23-card grid
will reflow on every pointer move. The same pointer enter/leave that sets
`previewPlayer` drives this; do not add a second listener.

### 5. Reroll spend — `RerollPool`

With the dots built, item 5 is what the doc says: the rightmost filled dot
extinguishes on each spend, 3 → 2 → 1 → 0.

- Fade + a small scale-down on the dot losing its fill; ~`DURATION.quick`.
- At 0, the three action buttons crossfade into their disabled state.
- **A failed fetch must not consume a reroll** (Phase 13) — the count only
  changes after a team arrives. The animation therefore hangs off `rerollsLeft`
  changing, never off the click.

### 6. Progress counter — `DraftTopBar`

With the bar built: `TweenNumber` on the filled count (reuse the component from
`src/components/tournament/`), each segment filling as its slot is drafted, and
one non-repeating accent pulse across the whole bar at 5/5.

The bar fills in slot order (PG→C), not draft order, so it matches the court.
The count is just `filledSlots`, so nothing needs reordering — the segments are
indexed by slot.

### 7. Squad confirm dialog — `SquadConfirmDialog`

A `motion` enter/exit replacing shadcn's CSS transitions, a stagger on the
five-player review list, and a slide on the conference pick.

- **Cap the stagger** via `staggerDelay` — five rows, ≤300ms total.
- **The conference "slide" is the active-state indicator**, not the buttons
  moving. A `layoutId` shared between the EAST and WEST buttons slides the
  active treatment between them. Same technique as part 04's control bar; use a
  distinct `layoutId` so the two never collide.
- **Do not animate the dialog's internal layout.** Phase 12 spent real work
  making only the roster `<ul>` scroll while header, input, conference row and
  footer stay `shrink-0`, and it is height-gated at
  `[@media(min-height:40rem)]:min-h-24` for a 320×568 device. Any layout
  animation on `DialogContent` risks reintroducing the clipped-footer bug. Keep
  motion to opacity, transform and the `layoutId` indicator.
- **Confirm does not play the exit animation.** Part 01 decided this: confirming
  navigates, and the route entrance is the transition. Cancel and Escape keep
  the normal exit.
- The disabled confirm button's explicit muted styling (Phase 12, corrected in
  the browser) must survive — do not let a transition leave it gold-tinted
  mid-fade.

## Existing motion this part touches

`DraftCourt` and `DraftBoard` are already animated and were converted to the
part 01 tokens. One thing to fix while here:

- `DraftCourt` applies `delay: index * 0.06` to **every** slot transition, not
  just mount. Drafting into `C` (index 4) waits 0.24s before the card appears,
  while `PG` is instant. The stagger is right on mount and wrong on a draft.
  Apply it only on the initial render.

## Responsiveness

Verify at 1440, 1024, 768, 390. No horizontal page scroll.

- The court is a `@container` sized in `cqw` — **anything added to it must be
  positioned in the same percentage space, never in px** (Phase 5). A shake or
  lift in px will drift at 390.
- The new dots and progress bar must not push the top bar or reroll row into a
  wrap at 390. `RerollPool`'s labels already hide below `sm`.
- **Known pre-existing issue: at 320px the draft page already overflows
  horizontally** (Phase 12 found `scrollWidth` 351 vs 320). Do not fix it here;
  do not make it worse — the two new elements are the kind of thing that would.

## Verification

- `npm test`, `tsc --noEmit`, `lint`, `format:check`, `build`. `/play/draft`
  still prerenders static.
- Unit: `slotAcceptsPlayer` agrees with `validateDraft` across the fixture set —
  a fitting open slot, a filled slot, a wrong position, and a cross-season
  duplicate (which must report as blocked for the duplicate reason, per Phase 9's
  ordering). Mutation-check by inverting one branch.
- Browser at 1440×1000 and a true 390×844, zero console errors:
  - Hover a roster card and confirm **only** the slots that would accept it
    breathe; hover an already-drafted player and confirm none do; move the
    pointer off and confirm all open slots resume.
  - Select each slot in turn; one settle per selection, none left glowing.
  - Drag a valid player over a valid slot (lift + held glow), over a filled slot
    (deny shake, once), then drop on the invalid slot and confirm the Phase 6
    toast still fires and the board is unchanged.
  - Cancel a drag with Escape and confirm the preview state clears — no slot left
    lifted or glowing.
  - Draft all five by click; the bar fills segment by segment, the count ticks
    0→5, and the bar pulses once at 5/5.
  - Spend all three rerolls; one dot extinguishes each time and the buttons fade
    out at 0. Force a fetch failure and confirm nothing animates and the dots
    hold at 3.
  - Open the confirm dialog: five rows stagger in, the conference indicator
    slides EAST↔WEST, Cancel and Escape play the exit, and confirm navigates
    without a double transition.
- Reduced motion emulated: the glow is static (but still marks the accepting
  slots), no lift, no shake, no stagger; the dots and bar update instantly; the
  draft is fully playable and the dialog still opens and closes.

## Out of scope

The bracket (part 03), replay (part 04), result screen (part 05), and the route
transition itself (part 01). No touch-drag support — open since Phase 6 and not
a motion problem. No change to the draft reducer, the reroll count, or any
eligibility rule: `slotAcceptsPlayer` reports what `validateDraft` already
decides, it does not decide anything itself.

## References

- `context/docs/motion-animation.md` — §Draft screen, items 1–7
- `context/features/phase-20-motion-foundation-01.md` — tokens, reduced motion,
  the confirm/route hand-off
- `context/current-feature.md` — Phase 5 part 2 (the `cqw` court, the glow
  tuning, literal position classes), Phase 6 (`validateDraft`'s typed rejection,
  every slot a drop target, `text/plain` drag payload), Phase 9 (duplicate
  checked before position, and why), Phase 12 (`SquadConfirmDialog`'s scroll
  structure and disabled-button styling), Phase 13 (the reroll-on-success rule,
  the capped roster stagger)
- Code: `src/components/draft/` — `CourtSlot`, `DraftCourt`, `DraftBoard`,
  `DraftExperience`, `RosterPlayerCard`, `RerollPool`, `DraftTopBar`,
  `SquadConfirmDialog`; `src/lib/draft.ts` (`PLAYER_DRAG_TYPE`,
  `playerAvailability`, `validateDraft`);
  `src/components/tournament/DifficultyMeter.tsx`,
  `src/components/tournament/TweenNumber.tsx` (the dot and tween treatments to
  match and reuse)