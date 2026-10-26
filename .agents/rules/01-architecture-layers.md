# 01: Architectural Hierarchy & Layer Boundaries

Dependencies MUST strictly flow top-to-bottom. A lower level must **NEVER** import from a higher level:

```text
Level 6: Application Routes       (src/app/)
   │
   ▼
Level 5: Domain Features          (src/features/)
   │
   ▼
Level 4: Reusable Components      (src/components/)
   │
   ▼
Level 3: Global State Stores      (src/store/)
   │
   ▼
Level 2: Client Domain Libraries  (src/lib/cbs-*, src/lib/core-utils/)
   │
   ▼
Level 1: Core & Infrastructure    (src/lib/infra-*, src/lib/core-config/)
   │
   ▼
Level 0: Contracts & Schemas      (src/types/, src/lib/data-schemas/)
```

## Layer Import Invariants

1. **`src/types/` & `src/lib/data-schemas/` (Level 0):**
   - Zero internal dependencies. Cannot import from higher levels.
   - Pure TypeScript types, Zod schemas, and canonical domain models.

2. **`src/lib/infra-*` & `src/lib/core-config/` (Level 1):**
   - Server infrastructure (gRPC, Redis) and configuration singletons.
   - Can only import Level 0.

3. **`src/lib/cbs-*` & `src/lib/core-utils/` (Level 2):**
   - Pure CBS business logic (access rights, hotkeys, record mutations, command grammar, formatters).
   - Can import Level 0 and Level 1.
   - **CRITICAL**: Cannot import from `src/store/` or `src/features/`. Upward communication uses the Adapter Bus (`registerCommandAdapter`).

4. **`src/store/` (Level 3):**
   - Zustand stores (`session`, `workbench`, `alert`).
   - Must be wrapped in providers and consumed only inside client components.
   - Can import Levels 0, 1, 2.

5. **`src/components/` (Level 4):**
   - Reusable primitives (`ui/`), shells (`layout/`), and general presentation (`cbs-screen/`).
   - Cannot import from `src/features/` or `src/app/`.

6. **`src/features/` (Level 5):**
   - Screen composition, designer tabs, and dynamic form engines.
   - Can import Levels 0 through 4. Sibling features must import only through public barrel exports (`index.ts`). Direct imports like `@/features/X/components` are banned by Biome.

7. **`src/app/` (Level 6):**
   - Next.js App Router layouts, routes, and API route handlers.
   - Can import all lower levels.
