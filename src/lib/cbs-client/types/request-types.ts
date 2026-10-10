/**
 * Canonical CBS Wire Request Types (Verbs).
 *
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

  // --- Convenience / Backward Compatibility Aliases ---
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
