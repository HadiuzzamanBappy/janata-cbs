"use client";

import { useQuery } from "@tanstack/react-query";
import { cbs } from "@/lib/cbs-client";
import { cbsCommand } from "@/lib/cbs-command";
import { parseMenuTreeList } from "@/lib/data-parsers";
import type { MenuCatalogActionItem } from "@/lib/data-schemas/menu-designer-schema";

export const DEMO_AVAILABLE_TREES = [
  {
    id: "MAIN.MENU",
    label: "Core Enterprise Main Navigation",
    details: "Active Core Navigation",
  },
  { id: "ADMIN.NAV", label: "System Administration & Ops", details: "Superuser Tree" },
  { id: "TELLER.MENU", label: "Branch Frontline Teller Menu", details: "Cashier Operations" },
];

export function useMdCatalog() {
  const { data: catalogItems = [], isLoading: catalogLoading } = useQuery<MenuCatalogActionItem[]>({
    queryKey: ["cbs", "menu-designer", "catalog"],
    queryFn: async () => {
      // 1. Fetch official registered Menu Items from MENU table via BFF proxy (Temenos HELPTEXT.MENU)
      try {
        const json = await cbs.send<unknown>(cbs.menu.getCatalogList(), { silent: true });
        if (json.status === "SUCCESS" && json.data) {
          const rawList = Array.isArray(json.data)
            ? json.data
            : (json.data as { records?: unknown[] }).records || [];

          if (rawList.length > 0) {
            return (rawList as Record<string, unknown>[]).map((r) => ({
              id: String(r.recordId || r.id || ""),
              label: String(r.label || "Action"),
              command: String(r.command || ""),
              menuType: r.menuType ? String(r.menuType) : "SCREEN",
              description: r.description ? String(r.description) : undefined,
            }));
          }
        }
      } catch {
        // Fallback to static system definitions if table query fails
      }

      // 2. Fallback: derive catalog from registered system commands
      const itemsMap = new Map<string, MenuCatalogActionItem>();
      const staticCommands = cbsCommand.getCommands();
      for (const cmd of staticCommands) {
        if (cmd.actionType === "SCREEN") {
          itemsMap.set(cmd.command.toUpperCase(), {
            id: cmd.command,
            label: cmd.title,
            command: cmd.command,
            description: `System Screen: ${cmd.title}`,
          });
        }
      }

      return Array.from(itemsMap.values());
    },
  });

  const { data: availableTrees = DEMO_AVAILABLE_TREES, refetch: refetchTrees } = useQuery<
    Array<{ id: string; label: string; details: string }>
  >({
    queryKey: ["cbs", "menu-designer", "available-trees"],
    queryFn: async () => {
      try {
        const json = await cbs.send<unknown>(cbs.menu.getTreeList(), { silent: true });
        if (json.status === "SUCCESS" && json.data) {
          const res = parseMenuTreeList(json.data);
          if (res.success && res.data.length > 0) {
            return res.data.map((t) => ({
              id: t.recordId,
              label: t.treeDescription || t.recordId,
              details: `${t.menuTree.length} items • ${t.isActive ? "Active" : "Inactive"}`,
            }));
          }
        }
      } catch {
        // Fallback to static demo trees
      }
      return DEMO_AVAILABLE_TREES;
    },
  });

  return {
    catalogItems,
    catalogLoading,
    availableTrees,
    refetchTrees,
  };
}
