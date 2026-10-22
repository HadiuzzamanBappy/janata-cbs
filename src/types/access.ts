/**
 * Canonical CBS Maker-Checker & RIDASHL Access Control Types
 * Official specification from CORE TECHNICAL DOCUMENTATION V1.0.1 (Section 6.5).
 */

export const CbsRecordFunction = {
  SEE: "S",
  INPUT: "I",
  DELETE: "D",
  AUTHORIZE: "A",
  REVERSE: "R",
  HOLD: "H",
  LIST: "L",
} as const;

export type CbsRecordFunction = (typeof CbsRecordFunction)[keyof typeof CbsRecordFunction];
export const CBS_FUNCTION_CODES = Object.values(CbsRecordFunction);

export interface CbsFunctionDefinition {
  readonly code: CbsRecordFunction;
  readonly description: string;
  readonly label: string;
  readonly name: string;
  readonly realWorldEffect: string;
}

export const CBS_FUNCTION_DEFINITIONS = {
  [CbsRecordFunction.SEE]: {
    code: CbsRecordFunction.SEE,
    name: "SEE",
    label: "See / View",
    description: "Read a single record",
    realWorldEffect: "Inspects live or unauthorized record without row lock",
  },
  [CbsRecordFunction.INPUT]: {
    code: CbsRecordFunction.INPUT,
    name: "INPUT",
    label: "Insert / Update",
    description: "Lock, then update or insert; archives to history",
    realWorldEffect: "Maker captures draft, validates onsite rules, commits to $NAU",
  },
  [CbsRecordFunction.DELETE]: {
    code: CbsRecordFunction.DELETE,
    name: "DELETE",
    label: "Delete",
    description: "Delete from unauthorized table only",
    realWorldEffect: "Archives to deletion table and purges unapproved draft from $NAU",
  },
  [CbsRecordFunction.AUTHORIZE]: {
    code: CbsRecordFunction.AUTHORIZE,
    name: "AUTHORIZE",
    label: "Authorize",
    description: "Approve a pending record under maker-checker",
    realWorldEffect: "Checker approves pending draft, promoting from $NAU into live ledger",
  },
  [CbsRecordFunction.REVERSE]: {
    code: CbsRecordFunction.REVERSE,
    name: "REVERSE",
    label: "Reverse",
    description: "Delete and make history from live table",
    realWorldEffect: "Reverses live transaction with offsetting accounting entries",
  },
  [CbsRecordFunction.HOLD]: {
    code: CbsRecordFunction.HOLD,
    name: "HOLD",
    label: "Hold / Park",
    description: "Park a draft record pending completion, without submitting for authorization",
    realWorldEffect: "Maker parks an in-progress draft in the unauthorized queue",
  },
  [CbsRecordFunction.LIST]: {
    code: CbsRecordFunction.LIST,
    name: "LIST",
    label: "List / Directory",
    description: "Query and list multiple records",
    realWorldEffect: "Fetches table catalog or directory rows without row locking",
  },
} as const satisfies Record<CbsRecordFunction, CbsFunctionDefinition>;
