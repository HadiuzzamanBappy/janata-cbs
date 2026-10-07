import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Menu Catalog and Visual Menu Designer
 */
export const menuPayloads = {
  /** Fetch all flat menu items list */
  getCatalogList: (): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),

  /** Fetch individual menu catalog record */
  getMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: menuId.trim().toUpperCase(),
  }),

  /** Save flat menu catalog record */
  saveMenuItem: (menuId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: menuId.trim().toUpperCase(),
    data,
  }),

  /** Authorize flat menu catalog record */
  authorizeMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: menuId.trim().toUpperCase(),
  }),

  /** Delete flat menu catalog record */
  deleteMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: menuId.trim().toUpperCase(),
  }),

  /** Fetch list of all menu tree configs */
  getTreeList: (): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),

  /** Fetch full hierarchical menu tree */
  getMenuTree: (treeId = "MAIN_MENU"): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: treeId.trim().toUpperCase(),
  }),

  /** Save hierarchical menu tree */
  saveMenuTree: (treeId: string, treeNodes: unknown): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: treeId.trim().toUpperCase(),
    data: { tree: treeNodes },
  }),

  /** Authorize hierarchical menu tree */
  authorizeMenuTree: (treeId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: treeId.trim().toUpperCase(),
  }),

  /** Delete hierarchical menu tree */
  deleteMenuTree: (treeId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: treeId.trim().toUpperCase(),
  }),
};
