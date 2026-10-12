/* -------------------------------------------------------------------------- */
/* Terminal Function Key Handlers & Options                                   */
/* -------------------------------------------------------------------------- */

export interface CbsHotkeysHandlers {
  /** F1: Help / Validation checklist drawer */
  readonly onHelp?: () => void;
  /** F2: New record / Add */
  readonly onCreateNew?: () => void;
  /** F3: Return / Exit to IDLE */
  readonly onReturn?: () => void;
  /** F4: Lookup / Focus search bar */
  readonly onSearchFocus?: () => void;
  /** F5 or Ctrl+S: Commit / Save draft */
  readonly onCommit?: () => void;
  /** F6: Hold uncommitted record */
  readonly onHold?: () => void;
  /** F7: Validate fields & cross-field integrity */
  readonly onValidate?: () => void;
  /** F8: Authorize record (checker) */
  readonly onAuthorize?: () => void;
  /** F9: Process end-of-stage action */
  readonly onProcessAction?: () => void;
  /** F10: Delete record (where applicable) */
  readonly onDelete?: () => void;
  /** F12: Refresh data or inquiry results */
  readonly onRefresh?: () => void;
}

export interface UseCbsHotkeysOptions {
  readonly enabled?: boolean;
  readonly handlers: CbsHotkeysHandlers;
  /** When true, ignores keypresses inside inputs unless modifier (Ctrl/Alt) is pressed. Defaults to false for F-keys */
  readonly ignoreInputs?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Canonical Hotkey Definitions & Reference Registry                         */
/* -------------------------------------------------------------------------- */

export interface CbsHotkeyDefinition {
  readonly key: string;
  readonly label: string;
  readonly action: keyof CbsHotkeysHandlers;
  readonly description: string;
}

export const CBS_TERMINAL_HOTKEYS: readonly CbsHotkeyDefinition[] = [
  { key: "F1", label: "Help", action: "onHelp", description: "Open validation & screen help" },
  { key: "F2", label: "New", action: "onCreateNew", description: "Create new record entry" },
  { key: "F3", label: "Exit", action: "onReturn", description: "Return to search or exit" },
  { key: "F4", label: "Find", action: "onSearchFocus", description: "Focus record key search" },
  { key: "F5 / Ctrl+S", label: "Commit", action: "onCommit", description: "Commit record changes" },
  { key: "F6", label: "Hold", action: "onHold", description: "Put draft on hold" },
  {
    key: "F7",
    label: "Validate",
    action: "onValidate",
    description: "Run field & integrity checks",
  },
  { key: "F8", label: "Auth", action: "onAuthorize", description: "Authorize pending record" },
  { key: "F9", label: "Process", action: "onProcessAction", description: "Execute stage process" },
  { key: "F10", label: "Delete", action: "onDelete", description: "Delete current record" },
  { key: "F12", label: "Refresh", action: "onRefresh", description: "Refresh dataset or screen" },
  { key: "Esc", label: "Back", action: "onReturn", description: "Cancel current operation / back" },
] as const;
