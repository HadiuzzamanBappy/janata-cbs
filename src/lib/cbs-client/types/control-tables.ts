/**
 * Canonical Application & Target Control Table Identifiers.
 *
 * Defines the active control table identifiers recognized by the CBS client.
 */
export const CbsControlTable = {
  MENU: "SC.MENU",
  MENU_TREE: "SC.MENU.TREE",
  USER_GROUP: "SC.USER.GROUP",
  USER_PASS_RESET: "SC.USER.PASS.RESET",
  MODEL_CONFIG: "SC.MODEL.CONFIG",
  INQUIRY: "INQUIRY",
} as const;

export type CbsControlTable = (typeof CbsControlTable)[keyof typeof CbsControlTable];
