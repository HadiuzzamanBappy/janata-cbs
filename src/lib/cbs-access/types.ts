import type { CbsRecordFunction } from "@/types/cbs-function";

/**
 * Standard Core Banking RIDASH Function Codes:
 *  - R: Reverse (reverse live authorized record)
 *  - I: Input / Amend (Maker lock, insert/update draft to $NAU)
 *  - D: Delete (delete pending unapproved draft from $NAU)
 *  - A: Authorize (Checker approval promoting from $NAU to live ledger)
 *  - S: See (single record read without lock)
 *  - H: History (inspect historical snapshots)
 */
export type CbsAccessFunctionCode = CbsRecordFunction;

/**
 * Standard record lifecycle statuses in Core Banking:
 *  - NEW: Uncommitted newly created draft
 *  - INA: Input Not Authorized (pending Maker-Checker approval in $NAU)
 *  - AU:  Authorized / Live ledger record
 *  - HLD: Held / Parked draft
 *  - REV: Reversed / Cancelled
 *  - DEL: Deleted draft
 */
export type CbsRecordLifecycleStatus = "NEW" | "INA" | "AU" | "HLD" | "REV" | "DEL";

export interface CbsAccessContext {
  /** Screen command code (e.g. "CUSTOMER", "ACCOUNT", "MODEL.CONFIG") */
  command?: string;
  /** Active record lifecycle status (INA, AU, HLD, etc.) */
  recordStatus?: CbsRecordLifecycleStatus | string;
  /** Inputter/Maker user ID of the current record */
  recordInputter?: string;
  /** Active screen display mode (IDLE, I, S, A, D, R, H) */
  mode?: "IDLE" | CbsAccessFunctionCode;
}

export interface CbsAccessResult {
  /** Whether user has a specific function code right in their accessibility profile */
  hasFunctionRight: (code: CbsAccessFunctionCode) => boolean;

  /** Dynamic capability evaluations taking record state & Four-Eyes into account */
  canSee: boolean;
  canInput: boolean;
  canAmend: boolean;
  canDelete: boolean;
  canHold: boolean;
  canAuthorize: boolean;
  canReverse: boolean;
  canHistory: boolean;

  /** True if screen should be rendered read-only */
  isReadOnly: boolean;

  /** True if Four-Eyes compliance is violated (Maker trying to authorize own record) */
  isFourEyesViolation: boolean;

  /** Returns human-readable disabled explanation for tooltips */
  getDisableReason: (action: CbsAccessFunctionCode) => string | null;

  /** Raw parsed function rights array (e.g. ['R', 'I', 'D', 'A', 'S', 'H']) */
  grantedRights: CbsAccessFunctionCode[];
}
