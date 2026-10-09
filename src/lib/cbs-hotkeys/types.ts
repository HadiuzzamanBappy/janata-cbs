export interface CbsHotkeysHandlers {
  /** F1: Help / Validation checklist drawer */
  onHelp?: () => void;
  /** F2: New record / Add */
  onCreateNew?: () => void;
  /** F3: Return / Exit to IDLE */
  onReturn?: () => void;
  /** F4: Lookup / Focus search bar */
  onSearchFocus?: () => void;
  /** F5 or Ctrl+S: Commit / Save draft */
  onCommit?: () => void;
  /** F6: Hold uncommitted record */
  onHold?: () => void;
  /** F7: Validate fields & cross-field integrity */
  onValidate?: () => void;
  /** F8: Authorize record (checker) */
  onAuthorize?: () => void;
  /** F9: Process end-of-stage action */
  onProcessAction?: () => void;
  /** F10: Delete record (where applicable) */
  onDelete?: () => void;
  /** F12: Refresh data or inquiry results */
  onRefresh?: () => void;
}

export interface UseCbsHotkeysOptions {
  enabled?: boolean;
  handlers: CbsHotkeysHandlers;
  /** When true, ignores keypresses inside inputs unless modifier (Ctrl/Alt) is pressed. Defaults to false for F-keys */
  ignoreInputs?: boolean;
}

export interface CbsHotkeyDefinition {
  key: string;
  label: string;
  action: keyof CbsHotkeysHandlers;
  description: string;
}

export const CBS_TERMINAL_HOTKEYS: CbsHotkeyDefinition[] = [
  { key: "F1", label: "Help", action: "onHelp", description: "Open validation & screen help" },
  { key: "F2", label: "New", action: "onCreateNew", description: "Create new record entry" },
  { key: "F3", label: "Exit", action: "onReturn", description: "Return to search or exit" },
  { key: "F4", label: "Find", action: "onSearchFocus", description: "Focus record key search" },
  { key: "F5 / Ctrl+S", label: "Commit", action: "onCommit", description: "Commit record changes" },
  { key: "F6", label: "Hold", action: "onHold", description: "Put draft on hold" },
  { key: "F7", label: "Validate", action: "onValidate", description: "Run field & integrity checks" },
  { key: "F8", label: "Auth", action: "onAuthorize", description: "Authorize pending record" },
  { key: "F9", label: "Process", action: "onProcessAction", description: "Execute stage process" },
  { key: "F10", label: "Delete", action: "onDelete", description: "Delete current record" },
  { key: "F12", label: "Refresh", action: "onRefresh", description: "Refresh dataset or screen" },
  { key: "Esc", label: "Back", action: "onReturn", description: "Cancel current operation / back" },
];
