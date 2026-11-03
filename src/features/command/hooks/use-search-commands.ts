"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { extractMenuCommands, getAllRegisteredCommands } from "@/lib/cbs-command";
import type { MenuItem, SystemCommandItem } from "@/lib/data-schemas";

interface UseSearchCommandsOptions {
  open: boolean;
  userHasCommandLine: boolean;
}

export function useSearchCommands({ open, userHasCommandLine }: UseSearchCommandsOptions) {
  // 1. Re-use the exact same menu-raw query cache used by sidebar navigation
  const { data: menuCmds = [] } = useQuery<SystemCommandItem[]>({
    queryKey: ["app", "sidebar", "menu-raw"],
    enabled: open,
    queryFn: async () => {
      try {
        const res = await cbs.send<{ menuTree?: MenuItem[] } | MenuItem[]>(cbs.menuTree.get(), {
          silent: true,
        });
        if (res.status === "SUCCESS" && res.data) {
          const rawNodes = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.menuTree)
              ? res.data.menuTree
              : [];
          return extractMenuCommands(rawNodes);
        }
      } catch {
        // Fallback
      }
      return [];
    },
  });

  // Merge static registry commands + dynamic API menu commands (deduplicated by command string)
  const allCommands = React.useMemo(() => {
    const staticCmds = getAllRegisteredCommands();
    const map = new Map<string, SystemCommandItem>();
    for (const cmd of menuCmds) {
      if (!map.has(cmd.command.toUpperCase())) {
        map.set(cmd.command.toUpperCase(), cmd);
      }
    }
    for (const cmd of staticCmds) {
      // If user lacks commandLine permission, hide quick action terminal commands
      if (!userHasCommandLine && (cmd.actionType === "THEME" || cmd.actionType === "LOGOUT")) {
        continue;
      }
      map.set(cmd.command.toUpperCase(), cmd);
    }
    return Array.from(map.values());
  }, [menuCmds, userHasCommandLine]);

  return {
    allCommands,
    authorizedCommands: allCommands,
  };
}
