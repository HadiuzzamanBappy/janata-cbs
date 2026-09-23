"use client";

import Image from "next/image";
import * as React from "react";
import logo from "@/app/icon.png";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { STATIC_MENU } from "@fixtures";
import { launchScreen, type MenuItem } from "@/features/workspace";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";

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

export const NAVIGATION_TREE: TreeNode[] = STATIC_MENU.map(
  mapMenuItemToTreeNode,
);

interface TreeItemProps {
  node: TreeNode;
  level?: number;
}

function RecursiveTreeItem({ node }: TreeItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { addTab, tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isLeaf = !hasChildren;
  const isActive =
    isLeaf &&
    (activeTab?.screenId === (node.command ?? node.id) ||
      activeTab?.id === (node.command ?? node.id));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    } else {
      launchScreen({
        id: node.command ?? node.id,
        title: node.title,
        componentName: node.componentName,
        addTab,
      });
    }
  };

  return (
    <div className="flex flex-col select-none">
      {/* Node Row Header */}
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150 group",
          isActive
            ? "bg-primary/15 text-primary font-semibold"
            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground",
        )}
      >
        {/* Arrow-based indicators matching tree UI specification */}
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
      </div>

      {/* Recursive Children Sub-Tree with Guide Lines */}
      {hasChildren && isOpen && (
        <div className="flex flex-col border-l border-border/50 ml-3.5 pl-2 py-0.5 space-y-0.5">
          {node.children!.map((child) => (
            <RecursiveTreeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [treeNodes, setTreeNodes] = React.useState<TreeNode[]>(NAVIGATION_TREE);

  React.useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setTreeNodes(json.data.map(mapMenuItemToTreeNode));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/60"
      {...props}
    >
      {/* Sidebar Header: Brand Info matching TopBar height */}
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

      {/* Sidebar Content: Arrow-based Recursive Tree Menu */}
      <SidebarContent className="p-3 overflow-y-auto">
        <div className="flex flex-col space-y-1">
          {treeNodes.map((node) => (
            <RecursiveTreeItem key={node.id} node={node} />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
