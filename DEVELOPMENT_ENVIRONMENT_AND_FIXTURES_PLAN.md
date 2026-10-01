# Development Environment, Fixture Realignment & Matrix Verification Plan

> **Goal:** Create a robust, self-contained developer experience (DX) allowing effortless toggling between Mock/Static and Live gRPC, Cache On/Off, and Environment Profiles (Dev/Test/Prod). Align all fixture payloads with actual gRPC Postman responses (`.response/*.json`) without polluting production code, enabling clean decoupling or removal at any time.

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Client / API Routes       |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Service Layer Provider    |
                      | (menu, branch, model, user) |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
     [MODEL_SOURCE=static]                         [MODEL_SOURCE=grpc]
              |                                             |
              v                                             v
+-----------------------------+               +-----------------------------+
|    Fixtures / Mock Layer    |               |       gRPC Client           |
|  (Cleanly isolated module)  |               |  (Live backend connection)  |
|  Matches .response/*.json   |               +-----------------------------+
+-----------------------------+                              |
              |                                              |
              +----------------------+-----------------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Redis Cache Abstraction   |
                      |   (CACHE_ENABLED = true/false)  |
                      +-----------------------------+
```

---

## 4-Phase Phased Execution Roadmap

### Phase 1: Environment Matrix & Profile Standardization [COMPLETED]
**Objective:** Eliminate guesswork in environment switching and provide ready-to-use profile templates.

1. **Environment Profile Templates:**
   - [x] Consolidated all presets into a single canonical [`.env.example`](file:///d:/Work/React/cbs/finx-ui/.env.example) with instant toggle presets (`PRESET A: Offline Mock` vs `PRESET B: Live gRPC & Redis`). Zero clutter in root.
2. **Environment Validation:**
   - [x] Added cross-field `superRefine` validation in `src/lib/config/env.ts` checking for mandatory variables when `MODEL_SOURCE=grpc` or `CACHE_ENABLED=true` (using modern `code: "custom"`).
3. **Verification Step:**
   - [x] Verified `pnpm typecheck` passes with zero errors under current environment.

---

### Phase 2: Fixture Realignment with Real API Payloads (`.response/`)
**Objective:** Upgrade fixtures from hand-crafted approximations to exact 1:1 replicas of wire gRPC responses captured in `.response/`.

1. **User & Auth Realignment (`.response/user.json` -> `fixtures/users.ts`) [COMPLETED]:**
   - [x] Aligned `fixtures/users.ts` with real CBS wire payload (`ZZ0284590`, `MD. HADIUZZAMAN BAPPY`, `RIDASH`, `JB9999`, etc.).
   - [x] Upgraded `src/app/api/login/route.ts` to seamlessly parse both wire Protobuf struct responses (`string_value`, `bool_value`, `number_value`) and flat mock responses.
2. **Menu Tree Realignment (`.response/menu.json` -> `fixtures/menu.ts`) [COMPLETED]:**
   - [x] Aligned `fixtures/menu.ts` with real CBS wire protobuf structure (`fields.records.list_value.values`) from `.response/menu.json`.
   - [x] Verified that `parseMNU` in `src/features/screens/utils/menu-parser.ts` parses both live `.response/menu.json` and static `STATIC_MENU` fixture into identical domain trees.
3. **Controls / Commands Realignment (`.response/control.json` -> `fixtures/command.ts`) [COMPLETED]:**
   - [x] Verified `fixtures/command.ts` matches live wire response structure (`fields.records.list_value.values`) with 100% field compatibility (`recordId`, `description`, `controlName`).
   - [x] Verified `parseControlsPayload` in `src/lib/services/control-service.ts` processes both live `.response/control.json` and static `STATIC_COMMANDS` identically.
4. **Branches Realignment (`.response/branch.json` -> `fixtures/branches.ts`) [COMPLETED]:**
   - [x] Aligned `fixtures/branches.ts` with real CBS branch directory (`JB9999` Central Office, `JB0001` Imamgonj Corporate, `JB0002` Laldighi East, etc.) matching `.response/branch.json`.
   - [x] Verified `fetchBranchesFromBackend` in `src/lib/services/branch-service.ts` extracts identical `BranchMock` domain structures in both offline static and live gRPC modes.
5. **Models / GMC Specifications Realignment (`.response/model.json` -> `fixtures/models.ts`) [COMPLETED]:**
   - [x] Renamed and verified [fixtures/models.ts](file:///d:/Work/React/cbs/finx-ui/fixtures/models.ts) matching live CBS GMC specification schemas.
   - [x] Verified `parseGMC` in `src/features/screens/forms/utils/schema-parser.ts` parses both live `.response/model.json` (331 fields) and static `STATIC_MODELS` fixtures with 100% success.
6. **Verification Step [COMPLETED]:**
   - [x] Executed parser verification across all 4 domain endpoints (user, menu, control, model). All fixtures match live payloads and generate matching UI contracts.

---

### Phase 3: Zero-Clutter Modular Mock Adapter Architecture
**Objective:** Decouple fixtures completely so they can be switched via single env vars or cleanly removed without touching core business logic.

1. **Interface-Based Service Strategy [COMPLETED]:**
   - [x] Defined provider contracts (`IModelProvider`, `IMenuProvider`, `IBranchProvider`, `IControlProvider`) in `src/lib/services/providers/types.ts`.
   - [x] Implemented decoupled mock providers (`src/lib/services/providers/mock/index.ts`).
   - [x] Implemented decoupled live gRPC providers (`src/lib/services/providers/grpc/index.ts`).
   - [x] Refactored `ModelService`, `MenuService`, `BranchService`, and `ControlService` to consume providers via `getModelProvider()`, `getMenuProvider()`, etc., with zero direct `@fixtures` imports in service files.
2. **Clean Removal Guarantee [COMPLETED]:**
   - [x] All mock logic is contained strictly inside `src/lib/services/providers/mock` and `fixtures/`.
   - [x] If `fixtures/` is removed in production, only the mock provider is deleted, leaving production gRPC code untouched.
3. **Cache Layer Integrity (`src/lib/redis/cache.ts`) [COMPLETED]:**
   - [x] Verified `getOrSet` respects `CACHE_ENABLED=false` by bypassing Redis connection attempts and directly executing provider calls.
   - [x] When `CACHE_ENABLED=true`, transparently caches results whether from mock or gRPC.
4. **Verification Step [COMPLETED]:**
   - [x] Verified TypeScript compilation (`pnpm typecheck`) and matrix tests (`pnpm verify:matrix`) pass with 0 errors.

---

### Phase 4: Self-Contained Verification Harness & DX Checklist
**Objective:** Provide a test runner script so you can verify all 4 matrix permutations with a single command without manual checks.

| Matrix Permutation | `MODEL_SOURCE` | `CACHE_ENABLED` | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Permutation 1: Pure Offline** | `static` | `false` | Zero external network calls; instant boot; uses aligned fixtures. |
| **Permutation 2: Cached Offline** | `static` | `true` | Serves fixtures; stores parsed records in Redis cache. |
| **Permutation 3: Direct gRPC** | `grpc` | `false` | Live gRPC calls directly on each request without caching. |
| **Permutation 4: Full Production** | `grpc` | `true` | Live gRPC calls cached in Redis; high-throughput enterprise mode. |

1. **Automated Matrix Verification Script [COMPLETED]:**
   - [x] Created `scripts/verify-env-matrix.ts` testing all 4 permutations programmatically.
   - [x] Added `pnpm verify:matrix` command to `package.json`.
2. **Final Sign-off Checklist [COMPLETED]:**
   - [x] All 14 test assertions passing.
   - [x] Clean developer workflow verified across offline mock and live gRPC modes.
