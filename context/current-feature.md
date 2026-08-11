# Current Feature

## Status

Not Started

## Goals

## Notes

## History

### Phase 1 — Project Foundation Setup

Cleared all `create-next-app` boilerplate, installed the stack (Prisma 7 + `@prisma/adapter-neon`, `motion`, Zod, shadcn/ui with the `radix`/`nova` preset, Vitest, Prettier), set up the `src/`-based folder structure with `prisma/` and `scripts/` at the root, and reduced the home page to the single text `Legacy Run`.

Notable decisions and gotchas:

- Prisma 7 removed `url` from the `datasource` block — see the Prisma 7 section in `coding-standards.md`.
- `.env*` in `.gitignore` was silently ignoring `.env.example`; fixed with a `!.env.example` negation.
- shadcn's init emitted a self-referential `--font-sans: var(--font-sans)`; repointed at `--font-geist-sans`.
- Geist fonts kept — the `nova` preset is built around them, so they're now intentional rather than leftover scaffolding.
- `@typescript-eslint/no-empty-object-type` relaxed so the mandated `type Props = {}` passes.

Verified: `lint`, `format:check`, `test`, `prisma validate`, and `build` all pass; the dev server renders `Legacy Run` with Tailwind and the shadcn token layer applied. Not verified: a live database connection — needs a real `DATABASE_URL`, and there are no models until Phase 2.

Still open: `next dev` may regenerate a root `AGENTS.md` (the file now lives at `context/AGENTS.md`) — decide then whether to ignore or commit it.
