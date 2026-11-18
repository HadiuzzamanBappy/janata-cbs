# Janata CBS Client State Stores (`src/store`)

Layer L3: the client-side Zustand stores (session, workbench, alert) plus the theme provider. Every store is created **per provider instance**, never as a module singleton, so server rendering never shares state between requests. Each store is read through its own context hook. Import everything from `@/store`.

---

## 📦 Layout

```text
src/store/
├── scoped-store.ts          # useLazyStore (create once per provider) + useScopedStore (read with an optional selector)
├── root-provider.tsx        # CbsAppStoreProvider: QueryClient → Session → Workbench → Alert
├── session/                 # session-store.ts + session-provider.tsx
├── workbench/               # workbench-store.ts + workbench-provider.tsx
├── alert/                   # alert-store.ts + alert-provider.tsx
├── theme/                   # theme-provider.tsx (next-themes) + use-theme-accent.ts
└── index.ts                 # public barrel
```

`CbsAppStoreProvider` is mounted in two places: `src/components/layout/workbench-shell.tsx` (the `/dashboard` shell) and `src/app/(workbench)/screen/[id]/page.tsx` (each popup window). A popup gets its own store instances and stays in sync with the main shell over the workbench bus.

---

## 🗂️ Stores

### Session (`useSessionStore`)

| State                                                              | Actions                                                               |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `user` (`CurrentUser \| null`), `currentBranch`, `isAuthenticated` | `setSession(user)`, `clearSession()`, `setBranch(branch)`, `logout()` |

- Persisted to `sessionStorage`, so closing the browser ends the working session.
- `SessionStoreProvider` loads the user from `/api/session` (`cbsAuth.getSession()`) when the store has none, and registers `getCurrentUser` with the command gateway.
- `logout()` calls `cbsAuth.logout()`, broadcasts the logout to other windows, clears the client session and goes to the sign-on page. `setBranch()` broadcasts `BRANCH_CHANGED`.

### Workbench (`useWorkbenchStore`)

| State                                    | Actions                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tabs` (`WorkbenchTab[]`), `activeTabId` | `addTab`, `removeTab`, `setActiveTab`, `closeAllTabs`, `closeOthers`, `closeToRight`, `duplicateTab`, `reorderTabs`, `updateFormData`, `setTabDirty`, `updateTabState` |

- Capped at `clientConfig.workbench.maxOpenTabs` (default 15, `NEXT_PUBLIC_MAX_OPEN_TABS`).
- Persisted to `sessionStorage` through `partialize`, so only serializable tab data is stored.
- `WorkbenchStoreProvider` registers `openTab` with the command gateway and accepts tabs docked back from popups. Each dock message is validated with `dockTabPayloadSchema`, and only the active main tab accepts it.
- When a **different** operator signs on, it closes all tabs and clears staged popup drafts, so one user's data never shows for another.

### Alert (`useAlertStore`)

| State                                                                                                          | Actions                              |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `isConfirmOpen`, `confirmOptions` (`title`, `message`, `confirmText?`, `cancelText?`, `variant?`, `onConfirm`) | `confirm(options)`, `closeConfirm()` |

A two-button confirmation dialog only. Multi-step dialogs belong in the screen.

---

## 🚀 Usage

Always pass a selector, so a component re-renders only when its slice changes:

```tsx
import { useAlertStore, useSessionStore, useWorkbenchStore } from "@/store";

const user = useSessionStore((s) => s.user);
const removeTab = useWorkbenchStore((s) => s.removeTab);
const confirm = useAlertStore((s) => s.confirm);

const closeTab = (tabId: string, isDirty: boolean) => {
  if (!isDirty) return removeTab(tabId);
  confirm({
    title: "Unsaved Changes",
    message: "You have unsaved input on this screen. Close it anyway?",
    variant: "destructive",
    onConfirm: () => removeTab(tabId),
  });
};
```

Form drafts don't need a new store. They live on the tab (`WorkbenchTab.formData`, via `updateFormData` or `useCbsPersistence`).

---

## ➕ Adding a store

Only for a concern shared across screens, such as an offline sync queue:

1. Create `src/store/<domain>/<domain>-store.ts` with vanilla `createStore<T>()` from `zustand/vanilla`.
2. Create `<domain>-provider.tsx`: make the store with `useLazyStore(create…)`, put it in a context, and expose `use<Domain>Store(selector?)` through `useScopedStore(context, "<Domain>Store", selector)`.
3. Add the provider to `CbsAppStoreProvider` in `root-provider.tsx`.
4. Export it from `index.ts`.
