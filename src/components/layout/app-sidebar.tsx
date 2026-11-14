"use client";

import { Search } from "lucide-react";
import * as React from "react";
import { AppSearch } from "@/components/cbs-command";
import { AppSettings } from "@/components/cbs-settings";
import {
  SidebarFooterNav,
  SidebarHeaderNav,
  SidebarMenuTree,
  useSidebarMenu,
} from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CBS_SETTINGS_EVENT } from "@/lib/cbs-command";
import { useHotkeys } from "@/lib/cbs-hotkeys";
import { useSessionStore } from "@/store";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState("profile");

  const { user, logout } = useSessionStore();
  const userLoading = !user;
  const { treeNodes, loading } = useSidebarMenu();

  useHotkeys("ctrl+k", () => setSearchOpen((prev) => !prev), {
    enableOnFormTags: true,
  });

  const openSettingsTab = React.useCallback((tabId: string) => {
    setSettingsTab(tabId);
    setSettingsOpen(true);
  }, []);

  React.useEffect(() => {
    const handleOpenSettings = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      if (customEvent.detail?.tab) {
        setSettingsTab(customEvent.detail.tab);
      }
      setSettingsOpen(true);
    };

    window.addEventListener(CBS_SETTINGS_EVENT, handleOpenSettings);
    return () => {
      window.removeEventListener(CBS_SETTINGS_EVENT, handleOpenSettings);
    };
  }, []);

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-xs" {...props}>
        {/* Sidebar Header */}
        <SidebarHeaderNav onOpenSearch={() => setSearchOpen(true)} />

        {/* Collapsed icon mode Search Button */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1.5 border-b border-border/50 shrink-0">
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearchOpen(true)}
                    className="size-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Search className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="right" className="text-xs">
                Search / Run (⌘K)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sidebar Content (Menu Tree) */}
        <SidebarMenuTree
          treeNodes={treeNodes}
          loading={loading}
          openSettingsTab={openSettingsTab}
          onLogout={() => logout()}
        />

        {/* Collapsed spacer */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-1" />

        {/* Sidebar Footer */}
        <SidebarFooterNav onOpenSettingsTab={openSettingsTab} userLoading={userLoading} />

        <SidebarRail />
      </Sidebar>

      {/* Global Search Dialog */}
      <AppSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Settings Dialog */}
      <AppSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />
    </>
  );
}
