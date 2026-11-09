"use client";

import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/core-utils";
import type { MenuTreeNode, MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

export interface TreeContainerInspectorProps {
  formData: MenuTreeRecord;
  className?: string;
}

function countTotalNodes(nodes: MenuTreeNode[]): number {
  let count = 0;
  for (const n of nodes) {
    count += 1;
    if (n.children && n.children.length > 0) {
      count += countTotalNodes(n.children);
    }
  }
  return count;
}

export function TreeContainerInspector({ formData, className }: TreeContainerInspectorProps) {
  const treeNodes = formData.menuTree || [];
  const totalCount = countTotalNodes(treeNodes);
  const rootGroupsCount = treeNodes.length;

  return (
    <aside
      aria-label="Tree Container Properties"
      className={cn(
        "w-68 shrink-0 border-l border-border/70 bg-card flex flex-col h-full overflow-hidden",
        className,
      )}
    >
      {/* Container Header */}
      <header className="px-3 py-2 border-b border-border/70 flex items-center justify-between gap-2 shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <Network className="size-3.5 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-semibold truncate leading-tight">Tree Container</h3>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {formData.recordId || "NEW.TREE"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono h-4.5 px-1.5 shrink-0">
          CONTAINER
        </Badge>
      </header>

      {/* Container Properties Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Container Metrics Card */}
        <div className="p-2.5 rounded border border-border/50 bg-muted/15 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tree Title:</span>
            <span className="font-medium text-foreground truncate max-w-36 text-right">
              {formData.treeDescription || "Untitled Tree"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Lifecycle State:</span>
            <span className="font-mono text-xs">
              {formData.isActive !== false ? (
                <span className="text-emerald-500 font-semibold">ACTIVE</span>
              ) : (
                <span className="text-muted-foreground font-semibold">INACTIVE</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Root Categories:</span>
            <span className="font-semibold text-foreground font-mono">{rootGroupsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Elements in Tree:</span>
            <span className="font-semibold text-foreground font-mono">{totalCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
