"use client";

import { useCbsPersistence } from "@/lib/cbs-screen";
import type { MenuCatalogRecord } from "@/lib/data-schemas/menu-catalog-schema";
import { menuCatalogRecordSchema } from "@/lib/data-schemas/menu-catalog-schema";

export const INITIAL_MENU_ITEM: MenuCatalogRecord = {
  recordId: "",
  label: "",
  command: "",
  menuType: "SCREEN",
  description: "",
  isActive: undefined,
};

export function useMenuCatalogPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<MenuCatalogRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MENU_ITEM,
    schema: menuCatalogRecordSchema,
  });
}
