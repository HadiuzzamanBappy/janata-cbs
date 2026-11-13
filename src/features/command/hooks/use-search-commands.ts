"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { cbsQueries } from "@/lib/cbs-client";
import { cbsCommand, extractMenuCommands, getMasterCommands } from "@/lib/cbs-command";
import type { ControlCommand } from "@/lib/data-schemas";

interface UseSearchCommandsOptions {
  open: boolean;
}

export function useSearchCommands({ open }: UseSearchCommandsOptions) {
  // 1. Share the exact same sidebarMenu cache entry pre-warmed by AppSidebar
  const { data: rawNodes = [] } = useQuery({
    ...cbsQueries.menuTree.active(),
    enabled: open,
  });

  // 2. Query dynamic control catalog records (SC_CONTROL)
  const { data: controlCmds = [] } = useQuery({
    ...cbsQueries.control.list(),
    enabled: open,
  });

  // Dynamically register aliases for any control records fetched from core
  React.useEffect(() => {
    if (controlCmds.length > 0) {
      cbsCommand.registerAliases(controlCmds);
    }
  }, [controlCmds]);

  const menuCmds = React.useMemo(() => {
    return extractMenuCommands(rawNodes);
  }, [rawNodes]);

  // Merge static registry commands + dynamic menu commands + core control commands
  const allCommands = React.useMemo(() => {
    const staticCmds = getMasterCommands();
    const map = new Map<string, ControlCommand>();

    // 1. Core control table commands (e.g. ACCOUNT, BRANCH, CONTROL, CUSTOMER, USER)
    for (const cmd of controlCmds) {
      map.set(cmd.command.toUpperCase(), cmd);
    }

    // 2. Navigation menu items
    for (const cmd of menuCmds) {
      if (!map.has(cmd.command.toUpperCase())) {
        map.set(cmd.command.toUpperCase(), cmd);
      }
    }

    // 3. Static master commands & settings
    for (const cmd of staticCmds) {
      map.set(cmd.command.toUpperCase(), cmd);
    }

    return Array.from(map.values());
  }, [menuCmds, controlCmds]);

  return {
    allCommands,
    authorizedCommands: allCommands,
  };
}
