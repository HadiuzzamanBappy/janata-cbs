"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers, Plus, Trash2, X } from "lucide-react";
import * as React from "react";
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
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Active-tab droppable body
// ---------------------------------------------------------------------------
interface TabDropBodyProps {
  section: FormSection;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField: (fieldId: string) => void;
  disabled?: boolean;
  isNativeOver?: boolean;
}

function TabDropBody({
  section,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onRemoveField,
  disabled,
  isNativeOver,
}: TabDropBodyProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sec-drop-${section.id}`,
    data: { type: "section-dropzone", sectionId: section.id },
    disabled,
  });

  const isEmpty = section.fields.length === 0;
  const showHover = isOver || isNativeOver;
  const numCols = section.columns || 1;

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

  const getFieldColSpanClass = (cols: number, width?: number) => {
    if (cols <= 1) {
      return "w-full";
    }
    if (width && width >= 400) {
      return "col-span-2 w-full";
    }
    return "col-span-1 w-full";
  };

  const fieldKeys = section.fields.map((f) => f.id || f.NAME || String(f.SN || "field"));

  return (
    <SortableContext items={fieldKeys} strategy={rectSortingStrategy}>
      <div
        ref={setDropRef}
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
      </div>
    </SortableContext>
  );
}

// ---------------------------------------------------------------------------
// SortableTabGroupCard
// ---------------------------------------------------------------------------
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
  onDropPaletteItem,
  disabled,
}: SortableTabGroupCardProps) {
  const firstSection = tabSections[0];
  const [activeTabIdState, setActiveTabIdState] = React.useState<string>(firstSection?.id || "");

  // If a tab in this group is externally selected, activate it visually
  const selectedTabInGroup = tabSections.find((s) => s.id === selectedSectionId);
  const activeSection =
    selectedTabInGroup || tabSections.find((s) => s.id === activeTabIdState) || tabSections[0];
  const activeTabId = activeSection?.id || "";

  // Sortable uses first section's ID as the group's drag handle
  const primaryId = firstSection ? firstSection.id : groupId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: primaryId,
    data: { type: "section", section: firstSection },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

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
    if (disabled || !onDropPaletteItem || !activeTabId) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) onDropPaletteItem(JSON.parse(dataStr), activeTabId);
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
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      className={cn(
        "rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-all relative shadow-2xs mb-3.5",
        isAnyTabSelected && "border-sky-500/80 ring-1 ring-sky-500/30",
        isNativeOver && "ring-2 ring-sky-500/60 border-sky-500 bg-sky-500/5",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* ── Tab Strip Header ─────────────────────────────────────────────── */}
      <div className="bg-muted/30 border-b border-border/70 px-2 py-1 flex items-center justify-between gap-2">
        {/* Left: drag handle + group label + tabs + add-tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1 py-0.5">
          {!disabled && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground/50 hover:text-foreground shrink-0 p-0.5"
              aria-label="Reorder tab group"
            >
              <GripVertical className="size-3.5 text-muted-foreground/60" />
            </button>
          )}

          <div className="flex items-center gap-1 shrink-0 mr-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Layers className="size-3 text-sky-500" />
            <span>Tab Group</span>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 min-w-0 flex-wrap">
            {tabSections.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isSelected = tab.id === selectedSectionId;
              return (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-0.5 px-2.5 py-1 rounded text-xs transition-all border shrink-0",
                    isActive
                      ? "bg-background border-border text-foreground font-semibold shadow-2xs"
                      : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    isSelected &&
                      "ring-1 ring-sky-500 border-sky-500/50 text-sky-600 dark:text-sky-400",
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTabIdState(tab.id);
                      onSelectSection(tab.id);
                      onSelectField(null, null);
                    }}
                    className="bg-transparent border-0 p-0 cursor-pointer text-xs font-inherit text-inherit flex items-center gap-1.5"
                  >
                    <span>{tab.tabTitle || tab.title || "Tab"}</span>
                    {tab.fields.length > 0 && (
                      <span className="text-[10px] px-1 rounded-full bg-muted text-muted-foreground font-mono">
                        {tab.fields.length}
                      </span>
                    )}
                  </button>

                  {!disabled && tabSections.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSection(tab.id);
                      }}
                      className="text-muted-foreground/60 hover:text-destructive p-0.5 rounded cursor-pointer ml-0.5"
                      title="Remove tab"
                      aria-label={`Remove tab ${tab.tabTitle || tab.title}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {!disabled && onAddSection && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddTab}
                className="h-6 px-2 text-[11px] gap-1 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 cursor-pointer shrink-0"
                title="Add a tab to this group"
              >
                <Plus className="size-3" />
                <span>Add Tab</span>
              </Button>
            )}
          </div>
        </div>

        {/* Right: delete entire group */}
        {!disabled && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              for (const t of tabSections) onRemoveSection(t.id);
            }}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
            title="Remove entire tab group"
            aria-label="Remove entire tab group"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      {/* ── Active Tab Body ───────────────────────────────────────────────── */}
      {activeSection && (
        <div className="p-2.5 bg-card/40">
          <div className="text-[11px] font-medium text-muted-foreground/70 mb-2 flex items-center justify-between">
            <span>
              Fields in{" "}
              <strong className="text-foreground">
                {activeSection.tabTitle || activeSection.title}
              </strong>
              :
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono">
                {activeSection.fields.length}{" "}
                {activeSection.fields.length === 1 ? "field" : "fields"}
              </span>
              {onConvertSectionZone && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvertSectionZone(activeSection.id, "standard");
                  }}
                  className="px-1.5 py-0.5 rounded border border-border/70 hover:border-border hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  title="Move this tab out to the canvas as an independent card"
                >
                  Detach to Card &rarr;
                </button>
              )}
            </div>
          </div>

          <TabDropBody
            section={activeSection}
            selectedFieldId={selectedFieldId}
            onSelectSection={onSelectSection}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            disabled={disabled}
            isNativeOver={isNativeOver}
          />
        </div>
      )}
    </section>
  );
}
