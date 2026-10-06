/**
 * Canonical Application & Target Control Table Identifiers
 */
export const CbsControlTable = {
  MENU: "MENU",
  MENU_TREE: "MENU.TREE",
  USER_GROUP: "USER.GROUP",
  USER_PASS_RESET: "USER.PASS.RESET",
  COB_REGISTRY: "COB.REGISTRY",
  MODEL_CONFIG: "MODEL.CONFIG",
  INQUIRY: "INQUIRY",
  ACCOUNT: "ACCOUNT",
  CUSTOMER: "CUSTOMER",
  FUNDS_TRANSFER: "FUNDS.TRANSFER",
  CASH_TRANSFER: "CASH.TRANSFER",
} as const;

export type CbsControlTable = (typeof CbsControlTable)[keyof typeof CbsControlTable];
