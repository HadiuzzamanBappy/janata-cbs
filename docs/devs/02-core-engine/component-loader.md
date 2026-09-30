# 🧩 Component Loader & Pop-Out Window Manager Architecture

## 1. Executive Summary & Purpose
This document specifies the architecture, resolution flow, and lifecycle management for the `ComponentLoader` and pop-out window subsystem in `finxui-ref`.

The `ComponentLoader` serves as the single unified component resolution entry point. It dynamically resolves whether a requested banking screen command should render via a bespoke React component override (registered in `registry.tsx`) or fall back to the generic 12-column `FormScreen` engine.

---

## 2. Dynamic Resolution & Load Flow

```mermaid
flowchart TD
    Cmd["Command Trigger (launchCommand / openComponentWindow)"] --> Loader["ComponentLoader (src/features/screens/loader.tsx)"]
    Loader -->|Registry Override Exists| Bespoke["Bespoke Component Registry<br/>(src/features/screens/registry.tsx)"]
    Loader -->|No Override (Generic GMC)| Dynamic["FormScreen Engine<br/>(src/features/screens/forms)"]
```

---

## 3. Pop-Out Window Mode Architecture (`window` vs `panel`)

Banking officers can operate screens in two distinct display modes managed by [src/features/screens/launcher.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/launcher.ts):
1. **`panel` Mode (Internal Workspace Tabs):** The screen renders inside the main dashboard tab bar (`AppTabbar`). State and tab entries are managed in [src/store/workbench/workbench-store.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/store/workbench/workbench-store.ts).
2. **`window` Mode (Browser Pop-Out Windows):** The screen launches in a detached browser window via `openComponentWindow()`.

### Smart Instance Reuse Algorithm
When a user launches a command in `window` mode:
1. `launcher.ts` queries the active window map in `useWorkbenchStore`.
2. **If window instance exists:** It calls `window.focus()` on the existing reference, preventing duplicate window spawns.
3. **If window does not exist:** It opens a new popup window with workspace parameters (`/screen/[id]?mode=window`).

---

## 4. Architectural Invariants & Rules

### Mandatory Rules (MUST)
- **MUST** route all dynamic screen loading through [src/features/screens/loader.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/loader.tsx).
- **MUST** register bespoke screen overrides in the central `SCREEN_REGISTRY` in [src/features/screens/registry.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/registry.tsx).
- **MUST** focus existing pop-out window instances rather than spawning duplicate popup windows for the same command ID.

### Prohibited Rules (MUST NOT)
- **MUST NOT** instantiate parallel loader components or resurrect legacy triple-loader patterns.
- **MUST NOT** hardcode direct component imports inside generic layout shells.

---

## 5. Verification & Extension Instructions

### Registering a New Custom Bespoke Screen Override
1. Build custom React component in `src/features/<domain>/components/my-custom-screen.tsx` or under `src/features/screens/`.
2. Add command entry to `SCREEN_REGISTRY` in [src/features/screens/registry.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/registry.tsx):
   ```typescript
   "MY.CUSTOM.CMD": lazy(() => import("@/features/my-domain/components/my-custom-screen"))
   ```
3. Test loading via the command launcher and run `pnpm typecheck`.

---

## 6. Affected Documentation Updates
When modifying component resolution or window launcher utilities, update:
- [docs/devs/02-core-engine/component-loader.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/02-core-engine/component-loader.md)
- [docs/devs/03-domain-features/workspace-and-windows.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/03-domain-features/workspace-and-windows.md)

