# Phase 6 — Draft Mechanics (Mock Data)
 
## Overview
 
Covers implementing the draft page mechanics on runtime state.
 
## Initial Phase
 
- All CourtSlot cards (PG, SG, SF, PF, C) are in empty state.
- 3 reroll rights.
- Reroll buttons are disabled (Another Team, Another Season, Skip Round).
- Get Random Team button is enabled to start draft mechanics.
- Start Tournament button is disabled.
### CourtSlot Card
 
- Selectable if it is in empty state.
- User selects 1 empty CourtSlot Card; players in the roster sharing that slot's position then become available to select.
### Get Random Team Button
 
- Initially active.
- Becomes visible and active again after the user drafts a player into a slot, repeating until the lineup is complete. The next round's team does **not** appear automatically — the user must click "Get Random Team" again each round to advance.
- Retrieves a random team from a random season as the roster.
- Free action — does not consume a reroll.
### Start Tournament Button
 
- Disabled until all 5 slots have a player selected (one per position) and the lineup is ready.
- If enabled, redirects the user to `/play/tournament` to start the tournament.
Confirmed: once all 5 slots are filled, "Get Random Team" and all 3 reroll buttons (Another Team / Another Season / Skip Round) disable, alongside Start Tournament becoming enabled. See `@context/screenshots/draft/desktop-draft-complete.png` for the expected end state.
 
## Reroll Logic
 
- The 3 buttons below share a single pool of 3 rights.
- Clicking any one of the three buttons decreases the shared right by 1.
- Update the "Rerolls left:" text accordingly.
- Buttons are active only when the draft board is in **selecting state** (a CourtSlot is selected and its matching roster is displayed, awaiting a player pick) **and** `rerollsRight > 0`.
### Another Team Button
 
- Retrieves a different team than the one currently shown, from a random season, as the roster.
### Another Season Button
 
- Retrieves the same team currently shown, from a different random season, as the roster.
### Skip Round Button
 
- Retrieves a random team from a random season as the roster.
- Confirmed distinction from "Get Random Team": "Get Random Team" is the free action used to advance to the next round *after* a player has been drafted from the current team. "Skip Round" is the reroll-costing equivalent, used when the user does **not** want to draft from the currently shown team and wants a new one without drafting — same underlying result (random team, random season), but it spends 1 of the 3 shared reroll rights and is only relevant while a team is currently displayed and un-drafted-from.
## Draft Player Logic
 
- User selects 1 empty CourtSlot Card; players in the roster sharing that slot's position then become available to select.
- It is important to **select an empty CourtSlot Card first** to draft a player. Only then do the **matching players in the roster become selectable**.
- After selecting the CourtSlot Card, the user may either drag & drop a player from the roster onto the selected CourtSlot Card, or simply click the player card. A player only becomes draggable once its matching CourtSlot has been selected.
- Confirmed drag behavior: dragging is intended to land on the currently selected CourtSlot, but since all 5 CourtSlot cards remain visible on the court UI at once, the user can physically drag the (now-draggable) player and drop it on a *different*, unselected CourtSlot instead. That's the "wrong CourtSlot" case — show a toast error, e.g. "Attempt to place in wrong position," rather than silently rejecting or ignoring the drop.
Confirmed: if the user switches to a different empty CourtSlot mid-round, before drafting from the currently displayed roster, the roster **persists** — switching slots only re-filters which players in that same roster are selectable, based on the newly selected slot's position. It does not trigger a new "Get Random Team" fetch.
 
## Notes
 
- **Scope:** runtime state over the `src/data/` fixtures only. No Prisma, no queries, no persistence, no Server Actions — mechanics against real data with the data layer connected will be re-pointed in a later phase. Do not restyle anything Phase 5 shipped; this phase changes behavior, not appearance.
- **Constraints:**
  - Hard constraint 6 — a player can be drafted once per run **regardless of season**. Five real duplicate identities exist in the fixtures (LeBron, Ray Allen, Robert Horry, Sam Cassell, Ron Harper), so the guard must key on `playerId`.
  - Hard constraint 7 — exactly 3 reroll opportunities per run, shared across all three reroll buttons.
  - Hard constraint 8 — exactly 5 players, one per formation slot.
  - `page.tsx` stays a server component; `"use client"` only on the new `DraftExperience` and the components that already carry it.
  - Tests cover `src/lib/` only, never components or pages.
- **Insufficient mock data to test reroll logic:**
  - Current mock data is insufficient to test "Another Season" and "Another Team" buttons.
  - There should be at least 2 seasonal team rosters for each team in the mock data — this means a larger dataset; if that becomes too hard to manage, reduce the number of diverse teams instead.
  - It will be good practice to have at least 3 diverse teams, each with rosters from at least 2 different seasons.
- **Verification:** `npm test` (new `draft.test.ts` cases green alongside the existing 20), `npm run lint`, `npm run format:check`, `npm run build`. In the browser at `/play/draft`: draft a full five-man lineup, confirm each pick animates into the correct court slot, confirm an already-drafted player's other season shows as disabled, confirm rerolls count down to 0 and then disable, and confirm `Start Tournament` only enables at five slots filled. Re-check both 1440px and 390px — the court alignment must survive the state changes.
## References
 
- @context/screenshots/draft/desktop-draft-start-empty.png
- @context/screenshots/draft/desktop-mid-draft.png
- @context/screenshots/draft/desktop-draft-complete.png
- @context/screenshots/draft/mobile-draft-start-empty.png
- @context/screenshots/draft/mobile-mid-start-empty.png
- @context/screenshots/draft/mobile-draft-complete.png
- @context/project-overview.md
- @src/data/index.ts
- @src/types/game.ts