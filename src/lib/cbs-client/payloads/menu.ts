import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Menu Catalog and Visual Menu Designer.
 */
export const menuPayloads = {
  /**
   * Fetch all flat menu items list from MENU table.
   */
  getCatalogList: (): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),

  /**
   * Fetch an individual menu catalog record.
   *
   * @param menuId - Menu catalog record ID
   */
  getMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: menuId.trim().toUpperCase(),
  }),

  /**
   * Save a flat menu catalog record.
   *
   * @param menuId - Menu catalog record ID
   * @param data - Menu item fields (command, label, category, etc.)
   */
  saveMenuItem: (menuId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: menuId.trim().toUpperCase(),
    data,
  }),

  /**
   * Authorize a flat menu catalog record (Maker-Checker approval step).
   *
   * @param menuId - Menu catalog record ID to authorize
   */
  authorizeMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: menuId.trim().toUpperCase(),
  }),

  /**
   * Delete a flat menu catalog record.
   *
   * @param menuId - Menu catalog record ID to delete
   */
  deleteMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: menuId.trim().toUpperCase(),
  }),

  /**
   * Fetch list of all menu tree configs from MENU.TREE table.
   */
  getTreeList: (): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),

  /**
   * Fetch full hierarchical menu tree.
   *
   * @param treeId - Tree identifier (defaults to "MAIN_MENU")
   */
  getMenuTree: (treeId = "MAIN_MENU"): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: treeId.trim().toUpperCase(),
  }),

  /**
   * Save hierarchical menu tree.
   *
   * @param treeId - Tree identifier
   * @param treeNodes - Hierarchical node structure
   */
  saveMenuTree: (treeId: string, treeNodes: unknown): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: treeId.trim().toUpperCase(),
    data: { tree: treeNodes },
  }),

  /**
   * Authorize hierarchical menu tree (Maker-Checker approval step).
   *
   * @param treeId - Tree identifier to authorize
   */
  authorizeMenuTree: (treeId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: treeId.trim().toUpperCase(),
  }),

  /**
   * Delete hierarchical menu tree.
   *
   * @param treeId - Tree identifier to delete
   */
  deleteMenuTree: (treeId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: treeId.trim().toUpperCase(),
  }),
};
