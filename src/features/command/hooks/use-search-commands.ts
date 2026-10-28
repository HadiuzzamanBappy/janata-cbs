"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { extractMenuCommands, getAllRegisteredCommands } from "@/lib/cbs-command";
import { appConfig } from "@/lib/core-config";
import type { SystemCommandItem } from "@/lib/data-schemas";

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
        const res = await fetch(appConfig.routes.api.menu);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return extractMenuCommands(json.data);
        }
      } catch {
        // Fallback
      }
      return [];
    },
  });

  // 2. Fetch controls commands only if user has commandLine permission
  const { data: controlCmds = [] } = useQuery<SystemCommandItem[]>({
    queryKey: ["app", "commands", "controls"],
    enabled: open && userHasCommandLine,
    queryFn: async () => {
      try {
        const res = await fetch(appConfig.routes.api.controls);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      } catch {
        // Fallback
      }
      return [];
    },
  });

  const apiMenuItems = React.useMemo(() => {
    return [...menuCmds, ...(userHasCommandLine ? controlCmds : [])];
  }, [menuCmds, controlCmds, userHasCommandLine]);

  // Merge static registry commands + dynamic API menu commands (deduplicated by command string)
  const allCommands = React.useMemo(() => {
    const staticCmds = getAllRegisteredCommands();
    const map = new Map<string, SystemCommandItem>();
    for (const cmd of apiMenuItems) {
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
  }, [apiMenuItems, userHasCommandLine]);

  return {
    allCommands,
    authorizedCommands: allCommands,
  };
}
