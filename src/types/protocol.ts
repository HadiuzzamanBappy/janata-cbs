/**
 * Canonical CBS Wire Protocol Verbs & Target Controls
 * Official specification from CORE TECHNICAL DOCUMENTATION V1.0.1 (pp. 32-33).
 */

/* -------------------------------------------------------------------------- */
/* 1. Wire Protocol Request Types (Verbs)                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* 2. Target Control Table Identifiers                                       */
/* -------------------------------------------------------------------------- */

export const CbsControlTable = {
  BRANCH: "BRANCH",
  CONTROL: "CONTROL",
  MENU: "MENU",
  MENU_TREE: "MENU.TREE",
  USER_GROUP: "USER.GROUP",
  MODEL_CONFIG: "MODEL.CONFIG",
  FORM_CONFIG: "FORM.CONFIG",
  INQUIRY_CONFIG: "INQUIRY.CONFIG",
} as const;

export type CbsControlTable = (typeof CbsControlTable)[keyof typeof CbsControlTable];
