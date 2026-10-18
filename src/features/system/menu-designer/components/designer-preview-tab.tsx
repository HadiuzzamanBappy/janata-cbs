"use client";

import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { MenuTreeNode, MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

export interface DesignerPreviewTabProps {
  formData: MenuTreeRecord;
}

export function DesignerPreviewTab({ formData }: DesignerPreviewTabProps) {
  const nodes = React.useMemo(
    () => (formData.menuTree || []).filter((n) => n.isVisible !== false),
    [formData.menuTree],
  );

  // Maintain collapsed set (empty by default means all groups are open)
  const [collapsedGroupIds, setCollapsedGroupIds] = React.useState<Set<string>>(new Set());
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  const toggleGroup = React.useCallback((id: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    setCollapsedGroupIds(new Set());
  }, []);

  const collapseAll = React.useCallback(() => {
    const all = new Set<string>();
    function collect(list: MenuTreeNode[]) {
      for (const node of list) {
        if (node.children && node.children.length > 0) {
          all.add(node.id);
          collect(node.children);
        }
      }
    }
    collect(nodes);
    setCollapsedGroupIds(all);
  }, [nodes]);

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden select-none">
      {/* Minimal Top Control Bar */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {formData.treeDescription || formData.recordId || "Menu Tree"}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {nodes.length} top-level {nodes.length === 1 ? "branch" : "branches"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="h-6 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronsUpDown className="size-3" />
            <span>Expand All</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="h-6 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronsDownUp className="size-3" />
            <span>Collapse All</span>
          </Button>
        </div>
      </div>

      {/* Raw Menu Tree Body — Centered Layout */}
      <div className="flex-1 overflow-y-auto p-4 rounded border border-border/70 bg-card/40 flex justify-center items-start">
        {nodes.length === 0 ? (
          <div className="m-auto p-8 text-center text-xs text-muted-foreground">
            <p>No menu tree items configured</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Add groups and items in the Hierarchy Canvas tab to view the output tree.
            </p>
          </div>
        ) : (
          <div role="tree" className="w-full max-w-md sm:max-w-lg space-y-1 my-2">
            {nodes.map((node) => (
              <RawTreeNodeItem
                key={node.id}
                node={node}
                collapsedGroupIds={collapsedGroupIds}
                activeItemId={activeItemId}
                onToggleGroup={toggleGroup}
                onSelectItem={setActiveItemId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RawTreeNodeItemProps {
  node: MenuTreeNode;
  collapsedGroupIds: Set<string>;
  activeItemId: string | null;
  onToggleGroup: (id: string) => void;
  onSelectItem: (id: string) => void;
}

function RawTreeNodeItem({
  node,
  collapsedGroupIds,
  activeItemId,
  onToggleGroup,
  onSelectItem,
}: RawTreeNodeItemProps) {
  const visibleChildren = (node.children || []).filter((child) => child.isVisible !== false);
  const hasChildren = visibleChildren.length > 0;
  const isOpen = !collapsedGroupIds.has(node.id);
  const isActive = activeItemId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleGroup(node.id);
    } else {
      onSelectItem(node.id);
    }
  };

  return (
    <div className="flex flex-col select-none">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors duration-150 w-full text-left border-0 bg-transparent leading-snug",
          isActive
            ? "bg-accent/80 text-foreground font-semibold shadow-2xs"
            : hasChildren
              ? "text-foreground font-medium hover:bg-accent/30"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        )}
      >
        {hasChildren ? (
          <span className="size-4 flex items-center justify-center text-muted-foreground/80 shrink-0">
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
        ) : (
          <span className="size-4 flex items-center justify-center text-muted-foreground/50 shrink-0">
            <span className="size-1.5 rounded-full bg-current opacity-70" />
          </span>
        )}

        <span className="truncate">{node.label}</span>

        {node.command && (
          <code className="text-[10px] font-mono text-muted-foreground/70 bg-muted/40 px-1 py-0.5 rounded ml-auto shrink-0">
            {node.command}
          </code>
        )}
      </button>

      {/* Indented Children with Guide Line */}
      {hasChildren && isOpen && (
        <div className="flex flex-col ml-3 pl-3 my-0.5 border-l border-border/50 space-y-0.5">
          {visibleChildren.map((child) => (
            <RawTreeNodeItem
              key={child.id}
              node={child}
              collapsedGroupIds={collapsedGroupIds}
              activeItemId={activeItemId}
              onToggleGroup={onToggleGroup}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
