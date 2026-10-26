# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

@AGENTS.md

## Claude Code Workflow

- **Quality Gates:** Always execute `pnpm lint:fix` and `pnpm typecheck` before concluding any task.
- **Verification Suites:** `verify:*` commands are standalone `tsx` scripts in `scripts/verify/` (not Jest/Vitest). Run the specific suite for the module you modified (e.g. `pnpm verify:access`), or run `pnpm verify:all` for full validation.
- **Feature Barrels:** Biome strictly enforces barrel import boundaries (`biome.json`). Always import from `@/features/<name>`, never `@/features/<name>/components`.
