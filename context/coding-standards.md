# Coding Standards

## TypeScript

- Strict mode enabled.
- No `any` types. Use proper typing or `unknown`.
- Define types/interfaces for component props, API responses, CLI inputs/outputs, and domain data.
- Use type inference where obvious; use explicit types where it improves clarity.
- Prefer `type` for simple composition and `interface` where extension is useful.
- Use `async/await` for asynchronous operations.
- Keep shared domain types in `src/types/`.

## Imports

- All custom/internal imports must use the `@/` alias (e.g. `import { Button } from '@/components/ui/button'`).
- Relative imports (`./`, `../`) for internal app code are **not accepted** — rewrite them as `@/` imports.
- This applies to all internal code: components, hooks, lib/utils, types, actions.
- External package imports (npm packages) are unaffected and stay as normal package imports.

## Comments

- Do not add large block comments (e.g. `/** ... */`) that explain what the code does.
- Code should be self-explanatory through clear naming and structure — don't narrate the implementation.
- Add a comment only when it's genuinely necessary for readability (e.g. a non-obvious business rule, workaround, or edge case) — not as a default habit.
- When a comment is needed, use a short single-line `//` comment. Keep it brief — no multi-line or paragraph-style comments.

## React

- Functional components only; no class components.
- Use hooks for state and side effects.
- Keep components focused on one responsibility.
- Extract reusable logic into custom hooks.
- Avoid unnecessary client components.

### Component and Page Structure

Every React component and Next.js page must follow this basic structure:

```tsx
import React from 'react'
import styles from './test-component.module.css'

type Props = {}

const TestComponent = ({}: Props) => {
  return (
    ...
  )
}

export default TestComponent
```

The following must exist in every component/page:

```tsx
import React from 'react'

type Props = {}

const ComponentName = ({}: Props) => {}
```

- Keep the `Props` type even when the component currently has no props.
- Replace `ComponentName` with the actual component name.
- Use the component's actual CSS module only when custom CSS is required.
- Do not import a CSS module if the component does not use custom CSS.

## Next.js

- Server components by default.
- Only use `'use client'` when interactivity, hooks, browser APIs, or another client-only requirement is needed.
- Use Server Actions for appropriate server-side mutations.
- Use Route Handlers/API routes when:
  - An explicit HTTP endpoint is required.
  - File uploads/downloads need endpoint handling.
  - Specific HTTP status codes or headers are required.
  - An endpoint may be consumed by the CLI or future clients.
  - A third-party integration requires a webhook/API endpoint.
- Prefer direct server-side data access over unnecessary internal HTTP requests.
- Use dynamic routes for item, collection, and other resource pages.
- Keep Git/filesystem operations in server-side code; never expose filesystem or Git credentials to the browser.

## Styling

- Tailwind CSS v4 is the primary styling solution.
- Do not create `tailwind.config.ts` or `tailwind.config.js`.
- Configure Tailwind v4 through CSS and `@theme`.
- Use shadcn/ui components where applicable.
- No inline styles.
- Use CSS Modules for component-specific custom CSS when Tailwind/shadcn is insufficient.
- CSS Modules must be colocated with the component.

## Tailwind CSS v4

**CRITICAL**: We are using Tailwind CSS v4, which uses CSS-based configuration.

- **DO NOT** create `tailwind.config.ts` or `tailwind.config.js` files (those are for v3)
- All theme configuration must be done in CSS using the `@theme` directive in `src/app/globals.css`
- Use CSS custom properties for colors, spacing, etc.
- No JavaScript-based config allowed

Example v4 configuration:

```css
@import 'tailwindcss';

@theme {
	--color-primary: oklch(50% 0.2 250);
}
```

### CSS Module Naming

For a component:

```text
src/components/test/TestComponent.tsx
src/components/test/test-component.module.css
```

Use:

```tsx
import styles from './test-component.module.css'
```

CSS module filenames must use:

```text
<component-name>.module.css
```

with kebab-case.

- Do not create a CSS module unless custom styles are actually needed.
- Prefer Tailwind for layout, spacing, colors, responsive behavior, and common styling.
- Dark mode first; light mode remains supported.

## File Organization

- Components: `src/components/[feature]/ComponentName.tsx`
- Pages: `src/app/[route]/page.tsx`
- Server Actions: `src/actions/[feature].ts`
- Types: `src/types/[feature].ts`
- Lib/Utils: `src/lib/[utility].ts`

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Pages: Next.js conventions (`page.tsx`, `layout.tsx`)
- Component CSS modules: kebab-case (`item-card.module.css`)
- Other files: Match their purpose; use kebab-case where appropriate.
- Functions: camelCase.
- Constants: SCREAMING_SNAKE_CASE.
- Types/Interfaces: PascalCase with no prefix.
- CLI commands: lowercase, descriptive names (`init`, `start`, `sync`).

## Error Handling

- Handle expected errors explicitly.
- Use `try/catch` around filesystem, Git, network, and other fallible operations.
- Return structured results from Server Actions and shared services where appropriate:
  `{ success, data, error }`
- Show user-friendly errors in the UI.
- CLI errors should explain what failed and, when possible, how the user can fix it.
- Do not expose stack traces or internal implementation details to end users.
- Never silently ignore Git conflicts or failed synchronization.

## Database

- Use Prisma ORM for all database operations
- Always use `prisma migrate dev` for schema changes (not `db push`)
- Run `prisma migrate status` before committing to verify migrations are in sync
- Production deployments must run `prisma migrate deploy` before the app starts

## Data Fetching

- Server components fetch directly with Prisma
- Client components use Server Actions
- Validate all inputs with Zod

## Testing

- Vitest for unit tests; test **server actions and utilities only** (not components/pages)
- Colocate tests as `*.test.ts` next to the code under test
- Import test APIs from `vitest`; import app code via the `@/` alias
- Tests run in the Node environment — no network or database access
- Run `npm test` before building; see `context/ai-interaction.md` for full testing guidance

## Code Quality

- No commented-out code unless specifically required.
- No unused imports, variables, or dead code.
- Keep functions focused and preferably under 50 lines when practical.
- Avoid unnecessary abstractions.
- Prefer composition over duplication.
- Keep UI, domain logic, filesystem logic, and Git logic separated.
- Reuse shared logic between the CLI and web application instead of duplicating implementations.
