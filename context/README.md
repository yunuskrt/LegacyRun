# Context

These are the context files referenced by the `CLAUDE.md` file. Only the five root-level files listed first are loaded into the AI's memory on startup. Everything else is fed to the AI on demand via commands like `/feature` and `/todo`.

Loaded on startup:

- `project-overview.md` - Full project spec including features, data models, tech stack and UI/UX
- `coding-standards.md` - Code conventions, patterns and rules for the AI to follow
- `ai-interaction.md` - Workflow and communication guidelines for working with the AI
- `current-feature.md` - Living document tracking the feature currently being worked on, plus the history of completed ones
- `AGENTS.md` - Up to date Next.js search to avoid deprecations

Loaded on demand:

- `todo.md` - Ordered roadmap of build phases and open decisions, used with the `/todo` command
- `theme.md` - The "Dark Trophy Room" palette and visual direction
- `docs/` - Reference documentation for the engines and designs the phases were built against
- `features/` - Feature spec files used with the `/feature` command
- `screenshots/` - UI screenshots used as visual references for the AI
