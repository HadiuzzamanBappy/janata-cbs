"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { GripVertical, Layers, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { AddSectionFn } from "../canvas/canvas-types";
import { TabStripItem } from "./tab-strip-item";

export interface TabGroupHeaderProps {
  groupId: string;
  tabSections: FormSection[];
  activeTabId: string;
  selectedSectionId: string | null;
  disabled?: boolean;
  isCanvasDragging?: boolean;
  dropZone: "header" | "body" | null;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onRemoveSection: (id: string) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  onReorderSections?: (activeId: string, overId: string, insertIndex?: number) => void;
  onMoveFieldAcrossSections?: (
    sourceSecId: string,
    targetSecId: string,
    fieldId: string,
    targetFieldId?: string,
    insertAtIndex?: number,
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  onHeaderDragOver: (e: React.DragEvent) => void;
  onHeaderDragLeave: (e: React.DragEvent) => void;
  onHeaderDrop: (e: React.DragEvent) => void;
  setActiveTabIdState: (id: string) => void;
  setDropZone: (zone: "header" | "body" | null) => void;
}

export function TabGroupHeader({
  groupId,
  tabSections,
  activeTabId,
  selectedSectionId,
  disabled,
  isCanvasDragging,
  dropZone,
  attributes,
  listeners,
  onSelectSection,
  onSelectField,
  onAddSection,
  onRemoveSection,
  onConvertSectionZone,
  onReorderSections,
  onMoveFieldAcrossSections,
  onDropPaletteItem,
  onHeaderDragOver,
  onHeaderDragLeave,
  onHeaderDrop,
  setActiveTabIdState,
  setDropZone,
}: TabGroupHeaderProps) {
  const isHoveringHeader = dropZone === "header" && isCanvasDragging;
  const [tabDragOverId, setTabDragOverId] = React.useState<string | null>(null);
  const tabHoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeTabId && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
      }
    }
  }, [activeTabId]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      scrollRef.current.scrollTop = 0;
    }
  };

  React.useEffect(() => {
    const handleDragReset = () => {
      setDropZone(null);
      setTabDragOverId(null);
      if (tabHoverTimerRef.current) clearTimeout(tabHoverTimerRef.current);
    };

    window.addEventListener("dragend", handleDragReset);
    window.addEventListener("drop", handleDragReset);

    return () => {
      window.removeEventListener("dragend", handleDragReset);
      window.removeEventListener("drop", handleDragReset);
      if (tabHoverTimerRef.current) clearTimeout(tabHoverTimerRef.current);
    };
  }, [setDropZone]);

  React.useEffect(() => {
    if (!isCanvasDragging) {
      setDropZone(null);
      setTabDragOverId(null);
    }
  }, [isCanvasDragging, setDropZone]);

  const handleAddTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !onAddSection) return;
    const n = tabSections.length + 1;
    const title = `Tab ${n}`;
    onAddSection("standard", "tab", [], "card", title, groupId, title);
  };

  return (
    <nav
      aria-label="Tab navigation strip"
      onDragOver={onHeaderDragOver}
      onDragLeave={onHeaderDragLeave}
      onDrop={onHeaderDrop}
      className={cn(
        "bg-muted/40 border-b border-border/70 px-2 pt-0 pb-0 flex items-end justify-between gap-2 transition-all h-9",
        isHoveringHeader && "bg-sky-500/15 ring-2 ring-inset ring-sky-500/70 border-sky-500",
      )}
    >
      <div className="flex items-end gap-1.5 overflow-x-auto min-w-0 flex-1 h-full">
        {!disabled && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground/50 hover:text-foreground shrink-0 p-1 mb-1.5"
            aria-label="Reorder tab group"
          >
            <GripVertical className="size-3.5 text-muted-foreground/60" />
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0 mr-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <Layers className="size-3 text-sky-500" />
          <span>Tab Group</span>
        </div>

        {isHoveringHeader && (
          <span className="text-[10px] font-semibold text-sky-500 bg-sky-500/15 border border-sky-400/50 rounded-full px-2 py-0.5 shrink-0 select-none mb-1.5">
            + New tab here
          </span>
        )}

        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex items-end gap-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar h-full select-none cursor-default"
        >
          {tabSections.map((tab, idx) => {
            const isActive = tab.id === activeTabId;
            const isSelected = tab.id === selectedSectionId;
            const isOverThisTab = tabDragOverId === tab.id;
            return (
              <TabStripItem
                key={tab.id}
                tab={tab}
                index={idx}
                totalTabs={tabSections.length}
                isActive={isActive}
                isSelected={isSelected}
                isOverThisTab={isOverThisTab}
                groupId={groupId}
                disabled={disabled}
                onSelect={() => {
                  setActiveTabIdState(tab.id);
                  onSelectSection(tab.id);
                  onSelectField(null, null);
                }}
                onRemove={() => onRemoveSection(tab.id)}
                onReorderSections={onReorderSections}
                onConvertSectionZone={onConvertSectionZone}
                onMoveFieldAcrossSections={onMoveFieldAcrossSections}
                onDropPaletteItem={onDropPaletteItem}
                onDragOverTab={(tabId) => {
                  if (tabDragOverId !== tabId) {
                    setTabDragOverId(tabId);
                    if (tabHoverTimerRef.current) clearTimeout(tabHoverTimerRef.current);
                    tabHoverTimerRef.current = setTimeout(() => {
                      setActiveTabIdState(tabId);
                      onSelectSection(tabId);
                    }, 300);
                  }
                }}
                onDragLeaveTab={(tabId) => {
                  if (tabDragOverId === tabId) {
                    setTabDragOverId(null);
                    if (tabHoverTimerRef.current) {
                      clearTimeout(tabHoverTimerRef.current);
                      tabHoverTimerRef.current = null;
                    }
                  }
                }}
                onDropOnTab={() => {
                  setTabDragOverId(null);
                  if (tabHoverTimerRef.current) {
                    clearTimeout(tabHoverTimerRef.current);
                    tabHoverTimerRef.current = null;
                  }
                  setActiveTabIdState(tab.id);
                  onSelectSection(tab.id);
                }}
              />
            );
          })}
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-0.5 shrink-0 self-center">
          {onAddSection && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleAddTab}
              className="h-7 w-7 p-0 text-sky-600 dark:text-sky-400 hover:text-sky-500 hover:bg-sky-500/10 cursor-pointer shrink-0"
              title="Add a new tab"
              aria-label="Add a new tab to this tab group"
            >
              <Plus className="size-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              for (const t of tabSections) onRemoveSection(t.id);
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
            title="Remove entire tab group"
            aria-label="Remove entire tab group"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </nav>
  );
}
