"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbs } from "@/lib/cbs-client";
import { extractMenuCommands, getMasterCommands } from "@/lib/cbs-command";
import { logger } from "@/lib/core-logger";
import { parseMNU } from "@/lib/data-parsers";
import type { ControlCommand, MenuItem } from "@/lib/data-schemas";

interface UseSearchCommandsOptions {
  open: boolean;
}

export function useSearchCommands({ open }: UseSearchCommandsOptions) {
  // 1. Share the exact same ["app", "sidebar", "menu-tree"] cache pre-warmed by AppSidebar
  const { data: rawNodes = [] } = useQuery<MenuItem[]>({
    queryKey: ["app", "sidebar", "menu-tree"],
    enabled: open,
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
        logger.error("Failed to load command menu from proxy", err, "COMMAND");
      }
      return [];
    },
  });

  const menuCmds = React.useMemo(() => {
    return extractMenuCommands(rawNodes);
  }, [rawNodes]);

  // Merge static registry commands + dynamic API menu commands (deduplicated by command string)
  const allCommands = React.useMemo(() => {
    const staticCmds = getMasterCommands();
    const map = new Map<string, ControlCommand>();
    for (const cmd of menuCmds) {
      if (!map.has(cmd.command.toUpperCase())) {
        map.set(cmd.command.toUpperCase(), cmd);
      }
    }
    for (const cmd of staticCmds) {
      map.set(cmd.command.toUpperCase(), cmd);
    }
    return Array.from(map.values());
  }, [menuCmds]);

  return {
    allCommands,
    authorizedCommands: allCommands,
  };
}
