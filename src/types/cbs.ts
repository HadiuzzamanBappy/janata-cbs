/**
 * Canonical Core Banking Domain Types
 * Single source of truth across UI, Command Gateway, State Stores, and Screen Modules.
 * Official specification from CORE TECHNICAL DOCUMENTATION V1.0.1.
 */

/* -------------------------------------------------------------------------- */
/* 1. Wire Protocol: Request Types & Target Control Tables                    */
/* -------------------------------------------------------------------------- */

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
  /** Search by recordId / wildcard ('SBI') */
  SBI: "SBI",
  /** Get from materialize view ('GMV') */
  GMV: "GMV",
  /** Refresh materialize view ('RMV') */
  RMV: "RMV",

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
  /** Automated Fund Transfer ('AFT') */
  AFT: "AFT",

  // --- Security & Session Verbs ---
  /** User login ('ULI') */
  ULI: "ULI",
  /** User log out ('ULO') */
  ULO: "ULO",
  /** Authorize a user ('UAU') */
  UAU: "UAU",
  /** Change password ('CPW') */
  CPW: "CPW",
  /** Get Password reset record ('GRR') */
  GRR: "GRR",
  /** Change Sign-On / User Name ('CUN') */
  CUN: "CUN",

  // --- Runtime Query & Hold Verbs ---
  /** Hold draft status / queue ('HLD') */
  HLD: "HLD",
  /** Inquiry execution ('INQ') */
  INQ: "INQ",
} as const;

export type CbsRequestType = (typeof CbsRequestType)[keyof typeof CbsRequestType];

/**
 * Canonical Application & Target Control Table Identifiers.
 * Defines the active control table identifiers recognized by the CBS client.
 */
export const CbsControlTable = {
  BRANCH: "BRANCH",
  CONTROL: "CONTROL",
  MENU: "MENU",
  MENU_TREE: "SC.MENU.TREE",
  USER_GROUP: "SC.USER.GROUP",
  USER_PASS_RESET: "SC.USER.PASS.RESET",
  MODEL_CONFIG: "SC.MODEL.CONFIG",
  FORM_CONFIG: "CONFIG.FORM",
  INQUIRY_CONFIG: "CONFIG.INQUIRY",
  INQUIRY: "INQUIRY",
} as const;

export type CbsControlTable = (typeof CbsControlTable)[keyof typeof CbsControlTable];

/* -------------------------------------------------------------------------- */
/* 2. Record Access Modes & Maker-Checker Functions (Section 6.5)             */
/* -------------------------------------------------------------------------- */

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
  [CbsRecordFunction.HISTORY]: {
    code: CbsRecordFunction.HISTORY,
    name: "HISTORY",
    label: "History",
    description: "Inspect historical revisions ($HIS)",
    realWorldEffect: "Audits prior version snapshots and historical deltas",
  },
  [CbsRecordFunction.LIST]: {
    code: CbsRecordFunction.LIST,
    name: "LIST",
    label: "List / Directory",
    description: "Query and list multiple records",
    realWorldEffect: "Fetches table catalog or directory rows without row locking",
  },
} as const satisfies Record<CbsRecordFunction, CbsFunctionDefinition>;

/* -------------------------------------------------------------------------- */
/* 3. Record Lifecycle & Ledger Statuses                                      */
/* -------------------------------------------------------------------------- */

/**
 * Chronological record lifecycle statuses in Core Banking:
 *  - NEW: Uncommitted newly created draft
 *  - INA: Input Not Authorized (pending Maker-Checker approval in $NAU)
 *  - AU:  Authorized / Live ledger record
 *  - HLD: Held / Parked draft
 *  - REV: Reversed accounting transaction
 *  - DEL: Deleted draft
 */
export const CbsRecordStatus = {
  NEW: "NEW",
  INA: "INA",
  AU: "AU",
  HLD: "HLD",
  REV: "REV",
  DEL: "DEL",
} as const;

export type CbsRecordLifecycleStatus = (typeof CbsRecordStatus)[keyof typeof CbsRecordStatus];
export const CBS_RECORD_STATUSES = Object.values(CbsRecordStatus);

export interface CbsRecordStatusDefinition {
  readonly code: CbsRecordLifecycleStatus;
  readonly description: string;
  readonly label: string;
  readonly variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export const CBS_RECORD_STATUS_DEFINITIONS = {
  [CbsRecordStatus.NEW]: {
    code: CbsRecordStatus.NEW,
    description: "Newly initialized uncommitted record",
    label: "New Draft",
    variant: "outline",
  },
  [CbsRecordStatus.INA]: {
    code: CbsRecordStatus.INA,
    description: "Input Not Authorized (awaiting Checker approval in $NAU)",
    label: "Pending Approval",
    variant: "secondary",
  },
  [CbsRecordStatus.AU]: {
    code: CbsRecordStatus.AU,
    description: "Live authorized ledger record",
    label: "Authorized",
    variant: "success",
  },
  [CbsRecordStatus.HLD]: {
    code: CbsRecordStatus.HLD,
    description: "Parked / held draft pending completion",
    label: "Held",
    variant: "warning",
  },
  [CbsRecordStatus.REV]: {
    code: CbsRecordStatus.REV,
    description: "Reversed accounting transaction",
    label: "Reversed",
    variant: "destructive",
  },
  [CbsRecordStatus.DEL]: {
    code: CbsRecordStatus.DEL,
    description: "Deleted unauthorized draft",
    label: "Deleted",
    variant: "destructive",
  },
} as const satisfies Record<CbsRecordLifecycleStatus, CbsRecordStatusDefinition>;

/* -------------------------------------------------------------------------- */
/* 4. UI Screen & Workspace Presentation Modes                                */
/* -------------------------------------------------------------------------- */

/**
 * Resulting UI screen display mode:
 * "IDLE" or standard RIDASHL code ("S" | "I" | "D" | "A" | "R" | "H" | "L")
 */
export const CBS_SCREEN_MODES = ["IDLE", ...Object.values(CbsRecordFunction)] as const;
export type CbsScreenMode = "IDLE" | CbsRecordFunction;

/**
 * Workspace rendering display targets:
 *  - panel: Embedded inside workbench tabbed interface
 *  - window: Detached standalone browser popup window
 */
export const WORKSPACE_DISPLAY_MODES = ["panel", "window"] as const;
export type WorkspaceDisplayMode = (typeof WORKSPACE_DISPLAY_MODES)[number];
