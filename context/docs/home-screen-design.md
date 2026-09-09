# Home Screen Design

The design brief for `/` — the landing page that explains LegacyRun and sends
the player into the draft.

**Scope: Phase 21.** One route, one scroll, five sections, one job: a first-time
visitor understands what the game is and clicks **Start Game**.

**This doc is the design source, not the implementation spec.** It follows the
same split as `tournament-ui-design.md`: this file settles the sections, the
content, the motion and the tooling; the implementation spec lands in
`context/features/phase-21-home-screen.md` and is written against it.

---

## 1. What exists today

`src/app/page.tsx` is a nine-line server component rendering one `<h1>`. That is
the entire landing page. Everything below is new work, but almost nothing about
it is new design — the Dark Trophy Room palette, the motion vocabulary, the
card/crest/badge patterns and the team logos are all already in the repo.

| Asset | Where | Use on the landing page |
| --- | --- | --- |
| Dark Trophy Room tokens | `src/app/globals.css`, documented in `context/theme.md` | The whole palette. Nothing new is introduced |
| `bg-room`, `bg-gold`, `shadow-trophy`, `shadow-panel` | `globals.css` `@utility` | Hero backdrop, gold CTA, panel depth |
| Motion vocabulary | `src/lib/motion.ts` + mirrored CSS vars | Every animation on the page (§4) |
| `MotionProvider` | `src/components/motion/MotionProvider.tsx`, mounted in the root layout | Already wraps `/` — reduced motion is handled globally |
| 40 franchise logos | `public/logos/<slug>.png`, path via `@/lib/team-logo` | Bracket crests (§3.4) |
| `court.svg`, `jersey-empty-slot.svg`, `player-silhouette.svg` | `public/assets/` | The hero court and its five slots (§3.1) |
| `DraftCourt` / `CourtSlot` geometry | `src/components/draft/` | **Reference for the hero's slot placement** — read, don't import (§3.1) |
| `TweenNumber` | `src/components/tournament/TweenNumber.tsx` | Counting numbers in §3.2 |
| Position colors + `PositionChip` | `--pos-*`, `src/components/tournament/PositionChip.tsx` | Slot legend in §3.3 |

**Two structural facts that shape the build:**

1. `/` is **outside** `src/app/play/layout.tsx`, so it has no `RunProvider` and
   no `RouteTransition`. There is no run to read, reset, or protect — the CTA is
   a plain `<Link href="/play/draft">`. Do not lift `RunProvider` to the root
   layout for this page; nothing on it needs run state.
2. The page must stay a **server component** that composes client sections
   (`coding-standards.md`: "avoid unnecessary client components"). Only the
   sections that animate on scroll get `'use client'`.

---

## 2. Page structure

```text
/                   (server component)
├─ HeroSection      client — the pitch + Start Game
├─ PoolSection      client — the data behind the game, in numbers
├─ DraftSection     client — how the draft works (five slots, 5 rerolls, once each)
├─ BracketSection   client — the tournament ladder, escalating, + how a match resolves
└─ ClosingSection   client — final CTA + data provenance footer
```

Five sections, top to bottom, one continuous scroll. No sticky header, no
in-page nav — the page is short enough that a nav bar is chrome without a job.
The only navigation is the CTA, repeated at the top and the bottom.

A sixth section — a live simulation scoreboard demo — was specified and cut; its
three explanatory lines moved into `BracketSection` (§3.4).

**Minimum viable cut**, if the phase needs to ship smaller: Hero + Draft +
Closing. Pool and Bracket are each self-contained and can land in a follow-up
without restructuring the page.

---

## 3. Section by section

Each section below gives: the one idea it carries, its content, and its motion.
Copy is a starting point, not a mandate.

### 3.1 Hero — "this is the game"

**Idea:** the fantasy, in one screen, above the fold.

| Element | Content |
| --- | --- |
| Eyebrow | `1981 — 2026 · REAL NBA HISTORY` in the `DraftSectionHeading` uppercase-tracked style |
| H1 | **Draft Legends. Build Your Legacy.** (`bg-gold` + `bg-clip-text` on "Legends", or plain foreground — see decision D2) |
| Sub | One sentence: pick five players from any team-season in NBA history, then take them through a real playoff bracket. |
| Primary CTA | **Start Game** → `/play/draft`. Gold, `shadow-trophy`, min 44px tall |
| Secondary CTA | **How it works** → smooth-scrolls to §3.3. Ghost variant |
| Visual | See below |

**Hero visual — settled (D4): the court.**

`public/assets/court.svg` at low opacity with five slot markers, each filling
with a real player card in sequence (PG → SG → SF → PF → C). It is literally the
product's core screen, it reuses the draft's own layout language, and it animates
once on mount.

Three things carry over from `DraftCourt` and must not be re-derived:

- **Everything on the court is positioned in percentages, never px** — the slot
  coordinates come from an aspect-ratio lock on the SVG's `viewBox`. This is the
  Phase 5 (part 2) rule; a landing-page copy that hardcodes pixel offsets will
  drift at every width.
- **Cap the court on width, not height.** A `max-height` on an `aspect-ratio`
  box overrides the ratio and spreads the percentage-placed slots — the exact
  bug found in the Draft Ergonomics fix.
- **Read, don't import.** `DraftCourt` and `CourtSlot` are wired to draft state
  (selection, drag-over, deny-shake). The hero needs a presentational sibling,
  not a prop-drilled variant of them. Lifting the shared geometry into
  `src/lib/court-layout.ts` is reasonable if the slot coordinates would
  otherwise be duplicated verbatim; a small amount of duplication is also fine.

*Rejected:* a logo-wall marquee (atmospheric, but says nothing about the game)
and a static crest lockup (cheapest, but the hero is where the product should
move).

> **Anything shown in the hero must be real.** Player names, seasons, ratings
> and logos come from the dataset — hard constraint 3 applies to marketing copy
> too. Curate a handful of real examples into a constants file; do not invent a
> "2016 LeBron 97 OVR" card because it looks good.

**Motion:** mount sequence only (the hero is above the fold, so `whileInView`
would fire immediately anyway). Eyebrow → H1 → sub → CTAs, `SECTION_STEP` apart,
via `sequencedTransition`. The visual's five slots stagger at `STAGGER_STEP`.

### 3.2 Pool — "the history is real"

**Idea:** the credibility beat. This is not a made-up roster generator.

Five stat tiles, each a `TweenNumber` counting up when the section scrolls into
view:

| Number | What it is | Source |
| --- | --- | --- |
| **3,755** | players | `src/data/db/player.ts` |
| **20,260** | rated player-seasons | `player_season.ts` |
| **1,292** | team-seasons in the draft pool | `team_season.ts` |
| **724** | real playoff appearances behind the bracket | `playoff_participation.ts` |
| **46** | seasons, 1981–2026 | derived |

Supporting line: every rating is derived from real box-score and advanced stats
(`context/docs/player-rating-normalization.md`), not hand-set.

**Where the numbers come from — decide before building (D1):**

- **Static constants (recommended).** A `LANDING_STATS` object in
  `src/lib/landing.ts`, each field commented with its source file. The data is
  frozen (see the 🔒 section of `CLAUDE.md`), so a constant cannot drift without
  someone unfreezing it. Zero runtime cost, no DB round-trip on the busiest
  route. Optionally pin it with a Vitest that imports `src/data/db/*.ts` and
  asserts the lengths match — correct, but it pulls ~7MB of fixtures into the
  test run, so it is a judgement call, not a requirement.
- **Live Prisma counts.** `page.tsx` stays a server component and runs five
  `count()` queries. Honest by construction, but it makes the landing page
  depend on Neon being up, and the answer is a constant until someone
  deliberately re-ingests.

**Motion:** tiles fade-rise on `whileInView` with `once: true`, staggered at
`STAGGER_STEP`; `TweenNumber` starts on the same trigger, not on mount.

### 3.3 Draft — "the choice is the game"

**Idea:** the constraints, because the constraints are the fun. This is the
section the secondary CTA scrolls to.

Three rules, as three cards or one horizontal row:

1. **Five slots, five positions.** PG · SG · SF · PF · C, rendered as the five
   `--pos-*` chips. You cannot draft five point guards.
2. **Five rerolls.** A row of five gold dots, mirroring `RerollPool`. Don't like
   the roster you're shown? Spend one. There are only five.
3. **One player, once.** 2008 LeBron and 2016 LeBron are the same man. Pick him
   once, he's gone.

Closing line — the actual thesis: *the best five players available is never the
best five you can pick.*

**Motion:** the three rules arrive one section-beat apart (`SECTION_STEP`). Rule
2's dots extinguish 5 → 4 once, as a demonstration, then stop. Rule 1's chips
land in slot order.

### 3.4 Bracket — "the opponents are real, and they get worse"

**Idea:** what you do with the team once you've built it.

A miniature, non-interactive four-round ladder — Round 1 → Conference
Semifinals → Conference Finals → NBA Finals — with real opponent crests at
increasing pedigree. Reuse `TeamCrest`; do **not** reuse `BracketLadder`, which
is bound to live `Bracket` state.

Supporting copy: opponents are drawn from 724 real playoff teams, seeded so
every round is harder than the last (`context/docs/bracket-generation.md`).
Pick East or West; both paths are balanced.

**Plus three lines on how a match resolves.** A standalone simulation demo
section was specified and then cut (see D5); these three lines are what survives
of it, as plain copy under the ladder — without them the page never mentions the
half of the game that happens after the draft:

- Every series is best-of-7, simulated possession by possession from real
  minutes-weighted box-plus-minus — no dice roll on a final score.
- Watch it live at Slow, Normal or Fast, in Manual or Automatic. Pacing only,
  never the result.
- Stronger teams win more often. Upsets stay possible.

No scoreboard, no screenshot, no frozen log — three sentences and nothing to
build. Cut them too if the section reads long.

**Motion:** the four rounds reveal left-to-right on scroll, one beat each; the
Finals slot arrives last with a gold `shadow-trophy` pulse. A single
`BREATHE` loop on the trophy slot is the one permitted infinite animation —
nothing else on this page loops.

### 3.5 Closing — the second ask

Repeat of the hero promise at a smaller size, the **Start Game** CTA again, and
a one-line footer: data derived from publicly available historical NBA
statistics; LegacyRun is an unofficial fan project, not affiliated with the NBA.
No sign-up, no account, no save — worth saying, because it lowers the cost of
clicking.

**Motion:** fade-rise on view. Nothing clever; the CTA is the point.

---

## 4. Motion rules

The page reuses `src/lib/motion.ts` wholesale. Three additions to how it is
*used*, none to what it contains — except possibly D3.

**Scroll reveal is `whileInView`, always `once: true`.** Sections that re-animate
every time you scroll past are the single most common landing-page mistake.

```tsx
<motion.section
  initial={entranceFrom(true, reduced, FADE_RISE.initial)}
  whileInView={FADE_RISE.animate}
  viewport={{ once: true, amount: 0.3 }}
  transition={transitionFor("slow", reduced)}
>
```

**Reduced motion needs an explicit guard, twice over.** Phase 20 established
this the hard way: `MotionConfig` zeroes durations but does **not** cancel
delays, and it *snaps* transform targets rather than omitting them. So every
staggered or transformed element on this page passes `reduced` through
`staggerDelay` / `sequencedTransition` and uses `entranceFrom` for its initial
frame. Under `prefers-reduced-motion`, the landing page must be fully readable
with zero scroll-triggered animation — every section visible at rest.

**Nothing loops except one thing.** `BREATHE` on the §3.4 Finals slot. Marquees,
pulsing CTAs and infinite gradients are all out; the app's own screens don't do
it and the landing page shouldn't set a different expectation. With D4 settled
on the court, the page has no marquee at all — the hero's slot fill is a
one-shot mount sequence, not a loop.

**Decision D3 — travel distance.** `FADE_RISE` is `y: 8`, tuned for cards inside
a dense UI. Full-width landing sections may want `y: 24`. Two options: use
`FADE_RISE` as-is and accept a subtle reveal (recommended — one vocabulary, zero
new tests), or add a `SECTION_RISE` constant. If you add one, note that
`src/lib/motion.test.ts` parses **both** `motion.ts` and `globals.css` and
asserts they agree numerically — a new duration or easing must be added to both
files or that test fails.

---

## 5. Responsive & accessibility

| Rule | Why |
| --- | --- |
| Breakpoints 390 / 768 / 1440, same as every earlier phase | Phase 20 (part 3) and the Draft Ergonomics fix both verified at these widths |
| Hero must fit 390×844 without the CTA below the fold | The CTA is the page's only job |
| Touch targets ≥ 44px | The sweep done in Phase 20 (part 3); don't regress it on new buttons |
| One `<h1>`, sections use `<h2>` | The draft page shipped without an `<h1>` and it had to be fixed later |
| Every section is a `<section>` with an accessible name | Screen-reader navigation on a long scroll page |
| Contrast: check any text over `bg-room` or over a logo | Gradients are where AA quietly fails |
| Logos via `next/image` with `alt` | And **without** `unoptimized` — that was removed deliberately in the code-scan follow-up |
| `scroll-behavior: smooth` for the "How it works" jump | Already neutralized under reduced motion by the `@media` block in `globals.css` |

**Bundle:** the landing page must never import from `src/data/db/*` — those
files are megabytes. Constants only, in `src/lib/landing.ts`.

---

## 6. Claude stack for building this

The catalog is in `context/docs/claude-guide.md`. This is the subset worth using
for *this* phase, in build order. Alternatives are given where the choice is
genuinely open; recommendations are marked.

### 6.1 Already available in this session — use these first

| Tool | Use it for |
| --- | --- |
| `/feature` skill | The repo's own workflow (`ai-interaction.md`): document → branch → implement → test → iterate → commit → merge. **This is the spine of the phase.** Start here |
| `/todo` skill | Flipping Phase 21 in `context/todo.md` when it lands |
| `/design` skill | **Recommended for the mockup pass.** Multi-artboard canvas — lay the five sections out as artboards, at desktop and mobile, before writing a component. Phases 16–19 worked from mockups in `context/screenshots/`; do the same here into `context/screenshots/home/` |
| Playwright MCP (`mcp__playwright__*`) | Browser verification at 390 / 768 / 1440, plus a `prefers-reduced-motion` pass. Already installed — no setup |
| `ui-reviewer` agent | Visual, responsive and a11y review of the built page. This is the agent that caught the draft page's missing `<h1>` |
| `code-scanner` agent | Post-build sweep for the usual: client/server boundary, unused imports, N+1 |
| `/code-review`, `/simplify` | Before the commit. `/simplify` specifically for "did this need five components?" |
| `Plan` agent | If the section list needs sequencing into independently shippable steps |

### 6.2 Installing for this phase — settled

Three, and this is the full list. It sits exactly at the guide's ceiling of *one
primary design skill plus one specialist*; nothing else gets added mid-phase.

| Tool | Install | Role here |
| --- | --- | --- |
| **Context7 MCP** | `claude mcp add --transport http context7 https://mcp.context7.com/mcp` | Current, version-specific library docs. Next.js 16, Tailwind v4 and motion v13 are all **newer than most training data**, and `CLAUDE.md` already warns that this is not the Next.js you know. Add `use context7` to any prompt touching framework APIs, and keep the repo's own rule alongside it: read `node_modules/next/dist/docs/` before writing route or metadata code |
| **`frontend-design`** (Anthropic) | `npx skills add anthropics/skills@frontend-design --agent claude-code` | **The primary.** No third-party trust surface, and it won't fight an existing design system. **Point it at `context/theme.md` and this doc explicitly** — left alone it will propose a palette we already have |
| **`emil-design-eng`** | `npx skills add emilkowalski/skill --skill emil-design-eng --agent claude-code` | **The specialist**, micro-interactions only: sub-300ms timing, custom easing, what should and shouldn't animate. Narrow enough to stack safely. Use it to *review* §4 — the hero's slot fill, the reroll-dot demo, the scroll reveals — not to author a second motion vocabulary. `src/lib/motion.ts` stays the source of truth; if the two disagree, the file wins |

Verify all three landed: `claude mcp list` and `/skills`. If a skill installs but
never triggers, check whether it went to `.agents/skills/` instead of
`.claude/skills/` — that's what `--agent claude-code` is for.

### 6.3 Considered and rejected

Recorded so the phase doesn't reopen them. Stacking overlapping design skills
produces contradictory guidance and burns context — that's the reason for all
three of the first rows, not a judgement on the tools.

| Option | Why not |
| --- | --- |
| **Hallmark** | Genuinely best-in-class at landing-page layout variety, which is what this phase needs. But its SKILL.md is ~17k tokens per run, its instinct is to design a page rather than inherit one, and `frontend-design` already holds the primary slot. If layout ideas run dry, the safe subset is `hallmark study <url>` against two or three references to extract a portable `design.md` — no install of the full authoring flow |
| **Impeccable** | Would have been the auditor pick, but `emil-design-eng` takes the specialist slot and `/impeccable audit` overlaps `ui-reviewer`, which is already here |
| **21st.dev Magic** | Generates generic shadcn markup that then has to be re-skinned to Dark Trophy Room — plausibly slower than writing it. Also needs an API key |
| **Google Stitch** | Overlaps `/design`; don't run both |
| **superpowers** | Duplicates the repo's own `/feature` workflow |
| **Ponytail** | Relevant in principle — a landing page is where over-engineering happens — but `/simplify` covers it without an install |
| **`claude-security` / `security-guidance` / `Strix`** | A static marketing page with no inputs and no auth. Revisit at Phase 23 |

### 6.4 Inspiration, before the mockup pass

From the guide's §3, the two that fit a section-by-section animated page:

- **`unsection.com`** — one section pattern at a time, which is exactly the unit
  this page is built in.
- **`motionsites.com`** — motion-heavy sites, each shipping the prompt that
  produced its theme.
- **`minimal.gallery`** — the restrained end; a useful counterweight, since a
  dark gold sports page can slide into casino territory fast.

Feed two or three references in as *references*, and keep the palette.

---

## 7. Decisions to settle before building

Everything in the original table is now settled. Kept with its reasoning, since
the point of recording a decision is that the build doesn't re-litigate it.

| # | Decision | Settled as |
| --- | --- | --- |
| D1 | Pool numbers: static constants vs live Prisma counts | **Static constants** in `src/lib/landing.ts` (§3.2). The data is frozen; a query buys nothing and adds a Neon dependency to the busiest route |
| D2 | H1 treatment: gold gradient text vs plain foreground | **Decided in the mockup pass**, not here — both are a one-line change, and gradient text is a contrast question that only a rendered page can answer |
| D3 | `FADE_RISE` vs a new `SECTION_RISE` | **Reuse `FADE_RISE`.** A new token means editing `motion.ts`, `globals.css` *and* `motion.test.ts`, which parses both and asserts they agree |
| D4 | Hero visual | **The court** (§3.1) |
| D5 | Simulation demo section | **Cut.** No scoreboard strip, no frozen sample log, no screenshot. Three explanatory lines moved into §3.4 |
| D6 | Does `/` get a `RouteTransition`? | **No.** It lives under `play/layout.tsx`, and the hero has its own mount sequence |

Two smaller choices deliberately left to the mockup pass rather than settled
here: the §3.3 rules layout (three cards vs one horizontal row) and D2 above.

---

## 8. Definition of done

- [ ] Five sections (or the minimum cut) render at 390, 768 and 1440
- [ ] `Start Game` reaches `/play/draft` and a full run is still completable
- [ ] `prefers-reduced-motion: reduce` → every section readable at rest, no
      scroll-triggered animation, no delays
- [ ] One `<h1>`; each section has an accessible name; touch targets ≥ 44px
- [ ] Nothing displayed is invented — every name, season, rating and number
      traces to `src/data/`
- [ ] No import from `src/data/db/*` in any client component
- [ ] `npm test` and `npm run build` both pass
- [ ] `ui-reviewer` pass clean, or its findings recorded and triaged
- [ ] `context/todo.md` Phase 21 checked, `context/current-feature.md` history
      entry written
