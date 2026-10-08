"use client";

import { useCbsPersistence } from "@/lib/cbs-screen";
import type { MenuTreeRecord } from "@/lib/schemas/menu-designer-schema";
import { menuTreeRecordSchema } from "@/lib/schemas/menu-designer-schema";

export const INITIAL_MENU_TREE: MenuTreeRecord = {
  recordId: "",
  treeDescription: "",
  isActive: true,
  menuTree: [],
};

export function useMenuDesignerPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<MenuTreeRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MENU_TREE,
    schema: menuTreeRecordSchema,
  });
}
