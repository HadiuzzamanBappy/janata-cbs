import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import { createModelPayloads, type ModelOptions } from "./base-model";

/* -------------------------------------------------------------------------- */
/* Menu Tree Payload Builder (Specialized Wire Protocol: GUM)                */
/* -------------------------------------------------------------------------- */

const baseMenuTree = createModelPayloads(CbsControlTable.MENU_TREE);

/**
 * Specialized payload factory for Hierarchical Navigation Trees (`MENU.TREE`).
 * Enforces canonical CBS wire protocol requestType `GUM` (Get User Menu)
 * without sending an artificial recordId (core automatically delivers `MENU.ONE`).
 */
export const menuTreePayloads = {
  ...baseMenuTree,

  /**
   * Get User Menu Navigation Tree via dedicated CBS `GUM` requestType.
   * Does NOT provide recordId; core responds with the user's active menu hierarchy (`MENU.ONE`).
   */
  get: (options?: ModelOptions): CbsWirePayload => ({
    servicePath: options?.servicePath?.trim() || undefined,
    requestType: CbsRequestType.GUM,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  }),
};
