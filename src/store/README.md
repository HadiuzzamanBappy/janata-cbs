# Janata CBS Client State Stores (`src/store`)

The `src/store` module provides the unified client-side state management layer for the Janata Core Banking System (CBS) workbench. It implements isolated, SSR-safe Zustand stores wrapped within React Context, with cross-window broadcast channels and tab-isolated draft persistence.

---

## 1. Architectural Design & Philosophy

Modern Next.js applications (App Router) encounter cross-request state pollution if stores are instantiated as global module singletons. To avoid this, `src/store` adheres to the following principles:

1. **Context-Bound Factory Pattern (`createStore`)**:
   Stores are created via vanilla Zustand factory functions inside React Context Providers using `useRef`. Each client window/tab maintains its own distinct store instance without risking cross-session state leakage.
2. **Strict Session Boundary (`sessionStorage`)**:
   In compliance with banking security standards, operational state (teller sessions and workbench tabs) is committed to `sessionStorage` rather than `localStorage`. Terminating the browser session automatically evicts working state.
3. **Cross-Window Bus Coordination (`BroadcastChannel`)**:
   When banking screens are popped out into detached windows or secondary teller monitors, state synchronization (such as global session logout, branch switching, or tab re-docking) is propagated across browser contexts via `BroadcastChannel("cbs_workbench_bus")`.
4. **Decoupled Command Bus Adapter**:
   Instead of coupling stores directly to hotkeys or execution engines, stores register adapters with `cbs-command` via `registerCommandAdapter()`, adhering to clean inversion of control.

---

## 2. Store Inventory

```
src/store/
├── alert/
│   ├── alert-store.ts         # Global confirmation dialog state
│   └── alert-provider.tsx      # Alert Context Provider & useAlertStore hook
├── session/
│   ├── session-store.ts       # Authenticated user, branch context, and logout
│   └── session-provider.tsx    # Session Context Provider & automatic hydration
├── workbench/
│   ├── workbench-store.ts     # Multi-document interface (MDI), tab drafts, dirty states
│   └── workbench-provider.tsx  # Workbench Context Provider & cross-window dock listener
├── index.ts                   # Consolidated public export barrel
├── root-provider.tsx          # Master CbsAppStoreProvider hierarchy
└── theme-provider.tsx         # NextThemes wrapper with data-theme synchronization
```

---

## 3. Store Breakdown

### 3.1. Session Store (`session/`)
Manages the authenticated operator identity, current active branch, and session lifecycle.

- **State**:
  - `user`: Authenticated operator (`CurrentUser | null`).
  - `currentBranch`: Active accounting branch code.
  - `isAuthenticated`: Boolean authentication flag.
- **Actions**:
  - `setSession(user)`: Commits user to store and flags authenticated.
  - `setBranch(branch)`: Switches current branch code and broadcasts `BRANCH_CHANGED` to all detached windows.
  - `logout()`: Dispatches POST to `/api/logout`, emits `SESSION_LOGOUT` across the cross-window bus, clears memory, and redirects to `/login`.
- **Hydration**:
  On mount, `SessionStoreProvider` verifies whether `user` exists; if null, it fetches `/api/session` to hydrate the teller profile.

### 3.2. Workbench Store (`workbench/`)
Powers the CBS Multiple Document Interface (MDI), managing up to 15 concurrent operational tabs with isolated draft inputs.

- **State**:
  - `tabs`: Array of `WorkbenchTab` objects.
  - `activeTabId`: Currently focused tab identifier.
- **Key Features**:
  - **Memory Guardrail**: Capped at `clientConfig.workbench.maxOpenTabs` (15 tabs) to avoid browser memory bloat on low-spec teller hardware.
  - **Draft Form Isolation**: `updateFormData(tabId, data)` isolates uncommitted form changes per tab without affecting duplicate screens.
  - **Dirty Tracking**: `setTabDirty(tabId, isDirty)` tracks unsaved changes to trigger modal warnings before closing.
  - **Tab Lifecycle Actions**: `addTab`, `removeTab`, `setActiveTab`, `closeAllTabs`, `closeOthers`, `closeToRight`, `duplicateTab`, and `reorderTabs`.
  - **Persistence Filtering**: Uses `partialize` to only persist serializable tab metadata (`tabs`, `activeTabId`) to `sessionStorage`.

### 3.3. Alert Store (`alert/`)
Provides a programmatic confirmation dialog store for destructive actions (e.g., closing dirty tabs or confirming large financial transfers).

- **State**:
  - `isConfirmOpen`: Boolean visibility flag.
  - `confirmOptions`: Options including `title`, `message`, `confirmText`, `cancelText`, `variant`, and `onConfirm` callback.
- **Actions**:
  - `confirm(options)`: Opens the confirmation modal.
  - `closeConfirm()`: Dismisses the confirmation modal.

---

## 4. Usage Guide

### 4.1. Application Root Setup
Wrap your layout with `CbsAppStoreProvider` (located in [root-provider.tsx](file:///d:/Work/React/cbs/janata-cbs/src/store/root-provider.tsx)). This sets up the complete provider hierarchy:

```tsx
import { CbsAppStoreProvider } from "@/store";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CbsAppStoreProvider>
          {children}
        </CbsAppStoreProvider>
      </body>
    </html>
  );
}
```

### 4.2. Consuming State with Selectors
Always pass selectors to store hooks to prevent unnecessary re-renders:

```tsx
import { useSessionStore, useWorkbenchStore, useAlertStore } from "@/store";

export function TellerHeader() {
  // 1. Session store with selector
  const user = useSessionStore((state) => state.user);
  const currentBranch = useSessionStore((state) => state.currentBranch);

  // 2. Workbench store with selector
  const activeTabId = useWorkbenchStore((state) => state.activeTabId);
  const openTab = useWorkbenchStore((state) => state.addTab);

  // 3. Alert store
  const confirm = useAlertStore((state) => state.confirm);

  const handleClose = (tabId: string, isDirty?: boolean) => {
    if (isDirty) {
      confirm({
        title: "Unsaved Changes",
        message: "You have unsaved input on this screen. Are you sure you want to close it?",
        variant: "destructive",
        onConfirm: () => useWorkbenchStore.getState?.() // or call action
      });
    }
  };

  return <div>{user?.fullName} ({currentBranch})</div>;
}
```

---

## 5. Architectural Status: Scalable or Sealed?

The store system is deliberately partitioned into **sealed core operational stores** and **extensible screen-level state**:

| Store | Architectural Status | Rationalization |
| :--- | :--- | :--- |
| **`SessionStore`** | **Sealed Core** | Sealed. The authentication, branch assignment, and logout lifecycle are core banking concerns governed by security protocols. Custom business attributes belong in `CurrentUser` schema, not ad-hoc store mutations. |
| **`AlertStore`** | **Sealed Core** | Sealed. Purpose-built strictly for two-button confirmation dialogs. Complex multi-step wizard dialogues should use local component state or screen-specific dialogs. |
| **`WorkbenchStore`** | **Sealed Infrastructure** | Sealed infrastructure. The tab model, memory capping (15 tabs), title de-duplication, and cross-window docking mechanisms are sealed to protect workspace stability. |
| **Screen Form State** | **Scalable Payloads** | Open/Scalable. Dynamic banking forms do not require new Zustand stores. Instead, store form drafts directly into `WorkbenchTab.formData` using `updateFormData(tabId, data)` or isolate them within React Hook Form inside individual screen components. |

### How to Add a New Domain Store
If a new cross-cutting concern is introduced (e.g., an Offline Sync Queue or Notification Feed):
1. **Create the store factory** (`src/store/<domain>/<domain>-store.ts`) using vanilla `createStore<T>()`.
2. **Create the React Context Provider** (`src/store/<domain>/<domain>-provider.tsx`) using `useRef` + `createContext` + `useStore`.
3. **Register in `CbsAppStoreProvider`** (`src/store/root-provider.tsx`) within the master hierarchy.
4. **Export hooks and types** through `src/store/index.ts`.
