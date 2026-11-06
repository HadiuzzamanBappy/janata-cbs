import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { logger } from "@/lib/core-logger";
import { parseMNU } from "@/lib/data-parsers";
import type { MenuItem } from "@/lib/data-schemas";
import { mapMenuItemToTreeNode } from "../utils";

export function useSidebarMenu() {
  const { data: menuItems = [], isLoading: loading } = useQuery<MenuItem[]>({
    queryKey: ["app", "sidebar", "menu-tree"],
    queryFn: async () => {
      try {
        const res = await cbs.send<unknown>(cbs.menuTree.get(), {
          silent: true,
        });
        if (res.status === "SUCCESS" && res.data) {
          const parsed = parseMNU(res.data);
          if (parsed.success && parsed.data.length > 0) {
            return parsed.data;
          }
        }
      } catch (err) {
        logger.error("Failed to load sidebar menu from proxy", err, "SIDEBAR");
      }
      return [];
    },
  });

  const treeNodes = React.useMemo(() => {
    return menuItems.map(mapMenuItemToTreeNode);
  }, [menuItems]);

  return {
    treeNodes,
    loading,
  };
}
