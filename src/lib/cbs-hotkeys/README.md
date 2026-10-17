# ⌨️ CBS Hotkeys (`@/lib/cbs-hotkeys`)

A lightweight, high-performance, and safe keyboard shortcut engine designed for the **Janata Core Banking Workbench**.

It gives tellers and branch operators traditional banking-terminal speed while preventing accidental collisions with standard browser or operating system shortcuts (such as `Alt+F4`, `Ctrl+F5`, and `Shift+F10`).

---

## 📦 What It Contains

The library provides two primary React hooks:

1. **`useCbsHotkeys`**: Specialized for core banking screens (forms, inquiries, records). Binds standardized terminal function keys (`F1`–`F12`, `Esc`).
2. **`useHotkeys`**: Generic, low-overhead hook for app-wide shortcuts (like `ctrl+k` or `mod+k` command palette triggers). Automatically harmonizes `Ctrl` on Windows/Linux with `Cmd (⌘)` on macOS.

---

## 🚀 How to Use

### 1. In CBS Screens (`useCbsHotkeys`)

Use this inside screens, drawers, or scaffold layouts. Any unprovided handler is simply ignored.

```tsx
import { useCbsHotkeys } from "@/lib/cbs-hotkeys";

export function AccountOpeningScreen() {
  const handleSave = () => console.log("Saving record...");
  const handleReturn = () => console.log("Returning to search...");

  useCbsHotkeys({
    enabled: true, // conditionally disable if tab is hidden
    handlers: {
      onCommit: handleSave,       // Triggered by F5
      onReturn: handleReturn,     // Triggered by F3 or Esc (when no modal is open)
      onValidate: () => {},       // F7
      onAuthorize: () => {},      // F8
      onCreateNew: () => {},      // F2
      onHold: () => {},           // F6
      onDelete: () => {},         // F10
      onRefresh: () => {},        // F12
    },
  });

  return <div>Screen Content</div>;
}
```

#### Standard Banking Key Bindings:

| Key | Action | Description |
| :--- | :--- | :--- |
| **`F1`** | `onHelp` | Open validation checklist / screen guidance |
| **`F2`** | `onCreateNew` | Reset screen into new entry creation mode |
| **`F3`** | `onReturn` | Return to search or idle view |
| **`F4`** | `onSearchFocus` | Focus the primary search/lookup input |
| **`F5`** | `onCommit` | Save draft or submit record |
| **`F6`** | `onHold` | Mark uncommitted record as Hold |
| **`F7`** | `onValidate` | Run business logic & cross-field validations |
| **`F8`** | `onAuthorize` | Approve pending record (Checker role) |
| **`F9`** | `onProcessAction`| Execute end-of-stage process |
| **`F10`**| `onDelete` | Delete record |
| **`F12`**| `onRefresh` | Reload dataset or inquiry results |
| **`Esc`** | `onReturn` | Return/Back (guarded: ignores if an open dialog is active) |

---

### 2. For General App Shortcuts (`useHotkeys`)

Used for global workstation triggers (e.g., search command bar in sidebar or headers):

```tsx
import { useHotkeys } from "@/lib/cbs-hotkeys";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);

  // Cross-platform: handles Ctrl+K on Windows and Cmd+K on macOS
  useHotkeys("ctrl+k", () => setOpen((prev) => !prev), {
    enableOnFormTags: true, // allow triggering even while cursor is inside an input
  });

  return <SearchModal open={open} onOpenChange={setOpen} />;
}
```

---

## 🛡️ Edge Cases Handled

1. **No OS Shortcut Hijacking:** Plain function keys (`F1`–`F12`) require that `Ctrl`, `Alt`, `Shift`, and `Meta` are **not** held down. This ensures that essential system hotkeys like `Alt+F4` (close window), `Ctrl+F5` (hard refresh), or `Shift+F10` (context menu) continue to work normally.
2. **Modal-Safe `Escape`:** `Escape` only triggers screen return if there are no open modal dialogs (`dialog[open]`, `[role="dialog"][data-state="open"]`). This lets popups close first without throwing the user back to the search screen.
3. **IME Protection:** Keydown events with `isComposing: true` are discarded to prevent unintended actions while typing non-Latin characters.
4. **Ref-Stable Handlers:** Handler callbacks are held in `useRef`, preventing unnecessary event listener re-registration on every render.

---

## 🛠️ Adding a New Screen Function Key
To bind an additional function key across all banking screens:
1. Add the handler signature to `CbsHotkeysHandlers` in `types.ts`.
2. Map the key to the action in `CBS_FKEY_ACTION_MAP` inside `use-cbs-hotkeys.ts`.
3. Pass the handler prop in `CbsScreenScaffold`.
