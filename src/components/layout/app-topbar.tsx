"use client";

import {
  AlertCircle,
  Building2,
  Check,
  ChevronsUpDown,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  User,
  UserCheck,
} from "lucide-react";
import * as React from "react";
import { AppSearch } from "@/components/layout/app-search";
import { AppSettings } from "@/components/layout/app-settings";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAlertStore } from "@/components/providers/alert-provider";
import { useSessionStore } from "@/components/providers/session-provider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";

export function TopBar() {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState("profile");
  const [branchSearch, setBranchSearch] = React.useState("");
  const [branches, setBranches] = React.useState<
    Array<{ code: string; name: string; type: string }>
  >([]);
  const [branchLoading, setBranchLoading] = React.useState(true);
  const [branchError, setBranchError] = React.useState<string | null>(null);

  const { user, currentBranch, setBranch, setSession, logout } =
    useSessionStore();
  const { confirm: confirmAlert } = useAlertStore();

  const loadBranches = React.useCallback(() => {
    setBranchLoading(true);
    setBranchError(null);
    fetch("/api/branches")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setBranches(
            json.data.map((b: { recordId: string; branchTitle: string }) => ({
              code: b.recordId,
              name: b.branchTitle,
              type: b.recordId === "JB9999" ? "Head Office" : "General",
            })),
          );
        } else {
          setBranchError(json.error || "Failed to load branch list");
        }
      })
      .catch((err) => {
        setBranchError(err?.message || "Failed to connect to branch service");
      })
      .finally(() => {
        setBranchLoading(false);
      });
  }, []);

  React.useEffect(() => {
    // Hydrate User Session
    if (!user) {
      fetch("/api/session")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.currUser) {
            setSession(json.currUser);
            if (json.currUser.branchCode && !currentBranch) {
              setBranch(json.currUser.branchCode);
            }
          }
        })
        .catch((err) => console.error("Failed to hydrate session", err));
    }

    loadBranches();
  }, [user, currentBranch, setSession, setBranch, loadBranches]);

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
    branches.find((b) => b.code === activeBranchCode) ??
    (branches.length > 0 ? branches[0] : null);

  const filteredBranches = React.useMemo(() => {
    if (!branchSearch.trim()) return branches;
    const q = branchSearch.trim().toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q),
    );
  }, [branchSearch, branches]);

  const displayUser = user?.fullName;
  const displayId = user?.userId;
  const displayRole = user?.userRole?.join(", ") || user?.userRole?.[0];
  const businessDate = user?.txnDate;

  const handleBranchSwitch = (code: string, name: string) => {
    setBranch(code);
    toast.add({
      title: "Branch Context Switched",
      description: `Active session roaming changed to ${name} [${code}].`,
      type: "success",
    });
  };

  const openSettingsTab = (tabId: string) => {
    setSettingsTab(tabId);
    setSettingsOpen(true);
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
            className="h-8 gap-2 bg-background px-2 sm:px-3 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline-block">Search / Run</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Header Right: Branch Switcher, Theme Toggle, User Avatar Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Branch Roaming Dropdown Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-3 border-border/80 hover:bg-accent min-w-0"
                />
              }
            >
              <Building2 className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate max-w-[140px] sm:max-w-[220px] text-xs font-medium">
                {branchLoading
                  ? "Loading..."
                  : branchError
                    ? "Branch Load Error"
                    : activeBranchObj
                      ? `[${activeBranchObj.code}] ${activeBranchObj.name}`
                      : `[${activeBranchCode}]`}
              </span>
              <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px]">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Switch Active Branch
                </div>
                <Input
                  placeholder="Search by code or name..."
                  className="h-8 text-xs bg-muted/50"
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  disabled={Boolean(branchError)}
                />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                {branchLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="size-3.5 animate-spin text-primary" />
                    <span>Loading branches...</span>
                  </div>
                ) : branchError ? (
                  <div className="p-3 text-center text-xs space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-destructive font-medium">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>Failed to load branches</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight px-1">
                      {branchError}
                    </p>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => loadBranches()}
                      className="mt-1 h-7 text-xs gap-1.5 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <RefreshCw className="size-3" />
                      <span>Refresh / Retry</span>
                    </Button>
                  </div>
                ) : filteredBranches.length === 0 ? (
                  <div className="p-2 text-center text-xs text-muted-foreground">
                    No branches found
                  </div>
                ) : (
                  filteredBranches.map((b) => (
                    <DropdownMenuItem
                      key={b.code}
                      onSelect={() => handleBranchSwitch(b.code, b.name)}
                      className="flex items-center justify-between py-2 px-2.5 cursor-pointer focus:bg-accent text-xs gap-2"
                    >
                      <span className="truncate flex items-center gap-1.5 font-medium">
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded shrink-0">
                          [{b.code}]
                        </span>
                        <span className="truncate">{b.name}</span>
                      </span>
                      {activeBranchCode === b.code && (
                        <Check className="size-3.5 shrink-0 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))
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
                  title={displayUser || "No User"}
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
                      {displayUser || "null"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono px-1 py-0 shrink-0"
                      >
                        {displayId || "null"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono px-1 py-0 shrink-0"
                      >
                        {displayRole || "null"}
                      </Badge>
                      <span className="text-[10px] opacity-50 shrink-0">
                        &bull;
                      </span>
                      <span className="text-[10px] font-mono shrink-0">
                        {businessDate || "null"}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer text-xs gap-2 py-2"
                  onClick={() => openSettingsTab("profile")}
                >
                  <UserCheck className="size-3.5 text-muted-foreground" />
                  <span>User Profile & Privileges</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-xs gap-2 py-2"
                  onClick={() => openSettingsTab("security")}
                >
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  <span>Security & Password</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  confirmAlert({
                    title: "Sign Out Confirmation",
                    message:
                      "Are you sure you want to terminate your current active session? Any unsaved form progress will be lost.",
                    variant: "destructive",
                    confirmText: "Sign Out",
                    onConfirm: () => logout(),
                  })
                }
                className="cursor-pointer text-xs gap-2 py-2"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <AppSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        openSettingsTab={openSettingsTab}
      />
      <AppSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />
    </>
  );
}
