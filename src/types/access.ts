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
export const CBS_FUNCTION_CODES = Object.values(CbsRecordFunction);
export const CBS_FUNCTION_CODE_SET = new Set<string>(CBS_FUNCTION_CODES);

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
/* 2. Canonical User Security Roles & Capability Context                      */
/* -------------------------------------------------------------------------- */

export const CBS_USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type CbsUserRole = (typeof CBS_USER_ROLES)[keyof typeof CBS_USER_ROLES] | (string & {});

/**
 * Universal User Security Profile Context.
 */
export interface CbsUserSecurityContext {
  readonly userId?: string;
  readonly commandLine?: boolean;
  readonly accessibility?: string | readonly string[];
  readonly userRole?: readonly CbsUserRole[];
  readonly userGroup?: readonly string[];
}
