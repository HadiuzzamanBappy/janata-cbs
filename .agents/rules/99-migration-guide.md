# 05: Refactoring Migration Guide (Phase 1)

- **Legacy Component Mapping**: When refactoring old UI elements, they MUST be mapped to the new standardized `shadcn/ui` components (e.g., replace `MessageBox.tsx` with `<Dialog>`).
- **Single Component Loader**: NEVER recreate legacy duplicate loaders (`windowLoader`, `pannelLoader`). You MUST use the single unified `features/workspace/component-loader.tsx`.
- **Tracker Updates**: When migrating an old file, you MUST mark it as `[x]` in `docs/legacy-src-checklist.md` and log progress in `docs/refractor-checklist.md`.
- **Ignore Old Errors**: Do NOT waste time fixing TypeScript errors inside the legacy `src/app/(core)/syscomp/` dump. Focus entirely on cleanly porting the feature to the new architecture.
