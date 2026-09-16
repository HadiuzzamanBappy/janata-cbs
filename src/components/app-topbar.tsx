"use client";

import * as React from "react";
import {
  Building2,
  ChevronsUpDown,
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
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { GlobalSearchModal } from "@/components/global-search";

const AUTHORIZED_BRANCHES = [
  { code: "JB9999", name: "Central Office (Headquarters)", type: "Head Office" },
  { code: "JB0001", name: "Main Branch (Dhaka)", type: "General" },
  { code: "JB0002", name: "Corporate Branch (Dilkusha)", type: "Corporate" },
  { code: "JB0003", name: "Motijheel Branch", type: "General" },
  { code: "JB0004", name: "Gulshan Branch", type: "Specialized" },
  { code: "JB0005", name: "Agrabad Branch (Chittagong)", type: "Regional" },
];

export function TopBar() {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [branchSearch, setBranchSearch] = React.useState("");
  const { user, currentBranch, setBranch, clearSession } = useSessionStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
    toast.add({
      title: "Branch Context Switched",
      description: `Active session roaming changed to ${name} [${code}].`,
      type: "success",
    });
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width] ease-linear select-none">
        {/* Header Left: Sidebar Trigger, Vertical Divider, Global Search Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="mr-1 sm:mr-2 data-vertical:h-4 data-vertical:self-auto shrink-0"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="h-8 justify-between bg-muted/30 border-border/60 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer w-32 sm:w-44 md:w-56 px-2.5 shrink min-w-0"
            title="Search commands & screens (Ctrl+K)"
          >
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <Search className="size-3.5 opacity-60 shrink-0" />
              <span className="truncate text-xs font-normal">Search...</span>
            </div>
            <kbd className="pointer-events-none hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/60 bg-background px-1 font-mono text-[9px] font-medium opacity-80 shrink-0 ml-1">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Header Right: Branch Switcher, Theme Toggle, User Avatar Profile Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Branch Roaming Dropdown Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 sm:gap-2 px-2 sm:px-2.5 bg-background border-border/80 hover:bg-accent hover:text-accent-foreground shrink-0 max-w-[130px] sm:max-w-none"
                />
              }
            >
              <div className="size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="size-3.5" />
              </div>
              <span className="font-semibold text-xs font-mono tracking-tight text-foreground truncate max-w-[70px] sm:max-w-none">
                [{activeBranchObj.code}] • {activeBranchObj.type}
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground ml-0.5 sm:ml-1 shrink-0" />
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
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
