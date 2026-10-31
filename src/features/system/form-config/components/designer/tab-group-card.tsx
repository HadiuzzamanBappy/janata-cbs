"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Layers, Plus, Trash2, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { AddSectionFn } from "./canvas-types";
import { DesignerFieldCard } from "./designer-field-card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SortableTabGroupCardProps {
  groupId: string;
  tabSections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onRemoveField: (fieldId: string) => void;
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
  /** Called to merge all tabs from sourceGroupId into targetGroupId */
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  isCanvasDragging?: boolean;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Active-tab droppable body (fields only)
// ---------------------------------------------------------------------------
interface TabDropBodyProps {
  section: FormSection;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField: (fieldId: string) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
}

function TabDropBody({
  section,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onRemoveField,
  onDropPaletteItem,
  disabled,
}: TabDropBodyProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sec-drop-${section.id}`,
    data: { type: "section-dropzone", sectionId: section.id },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);
  const showHover = isOver || isNativeOver;
  const isEmpty = section.fields.length === 0;
  const numCols = section.columns || 1;

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsNativeOver(true);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeOver(false);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeOver(false);
    if (disabled || !onDropPaletteItem) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) onDropPaletteItem(JSON.parse(dataStr), section.id);
    } catch {
      /* ignore */
    }
  };

  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      default:
        return "grid-cols-1";
    }
  };

  const getFieldColSpanClass = (cols: number, width?: unknown) => {
    if (cols <= 1) return "w-full";
    const token = typeof width === "string" ? width.toLowerCase().trim() : "";
    if (token === "full") return "col-span-full w-full";
    if (token === "lg" && cols >= 3) return "col-span-2 w-full";
    if (typeof width === "number" && width >= 400) return "col-span-2 w-full";
    return "col-span-1 w-full";
  };

  const fieldKeys = section.fields.map((f) => f.id || f.NAME || String(f.SN || "field"));

  return (
    <SortableContext items={fieldKeys} strategy={rectSortingStrategy}>
      <section
        aria-label={`Fields in tab ${section.tabTitle || section.title}`}
        ref={setDropRef}
        onDragOver={handleNativeDragOver}
        onDragLeave={handleNativeDragLeave}
        onDrop={handleNativeDrop}
        className={cn(
          "transition-all rounded",
          isEmpty && [
            "min-h-13 flex items-center justify-center border border-dashed text-xs text-muted-foreground/60",
            showHover
              ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium"
              : "border-border/60 bg-muted/5",
          ],
          !isEmpty && showHover && "bg-sky-500/5 ring-1 ring-sky-500/20",
        )}
      >
        {isEmpty ? (
          <button
            type="button"
            onClick={() => onSelectSection(section.id)}
            className="w-full h-full py-4 bg-transparent border-0 text-xs text-muted-foreground/60 cursor-pointer"
          >
            {showHover
              ? "↓ Drop field here"
              : "No fields placed in this tab yet — drag variables or click from the left palette."}
          </button>
        ) : (
          <div className={cn("grid gap-2", getGridColsClass(numCols))}>
            {section.fields.map((field) => {
              const fieldId = field.id || field.NAME || String(field.SN || "field");
              const isSelected =
                selectedFieldId === fieldId ||
                selectedFieldId === field.NAME ||
                selectedFieldId === field.SN;

              return (
                <DesignerFieldCard
                  key={fieldId}
                  field={field}
                  sectionId={section.id}
                  isSelected={Boolean(isSelected)}
                  className={getFieldColSpanClass(numCols, field.WIDTH)}
                  onSelect={() => {
                    onSelectSection(section.id);
                    onSelectField(section.id, fieldId);
                  }}
                  onRemove={() => onRemoveField(fieldId)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        )}
      </section>
    </SortableContext>
  );
}

// ---------------------------------------------------------------------------
// Helpers: detect what kind of dragged item it is
// ---------------------------------------------------------------------------
type DragPayload = Record<string, unknown>;

function isTabGroupPayload(p: DragPayload): boolean {
  return (
    p.type === "palette-tabgroup" ||
    (p.type === "palette-container" && p.zone === "tab") ||
    p.zone === "tab"
  );
}

function isContainerPayload(p: DragPayload): boolean {
  return (
    p.type === "palette-container" ||
    ["standard", "object-group", "array-table"].includes(String(p.containerType || ""))
  );
}

// ---------------------------------------------------------------------------
// Single Tab Bar Item matching Workbench AppTabBar
// ---------------------------------------------------------------------------
interface TabStripItemProps {
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

function TabStripItem({
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
          {/* Universal Number Badge: hidden on hover when Detach icon shows */}
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
export function SortableTabGroupCard({
  groupId,
  tabSections,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onAddSection,
  onRemoveSection,
  onRemoveField,
  onConvertSectionZone,
  onReorderSections,
  onMoveFieldAcrossSections,
  onDropPaletteItem,
  onMergeTabGroup,
  isCanvasDragging = false,
  disabled,
}: SortableTabGroupCardProps) {
  const firstSection = tabSections[0];
  const [activeTabIdState, setActiveTabIdState] = React.useState<string>(firstSection?.id || "");

  const selectedTabInGroup = tabSections.find((s) => s.id === selectedSectionId);
  const activeSection =
    selectedTabInGroup || tabSections.find((s) => s.id === activeTabIdState) || tabSections[0];
  const activeTabId = activeSection?.id || "";

  const primaryId = firstSection ? firstSection.id : groupId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: primaryId,
    data: { type: "section", section: firstSection },
    disabled,
  });

  // "header" = dragging over the tab strip → will create new tab
  // "body"   = dragging over the tab body → container becomes new tab, field goes inside
  const [dropZone, setDropZone] = React.useState<"header" | "body" | null>(null);
  const isHoveringHeader = dropZone === "header" && isCanvasDragging;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  // Tab reordering & hover-switch state
  const [tabDragOverId, setTabDragOverId] = React.useState<string | null>(null);
  const tabHoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view when activeTabId changes
  React.useEffect(() => {
    if (activeTabId && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
    }
  }, [activeTabId]);

  // Convert Vertical Wheel Scroll to Horizontal Tab Scroll and lock vertical movement
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      scrollRef.current.scrollTop = 0;
    }
  };

  // Clean up any pending hover-switch timer on unmount and reset drag states on window events
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
  }, []);

  // When dnd-kit ends drag or canvas is not dragging, force clear any stuck dropZone state
  React.useEffect(() => {
    if (!isCanvasDragging) {
      setDropZone(null);
      setTabDragOverId(null);
    }
  }, [isCanvasDragging]);

  // ── Header handlers ────────────────────────────────────────────────────────
  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDropZone("header");
  };

  const handleHeaderDragLeave = (e: React.DragEvent) => {
    // Only clear when truly leaving the header element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone((z) => (z === "header" ? null : z));
      setTabDragOverId(null);
    }
  };

  const handleHeaderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropZone(null);
    setTabDragOverId(null);
    if (disabled) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr) as DragPayload;

      // Tab dragged from another group or reordering
      if (parsed.type === "canvas-tab" && typeof parsed.sectionId === "string") {
        if (parsed.tabGroupId === groupId) {
          // Same group drop on header without specific tab target
          return;
        }
        // Different tab group -> move tab to this group
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

      // Existing canvas card dropped on tab header -> convert into tab of this group!
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

      // Tab-group dragged onto header → merge
      if (isTabGroupPayload(parsed) && parsed.tabGroupId !== groupId) {
        if (parsed.tabGroupId) {
          onMergeTabGroup?.(String(parsed.tabGroupId), groupId);
          return;
        }
      }

      // Any container from palette → new tab in this group
      if (onDropPaletteItem) {
        const n = tabSections.length + 1;
        const title = String(parsed.title || parsed.tabTitle || `Tab ${n}`);
        onDropPaletteItem(
          { ...parsed, zone: "tab", tabGroupId: groupId, title, tabTitle: title },
          "new-tab-in-group",
        );
      }
    } catch {
      /* ignore */
    }
  };

  // ── Body handlers ──────────────────────────────────────────────────────────
  const handleBodyDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDropZone("body");
  };

  const handleBodyDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone((z) => (z === "body" ? null : z));
    }
  };

  const handleBodyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropZone(null);
    if (disabled || !onDropPaletteItem) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr) as DragPayload;

      // Tab-group → body → merge
      if (isTabGroupPayload(parsed) && parsed.tabGroupId !== groupId) {
        if (parsed.tabGroupId) {
          onMergeTabGroup?.(String(parsed.tabGroupId), groupId);
          return;
        }
      }

      // Container → body → becomes a new tab in this group
      if (isContainerPayload(parsed)) {
        const n = tabSections.length + 1;
        const title = String(parsed.title || `Tab ${n}`);
        onDropPaletteItem(
          {
            ...parsed,
            type: "palette-container",
            containerType: parsed.containerType || "standard",
            zone: "tab",
            tabGroupId: groupId,
            title,
            tabTitle: title,
          },
          "new-tab-in-group",
        );
        return;
      }

      // Field/variable → drop inside the active tab body
      onDropPaletteItem(parsed, activeSection?.id);
    } catch {
      /* ignore */
    }
  };

  const handleAddTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !onAddSection) return;
    const n = tabSections.length + 1;
    const title = `Tab ${n}`;
    onAddSection("standard", "tab", [], "card", title, groupId, title);
  };

  const isAnyTabSelected = tabSections.some((s) => s.id === selectedSectionId);

  return (
    <section
      aria-label="Tab group container"
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-all relative shadow-2xs mb-3.5",
        isAnyTabSelected && "border-sky-500/80 ring-1 ring-sky-500/30",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* ── Tab Strip Header — drop here = NEW TAB ────────────────────────── */}
      <nav
        aria-label="Tab navigation strip"
        onDragOver={handleHeaderDragOver}
        onDragLeave={handleHeaderDragLeave}
        onDrop={handleHeaderDrop}
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

          {/* Drop preview pill – shown only while actively hovering header */}
          {isHoveringHeader && (
            <span className="text-[10px] font-semibold text-sky-500 bg-sky-500/15 border border-sky-400/50 rounded-full px-2 py-0.5 shrink-0 select-none mb-1.5">
              + New tab here
            </span>
          )}

          {/* Tab buttons - styled like AppTabBar with wheel scroll & auto-scroll */}
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

        {/* Right actions: Add Tab icon button + Delete Tab Group button */}
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

      {/* ── Active Tab Body — drop container here = NEW TAB, drop field = inside ── */}
      {activeSection && (
        <section
          aria-label={`Tab content for ${activeSection.tabTitle || activeSection.title}`}
          onDragOver={handleBodyDragOver}
          onDragLeave={handleBodyDragLeave}
          onDrop={handleBodyDrop}
          className={cn(
            "p-2.5 bg-card/40 transition-all",
            dropZone === "body" && "bg-emerald-500/5 ring-2 ring-inset ring-emerald-500/30",
          )}
        >
          {dropZone === "body" && (
            <div className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-400/40 rounded px-2 py-1 mb-2 text-center select-none">
              Container → new tab · Field → inside
            </div>
          )}

          <TabDropBody
            section={activeSection}
            selectedFieldId={selectedFieldId}
            onSelectSection={onSelectSection}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            onDropPaletteItem={onDropPaletteItem}
            disabled={disabled}
          />
        </section>
      )}
    </section>
  );
}
