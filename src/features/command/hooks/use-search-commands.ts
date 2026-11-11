"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import { extractMenuCommands, getMasterCommands } from "@/lib/cbs-command";
import type { ControlCommand } from "@/lib/data-schemas";

interface UseSearchCommandsOptions {
  open: boolean;
}

export function useSearchCommands({ open }: UseSearchCommandsOptions) {
  // Share the exact same sidebarMenu cache entry pre-warmed by AppSidebar
  const { data: rawNodes = [] } = useQuery({
    ...cbsQueries.menuTree.active(),
    enabled: open,
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
