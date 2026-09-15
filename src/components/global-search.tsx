"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  UserCheck,
  UserPlus,
  Users,
  Building2,
  FileText,
  Search,
  Settings,
  Sliders,
  Database,
  Lock,
  LogOut,
  Sun,
  SendHorizontal,
  BadgeAlert,
} from "lucide-react";
import { useSessionStore } from "@/store/session-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { useAlertStore } from "@/store/alert-store";
import { launchScreen } from "@/lib/screen-launcher";
import { Badge } from "@/components/ui/badge";

// Helper map for resolving database icon string keys (e.g., "UserCheck" -> <UserCheck />)
export const DYNAMIC_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCheck,
  UserPlus,
  Users,
  Building2,
  FileText,
  Search,
  Settings,
  Sliders,
  Database,
  Lock,
  LogOut,
  Sun,
  SendHorizontal,
  BadgeAlert,
};

export interface SystemCommandItem {
  id: string;
  title: string;
  category: string;
  description: string;
  command?: string;
  componentName?: string;
  allowedRoles: string[]; // "*" = all roles, "Administrator" = admin only
  icon: React.ComponentType<{ className?: string }>;
  actionType: "SCREEN" | "THEME" | "BRANCH" | "LOGOUT";
  actionPayload?: string;
}

// Master Command Registry (Dynamic Database Schema structure)
export const MASTER_COMMAND_REGISTRY: SystemCommandItem[] = [
  // Operational & Navigation Screens (All Authorized Users)
  {
    id: "user.request",
    title: "User Request List",
    category: "Navigation & Operations",
    description: "Manage and inspect user requests",
    command: "user.request",
    componentName: "USER_REQUEST",
    allowedRoles: ["*"],
    icon: UserCheck,
    actionType: "SCREEN",
  },
  {
    id: "user.request.create",
    title: "Create User Request",
    category: "Navigation & Operations",
    description: "Initiate new user access request ticket",
    command: "user.request.create",
    componentName: "USER_REQUEST_CREATE",
    allowedRoles: ["*"],
    icon: UserPlus,
    actionType: "SCREEN",
  },
  {
    id: "user.request.unauth",
    title: "Unauthorized User Requests",
    category: "Navigation & Operations",
    description: "View pending approval requests",
    command: "user.request.unauth",
    componentName: "USER_REQUEST_UNAUTH",
    allowedRoles: ["*"],
    icon: BadgeAlert,
    actionType: "SCREEN",
  },
  {
    id: "customer.create",
    title: "Create Customer Account (CIF)",
    category: "Navigation & Operations",
    description: "Register new customer master profile",
    command: "customer.create",
    componentName: "CUSTOMER_CREATE",
    allowedRoles: ["*"],
    icon: Users,
    actionType: "SCREEN",
  },
  {
    id: "account.create",
    title: "Create Deposit Account",
    category: "Navigation & Operations",
    description: "Open savings, current, or fixed deposit account",
    command: "account.create",
    componentName: "ACCOUNT_CREATE",
    allowedRoles: ["*"],
    icon: Building2,
    actionType: "SCREEN",
  },
  {
    id: "funds.transfer",
    title: "Inter-Branch Funds Transfer",
    category: "Navigation & Operations",
    description: "Process real-time settlement transfers",
    command: "funds.transfer",
    componentName: "FUNDS_TRANSFER",
    allowedRoles: ["*"],
    icon: SendHorizontal,
    actionType: "SCREEN",
  },

  // Inquiries & Reports (All Authorized Users)
  {
    id: "gir",
    title: "General Inquiry (GIR)",
    category: "Inquiries & Reports",
    description: "General Information & Transaction Ledger",
    command: "gir",
    componentName: "GIR",
    allowedRoles: ["*"],
    icon: Search,
    actionType: "SCREEN",
  },
  {
    id: "sir",
    title: "Specific Inquiry (SIR)",
    category: "Inquiries & Reports",
    description: "Detailed Specific Inquiry Reports",
    command: "sir",
    componentName: "SIR",
    allowedRoles: ["*"],
    icon: FileText,
    actionType: "SCREEN",
  },
  {
    id: "today.txn.report",
    title: "Today's Transaction Report",
    category: "Inquiries & Reports",
    description: "Audit daily branch transaction journal",
    command: "today.txn.report",
    componentName: "TODAY_TXN_REPORT",
    allowedRoles: ["*"],
    icon: FileText,
    actionType: "SCREEN",
  },

  // System Administration (Admin / Superuser Only)
  {
    id: "model.config",
    title: "Model Configuration",
    category: "System Administration",
    description: "Configure core banking entity models",
    command: "model.config",
    componentName: "MODEL_CONFIG",
    allowedRoles: ["Administrator"],
    icon: Settings,
    actionType: "SCREEN",
  },
  {
    id: "form.builder",
    title: "Dynamic Form Builder Engine",
    category: "System Administration",
    description: "Build dynamic CBS form definitions",
    command: "form.builder",
    componentName: "FORM_BUILDER",
    allowedRoles: ["Administrator"],
    icon: Sliders,
    actionType: "SCREEN",
  },
  {
    id: "cob.registry",
    title: "Close of Business (COB) Registry",
    category: "System Administration",
    description: "Manage end-of-day batch processing registry",
    command: "cob.registry",
    componentName: "COB_REGISTRY",
    allowedRoles: ["Administrator"],
    icon: Database,
    actionType: "SCREEN",
  },
  {
    id: "user.groups",
    title: "User Role & Permission Matrix",
    category: "System Administration",
    description: "Manage RBAC user group policies",
    command: "user.groups",
    componentName: "USER_GROUPS",
    allowedRoles: ["Administrator"],
    icon: Lock,
    actionType: "SCREEN",
  },

  // System Quick Actions
  {
    id: "action.toggle.theme",
    title: "Toggle Light / Dark Theme",
    category: "Quick Actions",
    description: "Switch application theme mode",
    allowedRoles: ["*"],
    icon: Sun,
    actionType: "THEME",
  },
  {
    id: "action.signout",
    title: "Sign Out Session",
    category: "Quick Actions",
    description: "Terminate current active user session",
    allowedRoles: ["*"],
    icon: LogOut,
    actionType: "LOGOUT",
  },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchProps) {
  const { user, clearSession } = useSessionStore();
  const { addTab } = useWorkbenchStore();
  const { showAlert } = useAlertStore();

  const userRole = user?.role ?? "Administrator";
  const isAdmin = userRole === "Administrator" || userRole === "ADMIN";

  // Filter commands based on User RBAC Role Permissions
  const authorizedCommands = React.useMemo(() => {
    return MASTER_COMMAND_REGISTRY.filter((cmd) => {
      if (cmd.allowedRoles.includes("*")) return true;
      if (isAdmin && cmd.allowedRoles.includes("Administrator")) return true;
      return cmd.allowedRoles.includes(userRole);
    });
  }, [userRole, isAdmin]);

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

    if (cmd.actionType === "SCREEN") {
      launchScreen({
        id: cmd.command ?? cmd.id,
        title: cmd.title,
        componentName: cmd.componentName,
        addTab,
      });
    } else if (cmd.actionType === "LOGOUT") {
      clearSession();
      showAlert({
        type: "info",
        title: "Session Terminated",
        message: "You have signed out of Janata Bank Core Banking System.",
      });
    } else if (cmd.actionType === "THEME") {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
      showAlert({
        type: "info",
        title: "Theme Toggled",
        message: `Switched theme to ${isDark ? "Light" : "Dark"} mode.`,
      });
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-2xl sm:max-w-3xl">
      <CommandInput placeholder="Type command name, screen ID, or search..." className="text-base py-3" />
      <CommandList className="max-h-[440px]">
        <CommandEmpty className="py-10 text-base">No results matching your permission level.</CommandEmpty>

        {/* RBAC Permission Banner Header */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-border/40 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-medium">Role RBAC Filter:</span>
            <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
              {userRole}
            </Badge>
          </div>
          <span className="font-mono text-xs opacity-80">
            {authorizedCommands.length} commands authorized
          </span>
        </div>

        {categories.map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((cmd) => {
              const IconComp = cmd.icon;
              return (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleSelectCommand(cmd)}
                  className="group flex items-center justify-between py-2.5 px-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <IconComp className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate group-data-[selected=true]:text-accent-foreground">
                        {cmd.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {cmd.description}
                      </span>
                    </div>
                  </div>
                  {cmd.command && (
                    <CommandShortcut className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded border border-border/40">
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
      <div className="px-4 py-3 flex items-center justify-between border-t border-border/50 text-xs text-muted-foreground bg-muted/30 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-xs">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-xs">↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-background border rounded font-mono text-xs">↵</kbd>
            <span>Select</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-background border rounded font-mono text-xs">ESC</kbd>
          <span>Close</span>
        </span>
      </div>
    </CommandDialog>
  );
}
