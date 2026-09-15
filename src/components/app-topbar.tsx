"use client";

import * as React from "react";
import {
  Building2,
  ChevronsUpDown,
  Command as CommandIcon,
  Check,
  LogOut,
  UserCheck,
  KeyRound,
  ShieldAlert,
  Search,
  User,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSessionStore } from "@/store/session-store";
import { useWorkbenchStore } from "@/store/workbench-store";
import { useAlertStore } from "@/store/alert-store";
import { launchScreen } from "@/lib/screen-launcher";
import { NAVIGATION_TREE, TreeNode } from "@/components/app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AUTHORIZED_BRANCHES = [
  { code: "JB9999", name: "Central Office (Headquarters)", type: "Head Office" },
  { code: "JB0001", name: "Main Branch (Dhaka)", type: "General" },
  { code: "JB0002", name: "Corporate Branch (Dilkusha)", type: "Corporate" },
  { code: "JB0003", name: "Motijheel Branch", type: "General" },
  { code: "JB0004", name: "Gulshan Branch", type: "Specialized" },
  { code: "JB0005", name: "Agrabad Branch (Chittagong)", type: "Regional" },
];

export function TopBar() {
  const [commandInput, setCommandInput] = React.useState("");
  const [branchSearch, setBranchSearch] = React.useState("");
  const { user, currentBranch, setBranch, clearSession } = useSessionStore();
  const { addTab } = useWorkbenchStore();
  const { showAlert } = useAlertStore();

  const activeBranchCode = currentBranch ?? "JB9999";
  const activeBranchObj =
    AUTHORIZED_BRANCHES.find((b) => b.code === activeBranchCode) ?? AUTHORIZED_BRANCHES[0];

  const filteredBranches = React.useMemo(() => {
    if (!branchSearch.trim()) return AUTHORIZED_BRANCHES;
    const q = branchSearch.trim().toLowerCase();
    return AUTHORIZED_BRANCHES.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
    );
  }, [branchSearch]);

  const displayUser = user?.username ?? "System User";
  const displayRole = user?.role ?? "Administrator";
  const businessDate = "2026-09-15";

  const handleBranchSwitch = (code: string, name: string) => {
    setBranch(code);
    showAlert({
      type: "success",
      title: "Branch Context Switched",
      message: `Active session context roaming changed to ${name} [${code}].`,
    });
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const trimmed = commandInput.trim().toLowerCase();

    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (
          (node.command && node.command.toLowerCase() === trimmed) ||
          node.title.toLowerCase().includes(trimmed)
        ) {
          if (!node.children || node.children.length === 0) return node;
        }
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const matched = findNode(NAVIGATION_TREE);

    if (matched) {
      launchScreen({
        id: matched.command ?? matched.id,
        title: matched.title,
        componentName: matched.componentName,
        addTab,
      });
    } else {
      launchScreen({
        id: trimmed,
        title: trimmed.toUpperCase(),
        componentName: "DYNAMIC_FORM",
        addTab,
      });
      showAlert({
        type: "info",
        title: "Command Dispatched",
        message: `Opening dynamic specification for command '${trimmed.toUpperCase()}'.`,
      });
    }

    setCommandInput("");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width] ease-linear select-none">
      {/* Header Left: Sidebar Trigger, Vertical Divider, Search Input */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <form onSubmit={handleCommandSubmit} className="relative w-64">
          <CommandIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Command or screen ID..."
            className="pl-8 h-8 text-xs bg-muted/50 border-border/60"
          />
        </form>
      </div>

      {/* Header Right: Branch Switcher, Theme Toggle, User Avatar Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Branch Roaming Dropdown Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 px-2.5 bg-background border-border/80 hover:bg-accent hover:text-accent-foreground"
              />
            }
          >
            <div className="size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="size-3.5" />
            </div>
            <span className="font-semibold text-xs font-mono tracking-tight text-foreground">
              [{activeBranchObj.code}] • {activeBranchObj.type}
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
            {/* Header: Branch Search Field without extra header text */}
            <div className="p-2 border-b border-border/60 bg-muted/30 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branch name or code..."
                className="pl-8 h-8 text-xs bg-background border-border/70 focus-visible:ring-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <DropdownMenuGroup className="max-h-60 overflow-y-auto p-1">
              {filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => {
                  const isCurrent = branch.code === activeBranchCode;
                  return (
                    <DropdownMenuItem
                      key={branch.code}
                      onClick={() => handleBranchSwitch(branch.code, branch.name)}
                      className="flex items-center justify-between py-2 cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs">{branch.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {branch.code} • {branch.type}
                        </span>
                      </div>
                      {isCurrent && <Check className="size-4 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No matching branches found.
                </div>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="h-5 w-px bg-border/70" />

        {/* User Session Avatar & Profile Dropdown (Consistent CTA Design) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="size-8 bg-background border-border/80 hover:bg-accent hover:text-accent-foreground"
                title={displayUser}
              />
            }
          >
            <div className="size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="size-3.5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border/60">
                  <User className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs leading-tight truncate">
                    {displayUser}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate">
                    sysadmin@janatabank.org.bd
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0">
                      {displayRole}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {businessDate}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer text-xs gap-2 py-2">
                <UserCheck className="size-3.5 text-muted-foreground" />
                <span>User Profile & Privileges</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs gap-2 py-2">
                <KeyRound className="size-3.5 text-muted-foreground" />
                <span>Security & Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs gap-2 py-2">
                <ShieldAlert className="size-3.5 text-muted-foreground" />
                <span>Audit Log History</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={clearSession}
              className="cursor-pointer text-xs gap-2 py-2"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
