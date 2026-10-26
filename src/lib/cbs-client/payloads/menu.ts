import type { MenuTreeNode } from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./base-model";

/* -------------------------------------------------------------------------- */
/* Menu Catalog & Visual Tree Payload Builders                                */
/* -------------------------------------------------------------------------- */

const menuCatalog = createModelPayloads(CbsControlTable.MENU);
const menuTree = createModelPayloads(CbsControlTable.MENU_TREE);

/**
 * Domain payload builders for Menu Catalog and Visual Menu Designer.
 * Powered by universal BaseModel factory template.
 */
export const menuPayloads = {
  // --- Flat Menu Items (MENU) ---
  getCatalogList: () => menuCatalog.list(),
  getMenuItem: menuCatalog.get,
  saveMenuItem: (menuId: string, data: Record<string, unknown>) =>
    menuCatalog.save(data, { recordId: menuId }),
  authorizeMenuItem: menuCatalog.authorize,
  deleteMenuItem: menuCatalog.delete,

  // --- Hierarchical Menu Tree (MENU.TREE) ---
  getTreeList: () => menuTree.list(),
  getMenuTree: (treeId = "MAIN_MENU") => menuTree.get(treeId),
  saveMenuTree: (
    treeId: string,
    treeNodes: MenuTreeNode[] | readonly unknown[] | Record<string, unknown>,
  ) => menuTree.save({ tree: treeNodes }, { recordId: treeId }),
  authorizeMenuTree: menuTree.authorize,
  deleteMenuTree: menuTree.delete,
};
