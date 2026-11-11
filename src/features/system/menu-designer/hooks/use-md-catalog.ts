"use client";

import { useQuery } from "@tanstack/react-query";
import { cbs } from "@/lib/cbs-client";
import { parseMenuTreeList, unwrapRecordsPayload } from "@/lib/data-parsers";
import type {
  MenuAction,
  MenuCatalogActionItem,
  MenuType,
} from "@/lib/data-schemas/menu-designer-schema";

export function useMdCatalog() {
  const { data: catalogItems = [], isLoading: catalogLoading } = useQuery<MenuCatalogActionItem[]>({
    queryKey: ["cbs", "menu-designer", "catalog"],
    queryFn: async () => {
      // Fetch registered menu items strictly from the MENU database table
      const json = await cbs.send<unknown>(cbs.menu.list(), { silent: true });
      if (json.status === "SUCCESS" && json.data) {
        const rawList = unwrapRecordsPayload(json.data);
        return (rawList as Record<string, unknown>[])
          .filter((r) => Boolean(r.recordId || r.id))
          .map((r) => ({
            id: String(r.recordId || r.id),
            label: String(r.label || r.recordId || r.id),
            command: String(r.command || ""),
            menuType: (r.menuType ? String(r.menuType) : "FORM") as MenuType,
            menuAction: (r.menuAction ? String(r.menuAction) : "SCREEN") as MenuAction,
          }));
      }
      return [];
    },
  });

  const { data: availableTrees = [], refetch: refetchTrees } = useQuery<
    Array<{ id: string; label: string; details: string }>
  >({
    queryKey: ["cbs", "menu-designer", "available-trees"],
    queryFn: async () => {
      // Fetch navigation trees strictly from the MENU.TREE database table
      const json = await cbs.send<unknown>(cbs.menuTree.list(), { silent: true });
      if (json.status === "SUCCESS" && json.data) {
        const res = parseMenuTreeList(json.data);
        if (res.success) {
          return res.data
            .filter((t): t is typeof t & { recordId: string } => Boolean(t.recordId))
            .map((t) => ({
              id: t.recordId,
              label: t.treeDescription || t.recordId,
              details: `${t.menuTree.length} items • ${t.isActive ? "Active" : "Inactive"}`,
            }));
        }
      }
      return [];
    },
  });

  return {
    catalogItems,
    catalogLoading,
    availableTrees,
    refetchTrees,
  };
}
