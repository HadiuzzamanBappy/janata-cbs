"use client";

import { Search } from "lucide-react";
import * as React from "react";
import {
  mapMenuItemToTreeNode,
  SidebarFooterNav,
  SidebarHeaderNav,
  SidebarMenuTree,
  type TreeNode,
} from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppSearch } from "@/features/command";
import { AppSettings } from "@/features/settings";
import { useHotkeys } from "@/hooks";
import { appConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { useSessionStore } from "@/store";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const [treeNodes, setTreeNodes] = React.useState<TreeNode[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState("profile");

  const { user, currentBranch, setSession, setBranch, logout } = useSessionStore();
  const [userLoading, setUserLoading] = React.useState<boolean>(!user);

  React.useEffect(() => {
    // Hydrate User Session
    if (!user) {
      setUserLoading(true);
      fetch(appConfig.routes.api.session)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.currUser) {
            setSession(json.currUser);
            if (json.currUser.branchCode && !currentBranch) {
              setBranch(json.currUser.branchCode);
            }
          }
        })
        .catch((err) => logger.error("Failed to hydrate session", err, "SIDEBAR"))
        .finally(() => setUserLoading(false));
    } else {
      setUserLoading(false);
    }
  }, [user, currentBranch, setSession, setBranch]);

  useHotkeys("ctrl+k", () => setSearchOpen((prev) => !prev), {
    enableOnFormTags: true,
  });

  const openSettingsTab = (tabId: string) => {
    setSettingsTab(tabId);
    setSettingsOpen(true);
  };

  React.useEffect(() => {
    setLoading(true);
    fetch(appConfig.routes.api.menu)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setTreeNodes(json.data.map(mapMenuItemToTreeNode));
        }
      })
      .catch((err) => {
        logger.error("Failed to load sidebar menu API", err, "SIDEBAR");
      })
      .finally(() => {
        setLoading(false);
      });
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
                    className="size-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
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
      <AppSearch open={searchOpen} onOpenChange={setSearchOpen} openSettingsTab={openSettingsTab} />

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
