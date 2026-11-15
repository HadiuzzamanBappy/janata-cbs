"use client";

import { SidebarContent } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/core-utils";
import type { MenuItem } from "@/lib/data-schemas";
import { CbsMenuTreeItem } from "./cbs-menu-tree-item";

export interface CbsMenuTreeProps {
  treeNodes: MenuItem[];
  loading?: boolean;
  openSettingsTab?: (tabId: string) => void;
  onLogout?: () => void;
  className?: string;
}

export function CbsMenuTree({
  treeNodes,
  loading = false,
  openSettingsTab = () => {},
  onLogout = () => {},
  className,
}: CbsMenuTreeProps) {
  return (
    <SidebarContent
      className={cn(
        "p-1.5 overflow-y-auto overflow-x-visible flex-1 group-data-[collapsible=icon]:hidden",
        className,
      )}
    >
      {loading ? (
        <div className="flex flex-col space-y-1.5 p-1">
          <Skeleton className="h-5 w-3/4 rounded-sm" />
          <Skeleton className="h-5 w-5/6 rounded-sm ml-2" />
          <Skeleton className="h-5 w-2/3 rounded-sm ml-2" />
          <Skeleton className="h-5 w-4/5 rounded-sm" />
          <Skeleton className="h-5 w-3/4 rounded-sm ml-2" />
          <Skeleton className="h-5 w-1/2 rounded-sm" />
        </div>
      ) : treeNodes.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No navigation menus available
        </div>
      ) : (
        <div role="tree" className="flex flex-col space-y-0.5">
          {treeNodes.map((node) => (
            <CbsMenuTreeItem
              key={node.id}
              node={node}
              openSettingsTab={openSettingsTab}
              clearSession={onLogout}
            />
          ))}
        </div>
      )}
    </SidebarContent>
  );
}
