# ⌨️ CBS Hotkeys (`@/lib/cbs-hotkeys`)

A minimal, 1-operation-per-key keyboard shortcut engine for the **Janata Core Banking Workbench** that avoids collisions with browser/OS shortcuts (`Alt+F4`, `Ctrl+F5`, `Shift+F10`, `F1`, `F12`).

---

## 📦 What It Contains

1. **`useCbsHotkeys`**: Minimal screen function keys (`F2`, `F5`–`F8`, `F10`, `Esc`), wired inside [`CbsScreenScaffold`](file:///d:/Work/React/cbs/janata-cbs/src/components/cbs-screen/cbs-screen-scaffold.tsx).
2. **`useHotkeys`**: App-wide combo hook (`ctrl+k` / `Cmd+K`), wired in [`AppSidebar`](file:///d:/Work/React/cbs/janata-cbs/src/components/layout/app-sidebar.tsx).

---

## ⌨️ Minimal Key Bindings (1 Key Per Operation)

| Key                 | Hook            | Handler       | Action                                               |
| :------------------ | :-------------- | :------------ | :--------------------------------------------------- |
| **`Ctrl+K` / `⌘K`** | `useHotkeys`    | callback      | Toggle Command / Search Palette                      |
| **`F2`**            | `useCbsHotkeys` | `onCreateNew` | New record entry                                     |
| **`Esc`**           | `useCbsHotkeys` | `onReturn`    | Return to search / idle (ignored when modal is open) |
| **`F5`**            | `useCbsHotkeys` | `onCommit`    | Save / Commit draft                                  |
| **`F6`**            | `useCbsHotkeys` | `onHold`      | Hold draft                                           |
| **`F7`**            | `useCbsHotkeys` | `onValidate`  | Validate record rules                                |
| **`F8`**            | `useCbsHotkeys` | `onAuthorize` | Authorize / Reverse record                           |
| **`F10`**           | `useCbsHotkeys` | `onDelete`    | Delete pending draft                                 |

---

## 🛡️ Edge Cases Handled

1. **No OS/Browser Modifier Collisions:** `useCbsHotkeys` requires plain F-keys with no `Ctrl`/`Alt`/`Shift`/`Meta` held.
2. **Modal-Safe Guard:** Screen hotkeys (`Esc`, `F2`, `F5`–`F8`, `F10`) are ignored whenever a modal dialog (`dialog[open]`, `[role="dialog"][data-state="open"]`) is open.
3. **IME Protection:** Discards `keydown` events with `isComposing === true`.
4. **Ref-Stable Handlers:** Stores callbacks in `useRef` to avoid re-registering listeners on re-render.
