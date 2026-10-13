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

export const CBS_FUNCTION_CODES = ["S", "I", "D", "A", "R", "H", "L"] as const;

export const CbsRecordFunction = {
  SEE: "S",
  INPUT: "I",
  DELETE: "D",
  AUTHORIZE: "A",
  REVERSE: "R",
  HISTORY: "H",
  LIST: "L",
} as const;

export type CbsRecordFunction = (typeof CbsRecordFunction)[keyof typeof CbsRecordFunction];

/**
 * @deprecated Use `CbsRecordFunction` directly for single source of truth.
 */
export const CBS_RECORD_FUNCTIONS = CbsRecordFunction;

export interface CbsFunctionDefinition {
  readonly code: CbsRecordFunction;
  readonly description: string;
  readonly label: string;
  readonly name: string;
  readonly realWorldEffect: string;
}

export const CBS_FUNCTION_DEFINITIONS = {
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
  L: {
    code: "L",
    name: "LIST",
    label: "List / Directory",
    description: "Query and list multiple records",
    realWorldEffect: "Fetches table catalog or directory rows without row locking",
  },
} as const satisfies Record<CbsRecordFunction, CbsFunctionDefinition>;

/**
 * Resulting UI screen display mode
 * "IDLE" or standard RIDASH code ("S" | "I" | "D" | "A" | "R" | "H")
 */
export const CBS_SCREEN_MODES = ["IDLE", ...CBS_FUNCTION_CODES] as const;
export type CbsScreenMode = (typeof CBS_SCREEN_MODES)[number];

/**
 * Workspace rendering display targets:
 *  - panel: Embedded inside workbench tabbed interface
 *  - window: Detached standalone browser popup window
 */
export const WORKSPACE_DISPLAY_MODES = ["panel", "window"] as const;
export type WorkspaceDisplayMode = (typeof WORKSPACE_DISPLAY_MODES)[number];

/**
 * Standard record lifecycle statuses in Core Banking:
 *  - NEW: Uncommitted newly created draft
 *  - INA: Input Not Authorized (pending Maker-Checker approval in $NAU)
 *  - AU:  Authorized / Live ledger record
 *  - HLD: Held / Parked draft
 *  - REV: Reversed / Cancelled
 *  - DEL: Deleted draft
 */
export const CBS_RECORD_STATUSES = ["NEW", "INA", "AU", "HLD", "REV", "DEL"] as const;
export type CbsRecordLifecycleStatus = (typeof CBS_RECORD_STATUSES)[number];

export interface CbsRecordStatusDefinition {
  readonly code: CbsRecordLifecycleStatus;
  readonly description: string;
  readonly label: string;
  readonly variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export const CBS_RECORD_STATUS_DEFINITIONS: Record<
  CbsRecordLifecycleStatus,
  CbsRecordStatusDefinition
> = {
  AU: {
    code: "AU",
    description: "Live authorized ledger record",
    label: "Authorized",
    variant: "success",
  },
  DEL: {
    code: "DEL",
    description: "Deleted unauthorized draft",
    label: "Deleted",
    variant: "destructive",
  },
  HLD: {
    code: "HLD",
    description: "Parked / held draft pending completion",
    label: "Held",
    variant: "warning",
  },
  INA: {
    code: "INA",
    description: "Input Not Authorized (awaiting Checker approval in $NAU)",
    label: "Pending Approval",
    variant: "secondary",
  },
  NEW: {
    code: "NEW",
    description: "Newly initialized uncommitted record",
    label: "New Draft",
    variant: "outline",
  },
  REV: {
    code: "REV",
    description: "Reversed accounting transaction",
    label: "Reversed",
    variant: "destructive",
  },
};

/* -------------------------------------------------------------------------- */
/* Canonical Control Table Identifiers & Request Types                         */
/* -------------------------------------------------------------------------- */

/**
 * Canonical Application & Target Control Table Identifiers.
 * Defines the active control table identifiers recognized by the CBS client.
 */
export const CbsControlTable = {
  BRANCH: "BRANCH",
  CONTROL: "CONTROL",
  MENU: "SC.MENU",
  MENU_TREE: "SC.MENU.TREE",
  USER_GROUP: "SC.USER.GROUP",
  USER_PASS_RESET: "SC.USER.PASS.RESET",
  MODEL_CONFIG: "SC.MODEL.CONFIG",
  FORM_CONFIG: "SC.FORM.CONFIG",
  INQUIRY: "INQUIRY",
} as const;

export type CbsControlTable = (typeof CbsControlTable)[keyof typeof CbsControlTable];

/**
 * Canonical CBS Wire Request Types (Verbs).
 * Official specification from CORE TECHNICAL DOCUMENTATION V1.0.1 (pp. 32-33).
 */
export const CbsRequestType = {
  // --- Core CRUD & Lifecycle Verbs ---
  /** Insert or Update ('PUT') */
  PUT: "PUT",
  /** Get single record ('GET') */
  GET: "GET",
  /** Delete an unauthorized record only to move into delete table ('DEL') */
  DEL: "DEL",
  /** Authorize a record ('AUT') */
  AUT: "AUT",
  /** Reverse a record ('REV') */
  REV: "REV",
  /** Reverse from history ('TRV') */
  TRV: "TRV",

  // --- Record Query & Listing Verbs ---
  /** Get list of records ('GRL') */
  GRL: "GRL",
  /** Get record Id list (all) ('RIL') */
  RIL: "RIL",
  /** Get new record Id ('GNI') */
  GNI: "GNI",
  /** Get record by view ('GRV') */
  GRV: "GRV",
  /** Get by Custom Query (max 2000) ('GCQ') */
  GCQ: "GCQ",
  /** Get generated report list ('GGL') */
  GGL: "GGL",

  // --- Model & Form Config Verbs ---
  /** Get model definition ('GMC') */
  GMC: "GMC",
  /** Save model definition ('SMC') */
  SMC: "SMC",
  /** Auth model config ('AMC') */
  AMC: "AMC",
  /** Save form config ('SFC') */
  SFC: "SFC",
  /** Get form control that is form (version) and model definition ('GFC') */
  GFC: "GFC",

  // --- Menu & Tree Relation Verbs ---
  /** Get User Menu ('GUM') */
  GUM: "GUM",
  /** Get child menu ('GCM') */
  GCM: "GCM",
  /** Save menu relation ('SMR') */
  SMR: "SMR",
  /** Delete tree relation ('DTR') */
  DTR: "DTR",

  // --- Financial Transaction Verbs ---
  /** Account Transfer Transaction ('ATT') */
  ATT: "ATT",
  /** Cash Transfer Transaction ('CTT') */
  CTT: "CTT",

  // --- Security & Session Verbs ---
  /** User login ('ULI') */
  ULI: "ULI",
  /** User log out ('ULO') */
  ULO: "ULO",
  /** Authorize a user ('UAU') */
  UAU: "UAU",
  /** Change password ('CPW') */
  CPW: "CPW",

  // --- Convenience / Semantic Aliases ---
  /** Alias for GRL */
  RECORD_LIST: "GRL",
  /** Alias for GET */
  RECORD_GET: "GET",
  /** Alias for PUT */
  RECORD_PUT: "PUT",
  /** Alias for AUT */
  RECORD_AUTH: "AUT",
  /** Alias for DEL */
  RECORD_DEL: "DEL",
  /** Alias for REV */
  RECORD_REVERSE: "REV",
  /** Hold draft status / queue ('HLD') */
  RECORD_HOLD: "HLD",
  /** Inquiry execution ('INQ') */
  INQUIRY_EXEC: "INQ",
  /** Alias for GUM */
  MENU_TREE: "GUM",
  /** Alias for UAU */
  USER_AUTH: "UAU",
  /** Alias for ATT */
  ACCOUNT_FUNDS_TRANSFER: "ATT",
  /** Alias for CTT */
  ACCOUNT_CASH_TRANSFER: "CTT",
  /** Alias for CPW */
  CHANGE_PASSWORD: "CPW",
  /** Change Sign-On / User Name ('CUN') */
  CHANGE_USER_NAME: "CUN",
} as const;

export type CbsRequestType = (typeof CbsRequestType)[keyof typeof CbsRequestType];
