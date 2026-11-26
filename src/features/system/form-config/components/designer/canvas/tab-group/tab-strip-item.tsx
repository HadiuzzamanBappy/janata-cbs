"use client";

import { useDroppable } from "@dnd-kit/core";
import { ExternalLink, X } from "lucide-react";
import type * as React from "react";
import { containerBadgeTone } from "@/components/cbs-form-engine";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../../context/designer-context";
import { readDragPayload, writeDragPayload } from "../drag-payload";

export interface TabStripItemProps {
  tab: FormSection;
  index: number;
  totalTabs: number;
  isActive: boolean;
  isSelected: boolean;
  isOverThisTab: boolean;
  groupId: string;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDragOverTab: (tabId: string) => void;
  onDragLeaveTab: (tabId: string) => void;
  onDropOnTab: () => void;
}

export function TabStripItem(props: TabStripItemProps) {
  const context = useDesignerContext();
  const {
    tab,
    index,
    totalTabs,
    isActive,
    isSelected,
    isOverThisTab,
    groupId,
    onSelect,
    onRemove,
    onDragOverTab,
    onDragLeaveTab,
    onDropOnTab,
  } = props;

  const disabled = props.disabled ?? context.disabled;
  const onReorderSections = context.onReorderSections;
  const onConvertSectionZone = context.onConvertSectionZone;
  const onDropPaletteItem = context.handleDropPaletteItem;
  const universalTabNumber = index + 1;

  const { setNodeRef, isOver: isDndOver } = useDroppable({
    id: `tab-strip-${tab.id}`,
    data: {
      type: "tab-header-strip-item",
      tabId: tab.id,
      sectionId: tab.id,
    },
    disabled,
  });

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    writeDragPayload(e, {
      type: "canvas-tab",
      sectionId: tab.id,
      groupId,
      title: tab.title,
      groupTitle: tab.groupTitle || tab.title,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    onDragOverTab(tab.id);
  };

  const handleDragLeave = () => {
    onDragLeaveTab(tab.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDropOnTab();
    const payload = disabled ? null : readDragPayload(e);
    if (!payload) return;

    // A field joins this tab, at the end, and the tab becomes active
    if (payload.type === "palette-variable") {
      onSelect();
      onDropPaletteItem(payload, {
        kind: "section",
        sectionId: tab.id,
        insertIndex: (tab.fields || []).length,
      });
      return;
    }

    // A container preset becomes a new tab of this group
    if (payload.type === "palette-container") {
      onDropPaletteItem(payload, {
        kind: "new-tab",
        groupId,
        title: payload.title || `Tab ${totalTabs + 1}`,
      });
      return;
    }

    // A tab: reordered within this group, or moved in right after this tab from another group
    if (payload.sectionId === tab.id) return;
    if (payload.groupId === groupId) {
      onReorderSections?.(payload.sectionId, tab.id);
      return;
    }
    const tabIndex = context.sections.findIndex((sec) => sec.id === tab.id);
    onConvertSectionZone?.(payload.sectionId, "tab", {
      groupId,
      groupTitle: payload.groupTitle ?? payload.title,
      insertIndex: tabIndex + 1,
    });
  };

  return (
    <div
      ref={setNodeRef}
      role="tab"
      data-tab-id={tab.id}
      aria-selected={isActive}
      tabIndex={0}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex items-center text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 select-none cursor-pointer h-9 px-0",
        isActive
          ? "bg-background text-foreground font-semibold rounded-t-sm z-20 border-t border-l border-r border-border/80 border-b-0 shadow-xs overflow-hidden after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t-sm -mb-px"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground rounded-t-sm border border-transparent",
        isSelected &&
          context.tabScope === "item" &&
          "ring-1 ring-primary border-primary text-foreground font-bold",
        (isOverThisTab || isDndOver) &&
          "ring-2 ring-primary border-primary bg-primary/20 scale-102",
      )}
    >
      {/* Primary Tab Select Button */}
      <div className="flex items-center gap-2 pl-3 pr-1.5 py-1 h-full text-left truncate cursor-pointer pointer-events-none">
        <span className="truncate max-w-40 text-xs flex items-center gap-1.5">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "h-4 min-w-4 px-1 rounded-xs text-3xs font-mono flex items-center justify-center transition-opacity",
              isActive
                ? "bg-primary/15 text-primary border-transparent font-semibold"
                : "opacity-70 border-transparent",
              !disabled && "group-hover:opacity-0",
            )}
          >
            {universalTabNumber}
          </Badge>
          <span>{tab.title || tab.groupTitle || "Tab"}</span>
          {tab.containerConfig?.badge && (
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.2 text-3xs font-mono rounded",
                containerBadgeTone(
                  tab.containerConfig.badgeVariant,
                  "bg-muted text-muted-foreground",
                ),
              )}
            >
              {tab.containerConfig.badge}
            </span>
          )}
        </span>
      </div>

      {/* Detach to Card Icon Button - Replaces number badge on hover */}
      {!disabled && onConvertSectionZone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConvertSectionZone(tab.id, "card");
          }}
          className="absolute left-3 size-4 rounded-xs hidden group-hover:flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer z-10"
          title="Detach this tab to an independent card on canvas"
          aria-label="Detach tab to card"
        >
          <ExternalLink className="size-3" />
        </button>
      )}

      {/* Tab Close Action - Always Visible like AppTabBar */}
      {!disabled && totalTabs > 1 && (
        <div className="flex items-center pr-2 pl-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={cn(
              "size-4 rounded-xs flex items-center justify-center transition-colors shrink-0 cursor-pointer",
              isActive
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 group-hover:text-muted-foreground",
            )}
            title={`Close tab ${tab.title || tab.groupTitle || "Tab"}`}
            aria-label={`Close tab ${tab.title || tab.groupTitle || "Tab"}`}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
