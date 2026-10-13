# 01: Architectural Hierarchy & Layer Boundaries

## The Layered Hierarchy

Dependencies MUST strictly flow top-to-bottom. A lower layer must NEVER import from a higher layer:

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
Level 1: Core & Infrastructure    (src/lib/infra-*, src/lib/core-config/, src/lib/core-logger/)
   │
   ▼
Level 0: Contracts & Schemas      (src/types/, src/lib/data-schemas/)
```

## Layer Import Invariants

1. **`src/types/` & `src/lib/data-schemas/` (Level 0):**
   - Zero internal dependencies. Cannot import from any higher levels.
   - Houses pure TypeScript declarations, Zod schemas, and immutable data models.

2. **`src/lib/infra-*` & `src/lib/core-config/` (Level 1):**
   - Server infrastructure (gRPC, Redis) and configuration singletons.
   - Can only import Level 0 (contracts/schemas).

3. **`src/lib/cbs-*` (Level 2):**
   - Pure CBS business engines (access rights, hotkey engine, record mutation, command parser).
   - Can import Level 0 and Level 1.
   - **CRITICAL**: Cannot import from `src/store/` or `src/features/`. Upward communication must use the Adapter Bus (`registerCommandAdapter`).

4. **`src/store/` (Level 3):**
   - Zustand stores (`session`, `workbench`, `alert`).
   - Must be wrapped in providers and only consumed inside client boundaries.
   - Can import Levels 0, 1, 2.

5. **`src/components/` (Level 4):**
   - Reusable primitives (`ui/`), shells (`layout/`), and general presentation (`cbs-screen/`, `feedback/`).
   - Pure presentation. Cannot import from `src/features/` or `src/app/`.

6. **`src/features/` (Level 5):**
   - Domain-specific logic, screen composition, and business forms.
   - Can import Levels 0 through 4. Features must NOT import across sibling features directly without going through their public barrel export (`index.ts`).

7. **`src/app/` (Level 6):**
   - Top-level routing, layouts, and Next.js route handlers.
   - Can import all lower levels.
