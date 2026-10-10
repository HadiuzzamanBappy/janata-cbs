"use client";

import * as React from "react";
import { extractMenuCommands, getAllRegisteredCommands } from "@/lib/cbs-command";
import { appConfig } from "@/lib/core-config";
import type { SystemCommandItem } from "@/lib/data-schemas";

interface UseSearchCommandsOptions {
  open: boolean;
  userHasCommandLine: boolean;
}

export function useSearchCommands({ open, userHasCommandLine }: UseSearchCommandsOptions) {
  const [apiMenuItems, setApiMenuItems] = React.useState<SystemCommandItem[]>([]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const fetches: Promise<{ success: boolean; data?: unknown }>[] = [
      fetch(appConfig.routes.api.menu)
        .then((res) => res.json())
        .catch(() => ({ success: false })),
    ];

    // Only fetch and expose system control commands if user has commandLine permission
    if (userHasCommandLine) {
      fetches.push(
        fetch(appConfig.routes.api.controls)
          .then((res) => res.json())
          .catch(() => ({ success: false })),
      );
    }

    Promise.all(fetches).then(([menuJson, controlsJson]) => {
      const menuCmds =
        menuJson?.success && Array.isArray(menuJson.data) ? extractMenuCommands(menuJson.data) : [];
      const controlCmds =
        controlsJson?.success && Array.isArray(controlsJson.data) ? controlsJson.data : [];

      setApiMenuItems([...menuCmds, ...controlCmds]);
    });
  }, [open, userHasCommandLine]);

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
      if (!userHasCommandLine && cmd.category === "Quick Actions") {
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
