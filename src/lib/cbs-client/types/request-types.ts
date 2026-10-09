/**
 * Canonical CBS Wire Request Types (Verbs).
 *
 * Matches T24 CBS wire specification & FinX gRPC dispatch table.
 */
export const CbsRequestType = {
  // Standard CRUD & Lifecycle Operations
  /** Get Record List ('GRL') */
  RECORD_LIST: "GRL",
  /** Single Record Fetch ('GET') */
  RECORD_GET: "GET",
  /** Create / Update Record ('PUT') */
  RECORD_PUT: "PUT",
  /** Authorize (Maker-Checker approval) ('AUT') */
  RECORD_AUTH: "AUT",
  /** Delete / Reverse ('DEL') */
  RECORD_DEL: "DEL",
  /** Place Record on Hold ('HLD') */
  RECORD_HOLD: "HLD",
  /** Reversal Request ('REV') */
  RECORD_REVERSE: "REV",

  // Specialized CBS Query & Engine Verbs
  /** Grid Inquiry Execution ('INQ') */
  INQUIRY_EXEC: "INQ",
  /** Hierarchical Navigation Tree Fetch ('GUM') */
  MENU_TREE: "GUM",
  /** User Security Authorization ('UAU') */
  USER_AUTH: "UAU",
  /** Funds Transfer Transaction ('AFT') */
  ACCOUNT_FUNDS_TRANSFER: "AFT",
  /** Cash Transfer Transaction ('ACT') */
  ACCOUNT_CASH_TRANSFER: "ACT",

  // Staff Account & Security Self-Service Verbs
  /** Change Sign-On / User Name ('CUN') */
  CHANGE_USER_NAME: "CUN",
  /** Change User Password ('CPW') */
  CHANGE_PASSWORD: "CPW",
} as const;

export type CbsRequestType = (typeof CbsRequestType)[keyof typeof CbsRequestType];
