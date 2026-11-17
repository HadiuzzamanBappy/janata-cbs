"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import { type MenuTreeRecord, menuTreeRecordSchema } from "@/lib/data-schemas";

export const INITIAL_MENU_TREE: MenuTreeRecord = {
  recordId: "",
  treeDescription: "",
  isActive: true,
  menuTree: [],
};

export function useMdPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<MenuTreeRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MENU_TREE,
    schema: menuTreeRecordSchema,
  });
}
