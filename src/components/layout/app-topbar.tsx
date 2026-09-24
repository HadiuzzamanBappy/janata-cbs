"use client";

import {
  Building2,
  Check,
  ChevronsUpDown,
  KeyRound,
  LogOut,
  Search,
  User,
  UserCheck,
} from "lucide-react";
import * as React from "react";
import { AppSearch } from "@/components/layout/app-search";
import { AppSettings } from "@/components/layout/app-settings";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
  >([
    {
      code: "JB9999",
      name: "Central Office (Headquarters)",
      type: "Head Office",
    },
  ]);
  const { user, currentBranch, setBranch, setSession, logout } =
    useSessionStore();

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
        }
      })
      .catch(() => {});
  }, [user, currentBranch, setSession, setBranch]);

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
    branches.find((b) => b.code === activeBranchCode) ?? branches[0];

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
              <span className="truncate max-w-[120px] sm:max-w-[200px] text-xs font-medium">
                {activeBranchObj.name}
              </span>
              <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Switch Active Branch
                </div>
                <Input
                  placeholder="Filter branches..."
                  className="h-8 text-xs bg-muted/50"
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                />
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                {filteredBranches.length === 0 ? (
                  <div className="p-2 text-center text-xs text-muted-foreground">
                    No branches found
                  </div>
                ) : (
                  filteredBranches.map((b) => (
                    <DropdownMenuItem
                      key={b.code}
                      onSelect={() => handleBranchSwitch(b.code, b.name)}
                      className="flex flex-col items-start gap-1 p-2 cursor-pointer focus:bg-accent"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-medium truncate pr-2">
                          {b.name}
                        </span>
                        {activeBranchCode === b.code && (
                          <Check className="size-3.5 shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded-sm">
                          [{b.code}]
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">
                          {b.type}
                        </span>
                      </div>
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
                onClick={logout}
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
