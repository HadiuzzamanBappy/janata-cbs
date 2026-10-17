export interface CbsHotkeysHandlers {
  /** F1: Help / Validation checklist drawer */
  readonly onHelp?: () => void;
  /** F2: New record / Add */
  readonly onCreateNew?: () => void;
  /** F3 or Esc: Return to Search / IDLE */
  readonly onReturn?: () => void;
  /** F4: Lookup / Focus search bar */
  readonly onSearchFocus?: () => void;
  /** F5: Commit / Save draft */
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
}
