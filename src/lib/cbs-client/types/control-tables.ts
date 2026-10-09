/**
 * Canonical Application & Target Control Table Identifiers.
 *
 * Defines the active control table identifiers recognized by the CBS client.
 */
export const CbsControlTable = {
  MENU: "MENU",
  MENU_TREE: "MENU.TREE",
  USER_GROUP: "USER.GROUP",
  USER_PASS_RESET: "USER.PASS.RESET",
  MODEL_CONFIG: "MODEL.CONFIG",
  INQUIRY: "INQUIRY",
} as const;

export type CbsControlTable = (typeof CbsControlTable)[keyof typeof CbsControlTable];
