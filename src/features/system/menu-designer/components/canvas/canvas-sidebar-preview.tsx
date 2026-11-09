"use client";

import { SidebarMenuTree } from "@/components/layout/sidebar/components/sidebar-menu-tree";
import type { MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";

export interface CanvasSidebarPreviewProps {
  treeNodes: MenuTreeNode[];
}

export function CanvasSidebarPreview({ treeNodes }: CanvasSidebarPreviewProps) {
  return (
    <div className="max-w-md mx-auto py-2">
      <div className="p-2 mb-2 rounded bg-muted/20 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Workbench Sidebar Layout Preview</span>
        <span className="font-mono text-[10px] text-primary">Live Readout</span>
      </div>
      <div className="rounded-lg border border-sidebar-border bg-sidebar p-2 shadow-xs">
        <SidebarMenuTree
          treeNodes={treeNodes}
          loading={false}
          openSettingsTab={() => {}}
          onLogout={() => {}}
        />
      </div>
    </div>
  );
}
