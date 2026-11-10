export interface CbsHotkeysHandlers {
  /** F2: New record / Add */
  readonly onCreateNew?: () => void;
  /** Esc: Return to Search / IDLE */
  readonly onReturn?: () => void;
  /** F5: Commit / Save draft */
  readonly onCommit?: () => void;
  /** F6: Hold uncommitted record */
  readonly onHold?: () => void;
  /** F7: Validate fields & cross-field integrity */
  readonly onValidate?: () => void;
  /** F8: Authorize / Reverse record (checker) */
  readonly onAuthorize?: () => void;
  /** F10: Delete draft record */
  readonly onDelete?: () => void;
}

export interface UseCbsHotkeysOptions {
  readonly enabled?: boolean;
  readonly handlers: CbsHotkeysHandlers;
}
