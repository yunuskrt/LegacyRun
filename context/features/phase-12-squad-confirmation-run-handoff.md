# Phase 12 — Squad Confirmation & Run Handoff

## Status

Not Started

## Overview

The draft ends at a dead end today: `Start Tournament` enables at 5/5 and `router.push`es to a `/play/tournament` page that renders one line of placeholder text. The completed lineup lives in a `useReducer` inside `DraftExperience` and is dropped on navigation.

This phase closes that gap. `Start Tournament` opens a confirmation dialog — review the five drafted players, optionally name the squad, pick a conference (required) — and confirming carries the run across to `/play/tournament`, which prints it as plain text.

**The deliverable is the state handoff, not a tournament screen.** The tournament page gets no UI in this phase; text output is enough to prove the run survived the navigation.

This merges what were separately listed as Phase 12 (game state management), Phase 14 (team review) and Phase 18 (conference select). Bracket generation is **not** absorbed — it stays entirely with Phase 14.

## Goals

- `src/types/game.ts` — add `Conference` (re-exported from the Prisma client, as `Position` already is) and a `Run` type: the completed `Squad` plus the selected conference.
- `src/lib/run.ts` — **new**, pure: `buildRun(members, name, conference)` assembling a `Run` from draft state, plus squad-name normalization.
- `src/lib/run.test.ts` — **new**, Vitest over that module.
- `src/components/play/RunProvider.tsx` — **new**, the React context holding the confirmed run, with a `useRun()` hook.
- `src/app/play/layout.tsx` — **new**, mounts `RunProvider` above both `/play/draft` and `/play/tournament`.
- `src/components/draft/SquadConfirmDialog.tsx` — **new**, the confirmation dialog.
- `src/components/draft/DraftExperience.tsx` — open the dialog instead of navigating; set the run in context and navigate on confirm.
- `src/app/play/tournament/page.tsx` — read the run from context and render it as text, with a no-run fallback.
- shadcn `dialog` and `input` primitives via `npx shadcn add`.

## The dialog

Opens only when the draft is complete — `Start Tournament` keeps its existing `disabled={!isComplete}` guard, so the dialog can assume five members.

Check `context/screenshots/squad/desktop-start-tournament-dialog.png` and `context/screenshots/squad/mobile-start-tournament-dialog-ready.png` for ui designs.

**Header** — the optional squad name. A single `Input`, placeholder something like `Name your squad (optional)`. Empty is valid and means `Squad.name` stays `undefined`. Trim on read; cap at 40 characters; a whitespace-only value is treated as empty.

**Body** — the five drafted players in slot order (`PG`, `SG`, `SF`, `PF`, `C`), each showing position, name, team + season, and rating. Everything needed is already on `SquadMember`. Reuse `positionStyle` from [`src/lib/position-style.ts`](../../src/lib/position-style.ts) so the position colours match the court; do not build a new card component — Phase 21 owns bespoke cards.

**Conference** — `EAST` or `WEST`, required, no default. Two buttons acting as a segmented control (`aria-pressed`) rather than pulling in another Radix primitive. Nothing is preselected: the player must make the choice deliberately.

**Confirm** — the primary action, labelled `Start Tournament`. Disabled until a conference is selected, with a short hint underneath explaining why. The dialog is dismissable (Escape, overlay, a `Cancel`) and dismissing changes no draft state, so the player can reopen it and choose differently.

## The handoff

A React context mounted above both routes.

`/play/draft` and `/play/tournament` currently share no layout — only `src/app/play/draft/layout.tsx` exists — so this phase adds `src/app/play/layout.tsx`, which renders a client `RunProvider` around `children`. A layout instance persists across client-side navigation within its segment, so the run set on confirm is still in memory when the tournament page mounts.

- `RunProvider` is `'use client'` and holds `useState<Run | null>(null)` plus a `setRun`. The layout itself can stay a server component that renders the provider — `children` are still server components, so `/play/draft` keeps prerendering.
- The existing `src/app/play/draft/layout.tsx` is unchanged and nests inside the new one; the `Toaster` stays where it is.
- `useRun()` throws if called outside the provider — a missing provider is a wiring bug, not a runtime state to handle.
- Typed routes are in use (`LayoutProps<"/play/draft">`), so the new layout is `LayoutProps<"/play">`.

**The known limitation, accepted deliberately:** context is in-memory, so a reload of `/play/tournament` or a direct visit to it loses the run. That is a real hole and the tournament page must handle it — see the fallback below — but persisting the run (`sessionStorage`, a URL-encoded id, or a server-side row) is out of scope here. Nothing is written to Neon; the run is runtime state only, matching `project-overview.md`'s "runtime only (app state, not persisted unless there's a concrete need)".

## The tournament page

Plain text, deliberately. Squad name if one was given, the selected conference, and the five players with their positions. No cards, no bracket, no styling beyond what keeps it readable on the existing `bg-room` background.

It becomes a client component to read the context. **No run in context** → a short message and a link back to `/play/draft`; it must not throw, and it must not render an empty squad. It stays the only content of that route until Phase 14 puts a bracket behind it.

## Notes

- **Scope**: the dialog, the run type and context, and a text-only tournament page. Explicitly **not** in scope: bracket generation (Phase 14), any tournament UI (Phase 17+), persistence of the run across a reload, and server-side storage.
- **Depends on**: Phase 13. No schema change, no migration, no new endpoint.
- **`Squad.rating` stays `undefined`.** The type already carries it as optional. Computing a rating for a *drafted* squad is a real decision — the Phase 10 engine z-scores against all 1,292 historical team-seasons and carries a known positional distortion — and it belongs with the phase that consumes it for seeding, not here.
- **Duplicate and reroll guards are already done** (Phase 6, `src/lib/draft.ts`) and are not touched. The old Phase 12 line's "duplicate & reroll guards" was already satisfied before this merge.
- 🔒 Read-only phase. The `CLAUDE.md` lock applies in full: no migration, no `db:ingest`, no regeneration of `src/data/`. Nothing here reads the database at all.
- **Coding standards that bite here**: every internal import through the `@/` alias; the `type Props = {}` component template on all new/changed components; `'use client'` only where genuinely needed (the provider, the dialog, `DraftExperience`, and the tournament page qualify — the new layout does not); no `any`; short `//` comments only. `npx shadcn add` output is not Prettier-formatted — run `prettier --write` after.
- **Tests cover `src/lib/run.ts` only.** Components, pages, and context providers are not tested per the standards. Pin: name trimming, the empty and whitespace-only cases, the 40-character cap, and that `buildRun` carries all five members and the conference through unchanged.
- **Verification**: `npm test`, `tsc --noEmit`, `lint`, `format:check`, `npm run build` — confirm `/play/draft` still prerenders static and report what `/play/tournament` renders as once it is a client component. Then a real browser run at 1440×1000 and 390×844: draft a full 5/5 lineup, open the dialog, confirm the button is disabled with no conference picked, dismiss and reopen to check draft state is intact, confirm with a name and again without one, and verify the tournament page prints the right five players and conference both times. Then reload `/play/tournament` and confirm the no-run fallback appears rather than an error or an empty squad — that is the expected behaviour this phase, not a bug.

## References

`context/screenshots/squad/desktop-start-tournament-dialog.png`
`context/screenshots/squad/mobile-start-tournament-dialog-ready.png`