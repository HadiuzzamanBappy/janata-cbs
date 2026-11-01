"use client";

import { ExternalLink, X } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { type DragPayload, isContainerPayload } from "./tab-group-types";

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
  onReorderSections?: (activeId: string, overId: string, insertIndex?: number) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  onMoveFieldAcrossSections?: (
    sourceSecId: string,
    targetSecId: string,
    fieldId: string,
    targetFieldId?: string,
    insertAtIndex?: number,
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  onDragOverTab: (tabId: string) => void;
  onDragLeaveTab: (tabId: string) => void;
  onDropOnTab: () => void;
}

export function TabStripItem({
  tab,
  index,
  totalTabs,
  isActive,
  isSelected,
  isOverThisTab,
  groupId,
  disabled,
  onSelect,
  onRemove,
  onReorderSections,
  onConvertSectionZone,
  onMoveFieldAcrossSections,
  onDropPaletteItem,
  onDragOverTab,
  onDragLeaveTab,
  onDropOnTab,
}: TabStripItemProps) {
  const universalTabNumber = index + 1;

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "canvas-tab",
        sectionId: tab.id,
        tabGroupId: groupId,
        title: tab.title,
        tabTitle: tab.tabTitle || tab.title,
        sectionType: tab.type,
      }),
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    onDragOverTab(tab.id);
  };

  const handleDragLeave = () => {
    onDragLeaveTab(tab.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDropOnTab();
    if (disabled) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr) as DragPayload;

      // Field / Variable dropped onto this tab button
      if (parsed.type === "palette-field" || parsed.field) {
        onDropPaletteItem?.(parsed, tab.id);
        return;
      }
      if (parsed.type === "canvas-field" && typeof parsed.fieldId === "string") {
        const sourceSecId = String(parsed.sectionId || "");
        if (sourceSecId && onMoveFieldAcrossSections) {
          onMoveFieldAcrossSections(sourceSecId, tab.id, parsed.fieldId);
        }
        return;
      }

      // Tab reordering within same group or moving across groups
      if (parsed.type === "canvas-tab" && typeof parsed.sectionId === "string") {
        if (parsed.tabGroupId === groupId && parsed.sectionId !== tab.id) {
          onReorderSections?.(parsed.sectionId, tab.id);
          return;
        }
        if (parsed.tabGroupId !== groupId) {
          onConvertSectionZone?.(parsed.sectionId, "tab", {
            tabGroupId: groupId,
            tabTitle:
              typeof parsed.tabTitle === "string"
                ? parsed.tabTitle
                : typeof parsed.title === "string"
                  ? parsed.title
                  : undefined,
          });
          return;
        }
      }

      // Card dropped directly on tab button -> convert into tab
      if (parsed.type === "canvas-section" && typeof parsed.sectionId === "string") {
        onConvertSectionZone?.(parsed.sectionId, "tab", {
          tabGroupId: groupId,
          tabTitle:
            typeof parsed.tabTitle === "string"
              ? parsed.tabTitle
              : typeof parsed.title === "string"
                ? parsed.title
                : undefined,
        });
        return;
      }

      // Palette container dropped on tab button -> add as new tab
      if (isContainerPayload(parsed)) {
        onDropPaletteItem?.(
          {
            ...parsed,
            zone: "tab",
            tabGroupId: groupId,
            tabTitle: parsed.title || `Tab ${totalTabs + 1}`,
          },
          "new-tab-in-group",
        );
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div
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
          ? "bg-background text-foreground font-semibold rounded-t-sm z-20 border-t border-l border-r border-border/80 border-b-0 shadow-xs after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500 after:rounded-t-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground rounded-t-sm border border-transparent",
        isSelected && !isActive && "ring-1 ring-sky-500/50 text-foreground",
        isOverThisTab && "ring-2 ring-sky-500 border-sky-500 bg-sky-500/20 scale-102",
      )}
    >
      {/* Primary Tab Select Button */}
      <div className="flex items-center gap-2 pl-3 pr-1.5 py-1 h-full text-left truncate cursor-pointer pointer-events-none">
        <span className="truncate max-w-40 text-xs flex items-center gap-1.5">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "h-4 min-w-4 px-1 rounded-xs text-[10px] font-mono flex items-center justify-center transition-opacity",
              isActive
                ? "bg-sky-500/15 text-sky-500 border-transparent font-semibold"
                : "opacity-70 border-transparent",
              !disabled && "group-hover:opacity-0",
            )}
          >
            {universalTabNumber}
          </Badge>
          <span>{tab.tabTitle || tab.title || "Tab"}</span>
        </span>
      </div>

      {/* Detach to Card Icon Button - Replaces number badge on hover */}
      {!disabled && onConvertSectionZone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConvertSectionZone(tab.id, "standard");
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
            title={`Close tab ${tab.tabTitle || tab.title || "Tab"}`}
            aria-label={`Close tab ${tab.tabTitle || tab.title || "Tab"}`}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
