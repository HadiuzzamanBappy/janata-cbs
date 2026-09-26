"use client";

import {
  Compass,
  Layers,
  Settings,
  ShieldCheck,
  Sliders,
  Terminal,
} from "lucide-react";
import * as React from "react";
import { useAlertStore } from "@/components/providers/alert-provider";
import { useSessionStore } from "@/components/providers/session-provider";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { MenuItem } from "@/features/workspace";
import { launchScreen } from "@/features/workspace";
import {
  getAllRegisteredCommands,
  type SystemCommandItem,
} from "@/lib/core/commands";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSettingsTab?: (tabId: string) => void;
}

function extractMenuCommands(items: MenuItem[]): SystemCommandItem[] {
  const result: SystemCommandItem[] = [];
  function traverse(list: MenuItem[]) {
    for (const item of list) {
      if (item.command) {
        result.push({
          id: item.id || item.command,
          title: item.label,
          category: "Navigation & Operations",
          description: `Execute ${item.label} [${item.command}]`,
          command: item.command,
          allowedRoles: ["*"],
          actionType: "SCREEN",
        });
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  }
  traverse(items);
  return result;
}

export function AppSearch({
  open,
  onOpenChange,
  openSettingsTab,
}: GlobalSearchProps) {
  const { user, logout } = useSessionStore();
  const { addTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();

  const [apiMenuItems, setApiMenuItems] = React.useState<SystemCommandItem[]>(
    [],
  );

  React.useEffect(() => {
    if (!open) return;

    Promise.all([
      fetch("/api/menu")
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch("/api/controls")
        .then((res) => res.json())
        .catch(() => ({ success: false })),
    ]).then(([menuJson, controlsJson]) => {
      const menuCmds =
        menuJson.success && Array.isArray(menuJson.data)
          ? extractMenuCommands(menuJson.data)
          : [];
      const controlCmds =
        controlsJson.success && Array.isArray(controlsJson.data)
          ? controlsJson.data
          : [];

      setApiMenuItems([...menuCmds, ...controlCmds]);
    });
  }, [open]);

  const userRole = user?.userRole ?? ["Administrator"];
  const isAdmin =
    userRole.includes("Administrator") || userRole.includes("ADMIN");

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
      map.set(cmd.command.toUpperCase(), cmd);
    }
    return Array.from(map.values());
  }, [apiMenuItems]);

  // Filter commands based on User RBAC Role Permissions
  const authorizedCommands = React.useMemo(() => {
    return allCommands.filter((cmd) => {
      if (cmd.allowedRoles.includes("*")) return true;
      if (isAdmin && cmd.allowedRoles.includes("Administrator")) return true;
      return cmd.allowedRoles.some((role: string) => userRole.includes(role));
    });
  }, [allCommands, isAdmin, userRole]);

  // Group authorized commands by category
  const categories = React.useMemo(() => {
    const map = new Map<string, SystemCommandItem[]>();
    for (const cmd of authorizedCommands) {
      const list = map.get(cmd.category) ?? [];
      list.push(cmd);
      map.set(cmd.category, list);
    }
    return Array.from(map.entries());
  }, [authorizedCommands]);

  const handleSelectCommand = (cmd: SystemCommandItem) => {
    onOpenChange(false);

    launchScreen({
      id: cmd.command ?? cmd.id,
      title: cmd.title,
      componentName: cmd.componentName,
      addTab,
      openSettingsTab,
      clearSession: logout,
      confirmAlert: confirm,
    });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-lg sm:max-w-xl"
    >
      <CommandInput placeholder="Type command name, screen ID, or search..." />
      <CommandList className="max-h-72">
        <CommandEmpty className="py-6 text-xs text-muted-foreground">
          No results matching your permission level.
        </CommandEmpty>

        {/* RBAC Permission Banner Header */}
        <div className="px-3 py-1 flex items-center justify-between border-b border-border/40 text-[11px] text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">RBAC Filter:</span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0"
            >
              {userRole}
            </Badge>
          </div>
          <span className="font-mono text-[10px] opacity-80">
            {authorizedCommands.length} commands authorized
          </span>
        </div>

        {categories.map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((cmd) => {
              // Resolve distinct icons per menu & action category
              let IconComp = cmd.icon;
              if (!IconComp) {
                if (cmd.category === "System Settings Modal") {
                  IconComp = Settings;
                } else if (cmd.category === "Security & Authentication") {
                  IconComp = ShieldCheck;
                } else if (cmd.category === "Quick Actions") {
                  IconComp = Terminal;
                } else if (
                  category.includes("System") ||
                  category.includes("Control")
                ) {
                  IconComp = Sliders;
                } else if (
                  category.includes("Navigation") ||
                  category.includes("Operation")
                ) {
                  IconComp = Compass;
                } else {
                  IconComp = Layers;
                }
              }

              return (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleSelectCommand(cmd)}
                  className="group flex items-center justify-between py-1.5 px-2.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-6.5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <IconComp className="size-3.5" />
                    </div>
                    <span className="font-medium text-xs truncate group-data-[selected=true]:text-accent-foreground">
                      {cmd.title}
                    </span>
                  </div>
                  {cmd.command && (
                    <CommandShortcut className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 shrink-0 ml-2">
                      {cmd.command}
                    </CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>

      {/* Keyboard Shortcut Footer Instructions */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-border/50 text-[11px] text-muted-foreground bg-muted/30 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">
              ↑
            </kbd>
            <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">
              ↓
            </kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">
              ↵
            </kbd>
            <span>Select</span>
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">
            ESC
          </kbd>
          <span>Close</span>
        </span>
      </div>
    </CommandDialog>
  );
}
