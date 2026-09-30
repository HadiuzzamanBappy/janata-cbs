# 🖥️ Workspace & Window Management Domain Architecture

## 1. Executive Summary & Purpose
This document specifies the architecture, state management, tab lifecycle, and window pop-out manager of the Workbench and Screen subsystems in `finxui-ref`.

The workspace manages officer navigation, dynamic tab switching (`panel` mode), detached browser pop-out windows (`window` mode), command execution via [src/features/screens/launcher.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/launcher.ts), and CBS menu tree parsing via [src/features/screens/utils/menu-parser.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/utils/menu-parser.ts).

---

## 2. Command Execution & Workspace Flow

```mermaid
flowchart TD
    User["User Action / Menu Selection"] --> Launch["launchCommand (launcher.ts)"]
    Launch -->|Mode == panel| TabStore["Add Tab to useWorkbenchStore<br/>(src/store/workbench/workbench-store.ts)"]
    Launch -->|Mode == window| WinStore["Open / Focus Window Instance<br/>(openComponentWindow in launcher.ts)"]
```

---

## 3. State Ownership & Tab Lifecycle

### Workspace State Store ([src/store/workbench/workbench-store.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/store/workbench/workbench-store.ts))
- **Active Tabs (`tabs`):** Array of open tab objects containing `id`, `title`, `command`, `mode`, and `draftState`.
- **Active Tab ID (`activeTabId`):** Id of the tab currently visible in the main panel.
- **Draft Preservation:** When switching between tabs, form input values are stored inside `tab.draftState` to prevent loss of uncommitted data.

### Menu Tree Parser ([src/features/screens/utils/menu-parser.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/utils/menu-parser.ts))
- **Role:** Parses raw backend navigation payloads (`MNU` JSON) using Zod schemas into hierarchical sidebar navigation items consumed by `AppSidebar`.

---

## 4. Architectural Invariants & Rules

### Mandatory Rules (MUST)
- **MUST** route all internal screen transitions through `launchCommand` or `openComponentWindow` in [launcher.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/launcher.ts).
- **MUST NOT** use Next.js `<Link>` tags for internal workbench screen navigation.
- **MUST** preserve uncommitted form drafts in `tab.draftState` during tab switches.

---

## 5. Verification Criteria

To verify workspace functionality:
```bash
# Typecheck workspace domain types and components
pnpm typecheck

# Lint check workspace module
pnpm lint
```

---

## 6. Affected Documentation Updates
When modifying workspace state or screen launching, update:
- [docs/devs/03-domain-features/workspace-and-windows.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/03-domain-features/workspace-and-windows.md)
- [docs/devs/02-core-engine/component-loader.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/02-core-engine/component-loader.md)

