/**
 * Canonical Core Banking Domain Types
 * Single source of truth across UI, Command Gateway, State Stores, and Screen Modules.
 *
 * S: See       - Read a single record without locking
 * I: Insert    - Lock, then update or insert; archives to history (Maker)
 * D: Delete    - Lock, archive to deletion table, delete from unauthorized table only
 * A: Authorize - Approve a pending record under maker-checker (Checker)
 * R: Reverse   - Delete and make history from live table
 * H: History   - Inspect historical revisions ($HIS)
 */

export const CBS_FUNCTION_CODES = ["S", "I", "D", "A", "R", "H"] as const;

export type FunctionRightCode = (typeof CBS_FUNCTION_CODES)[number];
export type CbsRecordFunction = FunctionRightCode;

export const CbsRecordFunction = {
  SEE: "S",
  INPUT: "I",
  DELETE: "D",
  AUTHORIZE: "A",
  REVERSE: "R",
  HISTORY: "H",
} as const;

export interface CbsFunctionDefinition {
  code: FunctionRightCode;
  name: string;
  label: string;
  description: string;
  realWorldEffect: string;
}

export const CBS_FUNCTION_DEFINITIONS: Record<FunctionRightCode, CbsFunctionDefinition> = {
  S: {
    code: "S",
    name: "SEE",
    label: "See / View",
    description: "Read a single record",
    realWorldEffect: "Inspects live or unauthorized record without row lock",
  },
  I: {
    code: "I",
    name: "INPUT",
    label: "Insert / Update",
    description: "Lock, then update or insert; archives to history",
    realWorldEffect: "Maker captures draft, validates onsite rules, commits to $NAU",
  },
  D: {
    code: "D",
    name: "DELETE",
    label: "Delete",
    description: "Delete from unauthorized table only",
    realWorldEffect: "Archives to deletion table and purges unapproved draft from $NAU",
  },
  A: {
    code: "A",
    name: "AUTHORIZE",
    label: "Authorize",
    description: "Approve a pending record under maker-checker",
    realWorldEffect: "Checker approves pending draft, promoting from $NAU into live ledger",
  },
  R: {
    code: "R",
    name: "REVERSE",
    label: "Reverse",
    description: "Delete and make history from live table",
    realWorldEffect: "Reverses live transaction with offsetting accounting entries",
  },
  H: {
    code: "H",
    name: "HISTORY",
    label: "History",
    description: "Inspect historical revisions ($HIS)",
    realWorldEffect: "Audits prior version snapshots and historical deltas",
  },
};

/**
 * Resulting UI screen display mode
 * "IDLE" or standard RIDASH code ("S" | "I" | "D" | "A" | "R" | "H")
 */
export type CbsScreenMode = "IDLE" | CbsRecordFunction;

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
