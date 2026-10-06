/**
 * Canonical CBS Wire Request Types (Verbs)
 * Matches T24 CBS wire specification & FinX gRPC dispatch table.
 */
export const CbsRequestType = {
  // Standard CRUD & Lifecycle Operations
  RECORD_LIST: "GRL", // Get Record List
  RECORD_GET: "GET", // Single Record Fetch
  RECORD_PUT: "PUT", // Create / Update Record
  RECORD_AUTH: "AUT", // Authorize (Maker-Checker)
  RECORD_DEL: "DEL", // Delete / Reverse
  RECORD_HOLD: "HLD", // Place Record on Hold
  RECORD_REVERSE: "REV", // Reversal Request

  // Specialized CBS Query & Engine Verbs
  INQUIRY_EXEC: "INQ", // Grid Inquiry Execution
  MENU_TREE: "GUM", // Hierarchical Navigation Tree Fetch
  USER_AUTH: "UAU", // User Security Authorization
  ACCOUNT_FUNDS_TRANSFER: "AFT", // Funds Transfer Transaction
  ACCOUNT_CASH_TRANSFER: "ACT", // Cash Transfer Transaction

  // Staff Account & Security Self-Service Verbs
  CHANGE_USER_NAME: "CUN", // Change Sign-On / User Name
  CHANGE_PASSWORD: "CPW", // Change User Password
} as const;

export type CbsRequestType = (typeof CbsRequestType)[keyof typeof CbsRequestType];
