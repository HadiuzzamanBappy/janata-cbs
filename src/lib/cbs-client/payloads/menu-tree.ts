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
   * Get User Menu Navigation Tree via dedicated CBS `GUM` requestType (if no recordId given)
   * or standard `GET` requestType for specific menu tree records in Menu Designer.
   */
  get: (recordId?: string | ModelOptions, options?: ModelOptions): CbsWirePayload => {
    const id = typeof recordId === "string" ? recordId.trim() : "";
    const opts = typeof recordId === "object" ? recordId : options;

    if (id) {
      return baseMenuTree.get(id, opts);
    }

    return {
      servicePath: opts?.servicePath?.trim() || undefined,
      requestType: CbsRequestType.GUM,
      controlName: CbsControlTable.MENU_TREE,
      recordFunction: CbsRecordFunction.SEE,
      recordId: "",
    };
  },
};
