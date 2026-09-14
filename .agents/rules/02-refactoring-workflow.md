# Refactoring Workflow

When working on migrating legacy code from `finxui` to `finxui-ref`, always follow this methodology:

## 1. Feature Parity, Not Copy-Paste
Do NOT copy-paste legacy code. 
- Read the legacy file to understand its business purpose.
- Rebuild that feature from scratch using modern best practices (Next 16, React 19, Zustand).

## 2. Strict Sequential Execution
Follow `docs/refractor-checklist.md` rigorously.
- Never skip ahead. Complete all tasks in a step before moving to the next.
- Steps 6 and 7 can only run in parallel after Step 5 is done.

## 3. Tracking Progress
When a legacy file's functionality has been successfully rebuilt and tested in the new project:
- Open `docs/legacy-src-checklist.md` and mark the legacy file with `[x]`.
- Open `docs/refractor-checklist.md` and check off the corresponding task.

## 4. Quality Assurance
Before marking a core task complete, always verify that the project still complies with the strict ESLint rules by running:
- `pnpm typecheck`
- `pnpm lint`
