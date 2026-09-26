"use client";

import { Search } from "lucide-react";
import * as React from "react";
import { AppSearch } from "@/components/layout/app-search";
import { AppSettings } from "@/components/layout/app-settings";
import { BranchSwitcher } from "@/components/layout/components/branch-switcher";
import { UserMenu } from "@/components/layout/components/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSessionStore } from "@/components/providers/session-provider";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState("profile");

  const { user, currentBranch, setSession, setBranch } = useSessionStore();

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
          <BranchSwitcher />
          <ThemeToggle />
          <UserMenu onOpenSettingsTab={openSettingsTab} />
        </div>
      </header>
      <AppSearch open={searchOpen} onOpenChange={setSearchOpen} openSettingsTab={openSettingsTab} />
      <AppSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />
    </>
  );
}
