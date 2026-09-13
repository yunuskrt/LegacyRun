# Security Scan Findings

Three candidate issues in the share-card path, all raised against revision
`9c31550` by the `claude-security` plugin's researchers, then assessed by hand.

> **These are unverified.** The plugin's three-voter panel never ran — the scan
> hit its session limit before verification, four separate times. Researchers
> propose; the panel is what throws out the ones that don't hold up, and
> roughly half don't. Every judgement below is one engineer's read, not a
> verified finding. Re-derive before acting.

## Scope of the scan that produced them

| | |
| --- | --- |
| Target | `src/app` + `src/lib` — 69 files |
| Effort | `medium`, focused on production code |
| Revision | `9c31550` |
| Research completed | 8 of 12 cells |
| Sweeps completed | 0 of 2 (breadth, secrets) |
| Panel votes cast | 0 of 6 |

Not covered, and therefore saying nothing either way: `src/components`,
`src/data`, `scripts/`, `prisma/`, the two unfinished research cells
(`app-http-surface:injection-and-input`, `game-logic-and-client-utils:crypto-and-secrets`),
and both sweeps — including the secrets pass, so **no committed-credential
check ran at all**.

---

## 1. Host-header SSRF in the share-card logo fetch

**Where:** `src/app/api/share/card/route.ts:23` → `src/lib/share-logos.ts:29-31`

`route.ts` passes `url.origin` into `loadShareLogos`. That origin comes from
`new URL(request.url)`, which Next derives from the inbound `Host` /
`X-Forwarded-Host` header. `loadShareLogos` then resolves it and fetches:

```ts
const response = await fetchLogo(new URL(teamLogoPath(slug), origin).href);
```

Someone able to set `Host` makes the server issue `GET http://their-host/logos/CHI.png`.

**What blunts it.** The path is fixed to `/logos/<SLUG>.png` and the slug is
`^[A-Z0-9]{2,8}$` (`share-card.ts:81`), so there is no arbitrary-path
primitive — cloud metadata endpoints need specific paths and stay unreachable.
The bytes must also be a valid image or the whole render 500s, making it a poor
exfiltration channel. On Vercel, `Host` is validated against configured domains.

**Why fix it anyway.** The fetch is pointless. Those logos are static files in
`public/logos/`; reading them off disk removes the network call and the finding
with it, rather than mitigating it.

## 2. Unauthenticated CPU-heavy render, no throttle

**Where:** `src/app/api/share/card/route.ts`

Every `GET` rasterises up to 1080×1920 (`SHARE_CARD_SIZES.STORY`) through
satori + resvg, with no auth and no rate limit. The
`Cache-Control: public, max-age=31536000, immutable` header only helps for
identical URLs — varying the `d` payload busts it on every request.

Harmless on localhost. A real availability concern once Phase 23 puts this on a
public host. **The one worth prioritising of the three.**

## 3. Unsigned share payload

**Where:** `src/lib/share-card.ts` — `d` is base64url JSON with no signature or MAC

Anyone can craft a payload claiming any run result. With no accounts, no
leaderboard and single-player runs, forging a card about a game you played
alone crosses no trust boundary — **this is the one a panel would most likely
reject.**

The narrower real point: 40 characters of caller-chosen text
(`MAX_SQUAD_NAME_LENGTH`, `run.ts:9`) render into a PNG served from your own
origin under a year-long immutable cache. Minor "arbitrary content on your
domain" abuse, bounded and low.

---

## If you want the verified version

A fresh `low`-effort scoped scan — one researcher plus the three-lens panel,
roughly 5 agents — finishes inside a single session window in minutes. That is
the cheap path to a real report. The `medium` runs that produced these
candidates fanned out to ~22 agents and never once got past research.
