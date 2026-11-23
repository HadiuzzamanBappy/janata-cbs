"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { GripVertical, Layers, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../../context/designer-context";
import { useGlobalDragReset } from "../canvas-chrome";
import type { AddSectionFn } from "../canvas-types";
import { TabStripItem } from "./tab-strip-item";

export interface TabGroupHeaderProps {
  groupId: string;
  tabSections: FormSection[];
  activeTabId: string;
  selectedSectionId?: string | null;
  disabled?: boolean;
  isCanvasDragging?: boolean;
  dropZone: "header" | "body" | null;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onRemoveSection?: (id: string) => void;
  onHeaderDragOver: (e: React.DragEvent) => void;
  onHeaderDragLeave: (e: React.DragEvent) => void;
  onHeaderDrop: (e: React.DragEvent) => void;
  setActiveTabIdState: (id: string) => void;
  setDropZone: (zone: "header" | "body" | null) => void;
}

export function TabGroupHeader(props: TabGroupHeaderProps) {
  const context = useDesignerContext();
  const {
    groupId,
    tabSections,
    activeTabId,
    dropZone,
    attributes,
    listeners,
    isCanvasDragging,
    onHeaderDragOver,
    onHeaderDragLeave,
    onHeaderDrop,
    setActiveTabIdState,
    setDropZone,
  } = props;

  const selectedSectionId =
    props.selectedSectionId !== undefined ? props.selectedSectionId : context.selectedSectionId;
  const onSelectSection = props.onSelectSection ?? context.handleCanvasSelectSection;
  const onSelectField = props.onSelectField ?? context.handleCanvasSelectField;
  const onAddSection = props.onAddSection ?? context.onAddSection;
  const onRemoveSection = props.onRemoveSection ?? context.onRemoveSection;
  const disabled = props.disabled ?? context.disabled;
  const isHoveringHeader = dropZone === "header" && isCanvasDragging;
  const isGroupContainerSelected =
    Boolean(selectedSectionId) &&
    tabSections.some((s) => s.id === selectedSectionId) &&
    context.tabScope === "container";
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

  useGlobalDragReset(
    React.useCallback(() => {
      setDropZone(null);
      setTabDragOverId(null);
      if (tabHoverTimerRef.current) clearTimeout(tabHoverTimerRef.current);
    }, [setDropZone]),
  );

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
    onAddSection("tab", [], title, groupId, title);
  };

  return (
    <nav
      aria-label="Tab navigation strip"
      data-tab-header="true"
      onDragOver={onHeaderDragOver}
      onDragLeave={onHeaderDragLeave}
      onDrop={onHeaderDrop}
      className={cn(
        "bg-muted/40 border-b border-border/70 px-2 pt-0 pb-0 flex items-end justify-between gap-2 transition-all h-9",
        isHoveringHeader && "bg-primary/15 ring-2 ring-inset ring-primary/70 border-primary",
      )}
    >
      <div className="flex items-end gap-1.5 min-w-0 flex-1 h-full">
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

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectSection(activeTabId);
            onSelectField(null, null);
            context.setTabScope("container");
          }}
          className={cn(
            "flex items-center gap-1 shrink-0 mr-1 text-3xs font-semibold uppercase tracking-wider mb-1.5 px-2 py-0.5 rounded transition-all cursor-pointer",
            isGroupContainerSelected
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80 bg-background/60 border border-border/60",
          )}
          title="Click to select Tab Group Container properties"
        >
          <Layers className="size-3 text-info" />
        </button>

        {isHoveringHeader && (
          <span className="text-3xs font-semibold text-info bg-info/15 border border-info/50 rounded-full px-2 py-0.5 shrink-0 select-none mb-1.5">
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
                  context.setTabScope("item");
                }}
                onRemove={() => onRemoveSection(tab.id)}
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleAddTab}
            className="h-7 w-7 p-0 text-info hover:text-info/80 hover:bg-info/10 cursor-pointer shrink-0"
            title="Add a new tab"
            aria-label="Add a new tab to this tab group"
          >
            <Plus className="size-3.5" />
          </Button>

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
