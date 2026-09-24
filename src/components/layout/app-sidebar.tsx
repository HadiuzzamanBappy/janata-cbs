"use client";

import Image from "next/image";
import * as React from "react";
import logo from "@/app/icon.png";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { launchScreen, type MenuItem } from "@/features/workspace";
import { cn } from "@/lib/utils";

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

function RecursiveTreeItem({
  node,
  openSettingsTab,
  clearSession,
}: TreeItemProps) {
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

  return (
    <div className="flex flex-col select-none my-0.5">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150 group w-full text-left border-0 bg-transparent",
          isActive
            ? "bg-primary/15 text-primary font-semibold"
            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground",
        )}
      >
        {hasChildren ? (
          <span className="size-4 flex items-center justify-center text-muted-foreground/80 group-hover:text-foreground transition-colors shrink-0 text-[10px]">
            {isOpen ? "▼" : "▶"}
          </span>
        ) : (
          <span className="size-4 flex items-center justify-center text-muted-foreground/60 shrink-0 text-[10px] font-mono">
            ▸
          </span>
        )}

        <span className="truncate">{node.title}</span>
      </button>

      {hasChildren && isOpen && (
        <div className="flex flex-col border-l border-border/50 ml-4 pl-2.5 py-1 space-y-1">
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
}

export function AppSidebar({
  openSettingsTab,
  clearSession,
  ...props
}: AppSidebarProps) {
  const [treeNodes, setTreeNodes] = React.useState<TreeNode[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/menu")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setTreeNodes(json.data.map(mapMenuItemToTreeNode));
        }
      })
      .catch((err) => {
        console.error("Failed to load sidebar menu API", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/60"
      {...props}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="h-16 shrink-0 border-b border-border/60 px-4 py-0 flex flex-row items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={logo}
            alt="Janata Bank PLC"
            className="size-8 rounded-lg object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm leading-tight truncate text-foreground">
              Janata Bank PLc.
            </span>
            <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              Core Banking Solution
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="p-3 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col space-y-2 p-1">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <Skeleton className="h-6 w-5/6 rounded-md ml-3" />
            <Skeleton className="h-6 w-2/3 rounded-md ml-3" />
            <Skeleton className="h-6 w-4/5 rounded-md" />
            <Skeleton className="h-6 w-3/4 rounded-md ml-3" />
            <Skeleton className="h-6 w-1/2 rounded-md" />
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            {treeNodes.map((node) => (
              <RecursiveTreeItem
                key={node.id}
                node={node}
                openSettingsTab={openSettingsTab}
                clearSession={clearSession}
              />
            ))}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
