import { SidebarContent } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { TreeNode } from "../types";
import { SidebarTreeItem } from "./sidebar-tree-item";

interface SidebarMenuTreeProps {
  treeNodes: TreeNode[];
  loading: boolean;
  openSettingsTab: (tabId: string) => void;
  onLogout: () => void;
}

export function SidebarMenuTree({
  treeNodes,
  loading,
  openSettingsTab,
  onLogout,
}: SidebarMenuTreeProps) {
  return (
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
        <div role="tree" className="flex flex-col space-y-0.5">
          {treeNodes.map((node) => (
            <SidebarTreeItem
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
