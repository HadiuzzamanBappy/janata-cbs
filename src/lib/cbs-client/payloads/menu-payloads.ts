import { CbsControlTable } from "../contracts/control-tables";
import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

/**
 * Domain payload builders for Menu Catalog and Visual Menu Designer
 */
export const menuPayloads = {
  /** Fetch all flat menu items list */
  getCatalogList: (): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),

  /** Fetch individual menu catalog record */
  getMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: menuId,
  }),

  /** Save flat menu catalog record */
  saveMenuItem: (menuId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: menuId,
    data,
  }),

  /** Authorize flat menu catalog record */
  authorizeMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: menuId,
  }),

  /** Fetch list of all menu tree configs */
  getTreeList: (): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),

  /** Fetch full hierarchical menu tree */
  getMenuTree: (treeId = "MAIN_MENU"): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: treeId,
  }),

  /** Save hierarchical menu tree */
  saveMenuTree: (treeId: string, treeNodes: unknown): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: treeId,
    data: { tree: treeNodes },
  }),

  /** Authorize hierarchical menu tree */
  authorizeMenuTree: (treeId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: treeId,
  }),
};
