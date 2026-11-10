/**
 * Canonical CBS Maker-Checker & RIDASHL Access Control Types
 */

/* -------------------------------------------------------------------------- */
/* 1. Canonical CBS Function Codes (RIDASHL)                                  */
/* -------------------------------------------------------------------------- */

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
export const CBS_FUNCTION_CODES: readonly CbsRecordFunction[] = Object.values(CbsRecordFunction);

/** Controlled mutating function codes requiring server-side permission checks */
export const CBS_CONTROLLED_FUNCTIONS: readonly CbsRecordFunction[] = [
  CbsRecordFunction.INPUT,
  CbsRecordFunction.AUTHORIZE,
  CbsRecordFunction.DELETE,
  CbsRecordFunction.REVERSE,
  CbsRecordFunction.HOLD,
];

export interface CbsFunctionDefinition {
  readonly code: CbsRecordFunction;
  readonly label: string;
  readonly description: string;
}

export const CBS_FUNCTION_DEFINITIONS = {
  [CbsRecordFunction.SEE]: {
    code: CbsRecordFunction.SEE,
    label: "See / View",
    description: "Read record",
  },
  [CbsRecordFunction.INPUT]: {
    code: CbsRecordFunction.INPUT,
    label: "Insert / Update",
    description: "Input draft",
  },
  [CbsRecordFunction.DELETE]: {
    code: CbsRecordFunction.DELETE,
    label: "Delete",
    description: "Purge unapproved draft",
  },
  [CbsRecordFunction.AUTHORIZE]: {
    code: CbsRecordFunction.AUTHORIZE,
    label: "Authorize",
    description: "Approve draft",
  },
  [CbsRecordFunction.REVERSE]: {
    code: CbsRecordFunction.REVERSE,
    label: "Reverse",
    description: "Reverse live transaction",
  },
  [CbsRecordFunction.HOLD]: {
    code: CbsRecordFunction.HOLD,
    label: "Hold / Park",
    description: "Park draft",
  },
  [CbsRecordFunction.LIST]: {
    code: CbsRecordFunction.LIST,
    label: "List / Directory",
    description: "Directory query",
  },
} as const satisfies Record<CbsRecordFunction, CbsFunctionDefinition>;

/* -------------------------------------------------------------------------- */
/* 2. Canonical User Security Context                                         */
/* -------------------------------------------------------------------------- */

export interface CbsUserSecurityContext {
  readonly userId?: string;
  readonly commandLine?: boolean;
  readonly accessibility?: readonly string[];
  readonly userRole?: readonly string[];
  readonly userGroup?: readonly string[];
}
