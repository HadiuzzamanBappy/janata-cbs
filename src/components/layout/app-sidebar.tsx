"use client";

import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  User,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { createPortal } from "react-dom";
import logo from "@/app/icon.png";
import { AppSearch } from "@/components/layout/app-search";
import { BranchSwitcher } from "@/components/layout/sidebar/branch-switcher";
import { ThemeToggle } from "@/components/layout/sidebar/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SettingsDialog } from "@/features/settings";
import { launchScreen } from "@/features/screens";
import { useHotkeys } from "@/hooks";
import { appConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { MenuItem } from "@/lib/schemas";
import { cn, toTitleCase } from "@/lib/utils";
import { useAlertStore, useSessionStore, useWorkbenchStore } from "@/store";

export interface TreeNode {
  id: string;
  title: string;
  command?: string;
  componentName?: string;
  children?: TreeNode[];
}

function mapMenuItemToTreeNode(item: MenuItem): TreeNode {
  return {
    id: item.id,
    title: item.label,
    command: item.command,
    componentName: item.command ? item.command.replace(/\./g, "_") : undefined,
    children: item.children?.map(mapMenuItemToTreeNode),
  };
}

interface TreeItemProps {
  node: TreeNode;
  level?: number;
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
}

/**
 * Helper to check if a tree node or any of its descendants matches the active command/screen ID
 */
function hasActiveChild(node: TreeNode, activeId?: string): boolean {
  if (!activeId) return false;
  if (
    node.command === activeId ||
    node.id === activeId ||
    node.command?.toUpperCase() === activeId.toUpperCase()
  ) {
    return true;
  }
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => hasActiveChild(child, activeId));
  }
  return false;
}

function RecursiveTreeItem({ node, openSettingsTab, clearSession }: TreeItemProps) {
  const { addTab, tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const activeCommand = activeTab?.screenId || activeTab?.id;

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isLeaf = !hasChildren;

  // Check if this node or any child node is currently active
  const isChildActive = React.useMemo(
    () => hasActiveChild(node, activeCommand),
    [node, activeCommand],
  );

  const [isOpen, setIsOpen] = React.useState(isChildActive);

  // Automatically expand parent node when a child screen is launched (e.g. via Search)
  React.useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  const isActive =
    isLeaf &&
    (activeCommand === (node.command ?? node.id) ||
      activeCommand?.toUpperCase() === (node.command ?? node.id).toUpperCase());

  const handleClick = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    } else {
      launchScreen({
        id: node.command ?? node.id,
        title: node.title,
        componentName: node.componentName,
        addTab,
        openSettingsTab,
        clearSession,
      });
    }
  };

  const textRef = React.useRef<HTMLSpanElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [isOverflowed, setIsOverflowed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [popoutPos, setPopoutPos] = React.useState<{ top: number; left: number; height: number } | null>(null);

  const checkOverflow = () => {
    if (textRef.current) {
      const hasOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
      setIsOverflowed(hasOverflow);
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoutPos({
        top: rect.top,
        left: rect.left,
        height: rect.height,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const shouldPopout = isOverflowed && isHovered && popoutPos !== null;

  return (
    <div
      className="flex flex-col select-none relative"
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={checkOverflow}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
        className={cn(
          "flex items-center gap-1 px-1 py-1.5 rounded-md text-xs font-normal cursor-pointer transition-all duration-150 ease-out group w-full text-left border-0 bg-transparent relative leading-snug",
          isActive
            ? "bg-accent/80 text-foreground font-medium shadow-2xs"
            : isChildActive
              ? "text-foreground font-normal hover:bg-accent/30"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        )}
      >
        {hasChildren ? (
          <span className="size-3.5 flex items-center justify-center text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors duration-200">
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
        ) : (
          <span className="size-3.5 flex items-center justify-center text-muted-foreground/50 group-hover:text-foreground shrink-0 transition-colors duration-200">
            <span className="size-1 rounded-full bg-current opacity-70" />
          </span>
        )}

        <span
          ref={textRef}
          className="flex-1 min-w-0 truncate"
        >
          {node.title}
        </span>
      </button>

      {/* Floating Popout via Portal to completely bypass overflow/clipping containers */}
      {shouldPopout && typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${popoutPos.top}px`,
              left: `${popoutPos.left}px`,
              minHeight: `${popoutPos.height}px`,
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="z-5000 flex items-center gap-1 px-1.5 py-1.5 rounded-md text-xs font-normal whitespace-nowrap bg-accent/95 backdrop-blur-md text-foreground shadow-xl ring-1 ring-border/80 cursor-pointer pointer-events-auto leading-snug animate-in fade-in-0 duration-100"
          >
            {hasChildren ? (
              <span className="size-3.5 flex items-center justify-center text-muted-foreground/80 shrink-0">
                {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </span>
            ) : (
              <span className="size-3.5 flex items-center justify-center text-muted-foreground/50 shrink-0">
                <span className="size-1 rounded-full bg-current opacity-70" />
              </span>
            )}
            <span>{node.title}</span>
          </div>,
          document.body,
        )}

      {/* Tree Indentation & Vertical Guide Connector Line */}
      {hasChildren && isOpen && (
        <div className="flex flex-col relative ml-1.5 pl-1.5 my-0.5 space-y-0.5">
          {/* Subtle Vertical Connector Guide Line */}
          <div className="absolute left-0 top-0 bottom-1 w-px bg-border/40" />

          {node.children!.map((child) => (
            <RecursiveTreeItem
              key={child.id}
              node={child}
              openSettingsTab={openSettingsTab}
              clearSession={clearSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const [treeNodes, setTreeNodes] = React.useState<TreeNode[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState("profile");

  const { user, currentBranch, setSession, setBranch, logout } = useSessionStore();
  const [userLoading, setUserLoading] = React.useState<boolean>(!user);
  const { confirm: confirmAlert } = useAlertStore();

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

  const displayUser = user?.fullName ? toTitleCase(user.fullName) : "";
  const displayId = user?.userId;
  const displayRole = user?.userRole?.join(", ") || user?.userRole?.[0];
  const businessDate = user?.txnDate;

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-xs" {...props}>
        {/* Sidebar Header: In expanded state, shows logo + title on left, Search icon & Toggle on right.
            In collapsed state, shows logo with toggle overlay/hover on top */}
        <SidebarHeader className="h-10 shrink-0 border-b border-border/60 p-0 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
          {/* Expanded mode branding */}
          <div className="flex items-center gap-2 min-w-0 px-2.5 group-data-[collapsible=icon]:hidden">
            <Image
              src={logo}
              alt="Janata Bank PLC"
              className="size-6.5 rounded-md object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs leading-tight truncate text-foreground">
                Janata Bank PLC.
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                Core Banking Solution
              </span>
            </div>
          </div>

          {/* Expanded mode action buttons: Search Icon + Sidebar Toggle */}
          <div className="flex items-center gap-0.5 pr-1.5 group-data-[collapsible=icon]:hidden shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearchOpen(true)}
              className="size-7 text-muted-foreground hover:text-foreground"
              title="Search / Run (⌘K / Ctrl+K)"
            >
              <Search className="size-3.5" />
            </Button>
            <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground" />
          </div>

          {/* Collapsed icon mode top item: Logo by default, switches to Toggle button on hover */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center size-9 relative group/iconheader">
            <Image
              src={logo}
              alt="Janata Bank PLC"
              className="size-6 rounded-md object-contain transition-opacity duration-150 group-hover/iconheader:opacity-0"
            />
            <SidebarTrigger className="size-7 absolute inset-0 m-auto opacity-0 group-hover/iconheader:opacity-100 transition-opacity duration-150 text-foreground hover:bg-accent" />
          </div>
        </SidebarHeader>

        {/* In collapsed mode: Compact icon button for Search below the top logo with divider */}
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

        {/* Sidebar Content (Menu Tree): Visible ONLY in expanded state */}
        <SidebarContent className="p-1.5 overflow-y-auto overflow-x-visible flex-1 group-data-[collapsible=icon]:hidden">
          {loading ? (
            <div className="flex flex-col space-y-1.5 p-1">
              <Skeleton className="h-5 w-3/4 rounded-sm" />
              <Skeleton className="h-5 w-5/6 rounded-sm ml-2" />
              <Skeleton className="h-5 w-2/3 rounded-sm ml-2" />
              <Skeleton className="h-5 w-4/5 rounded-sm" />
              <Skeleton className="h-5 w-3/4 rounded-sm ml-2" />
              <Skeleton className="h-5 w-1/2 rounded-sm" />
            </div>
          ) : (
            <div className="flex flex-col space-y-0.5">
              {treeNodes.map((node) => (
                <RecursiveTreeItem
                  key={node.id}
                  node={node}
                  openSettingsTab={openSettingsTab}
                  clearSession={() => logout()}
                />
              ))}
            </div>
          )}
        </SidebarContent>

        {/* In collapsed icon mode: Empty flex spacer so footer remains pinned to bottom */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-1" />

        {/* Sidebar Footer with Branch at bottom, and User / Settings / Logout below it */}
        <SidebarFooter className="border-t border-border/60 p-1.5 gap-1 bg-background/50 shrink-0 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:items-center">
          {/* Expanded mode footer */}
          <div className="flex flex-col gap-1 w-full group-data-[collapsible=icon]:hidden">
            {/* Row 1: Branch Switcher at bottom */}
            <BranchSwitcher
              className="w-full"
              triggerClassName="w-full justify-between h-7 px-2 text-xs"
              align="start"
            />

            {/* Row 2: User profile button (opens settings) + dedicated Logout button */}
            <div className="flex items-center gap-1 w-full">
              {/* User Profile Button (opens settings directly on click) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openSettingsTab("profile")}
                disabled={userLoading}
                className="flex-1 h-7 px-2 justify-start gap-1.5 min-w-0 text-xs font-normal border-border/80 hover:bg-accent"
                title={userLoading ? "Loading user session..." : `User: ${displayUser || displayId || "User"}${displayRole ? ` (${displayRole})` : ""}${businessDate ? ` • ${businessDate}` : ""} — Click to open settings`}
              >
                <div className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User className="size-2.5" />
                </div>
                {userLoading ? (
                  <Skeleton className="h-3.5 w-24 rounded" />
                ) : (
                  <span className="truncate text-xs text-foreground font-medium flex-1 text-left">
                    {displayUser || displayId || "User"}
                  </span>
                )}
              </Button>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Logout Button */}
              <TooltipProvider delay={150}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
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
                        className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent className="text-xs">Sign Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Collapsed icon mode footer: Compact vertical icon column */}
          <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1.5 py-1">
            <TooltipProvider delay={150}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openSettingsTab("profile")}
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <User className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent side="right" className="text-xs">
                  {displayUser || "User Profile"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ThemeToggle />

            <TooltipProvider delay={150}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
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
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent side="right" className="text-xs">Sign Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Global Search Dialog */}
      <AppSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        openSettingsTab={openSettingsTab}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />
    </>
  );
}
