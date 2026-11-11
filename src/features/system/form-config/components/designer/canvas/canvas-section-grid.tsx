"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import * as React from "react";
import { getFieldColSpanClass, getGridColsClass } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { DesignerFieldCard } from "./designer-field-card";

export interface CanvasSectionGridProps {
  section: FormSection;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField: (fieldId: string) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
  isNativeOver?: boolean;
  emptyLabel?: string;
}

/**
 * Universal 12-column sortable grid and droppable dropzone for form fields.
 * Shared across CardContainer and TabGroup sections.
 */
export function CanvasSectionGrid({
  section,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onRemoveField,
  onDropPaletteItem,
  disabled,
  isNativeOver: externalNativeOver,
  emptyLabel,
}: CanvasSectionGridProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sec-drop-${section.id}`,
    data: { type: "section-dropzone", sectionId: section.id },
    disabled,
  });

  const [internalNativeOver, setInternalNativeOver] = React.useState(false);

  React.useEffect(() => {
    const handleReset = () => setInternalNativeOver(false);
    window.addEventListener("dragend", handleReset);
    window.addEventListener("drop", handleReset);
    return () => {
      window.removeEventListener("dragend", handleReset);
      window.removeEventListener("drop", handleReset);
    };
  }, []);

  const showHover = isOver || externalNativeOver || internalNativeOver;
  const isEmpty = section.fields.length === 0;
  const numCols = section.columns || 1;

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !internalNativeOver) setInternalNativeOver(true);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setInternalNativeOver(false);
    }
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalNativeOver(false);
    if (disabled || !onDropPaletteItem) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) onDropPaletteItem(JSON.parse(dataStr), section.id);
    } catch {
      /* ignore */
    }
  };

  const fieldKeys = section.fields.map((f) => String(f.SN || f.NAME || "field"));

  const defaultEmptyText =
    section.containerType === "tab"
      ? "No fields placed in this tab yet — drag variables from the left palette"
      : "No fields in this card yet — drag variables from the left palette";

  return (
    <SortableContext items={fieldKeys} strategy={rectSortingStrategy}>
      <section
        aria-label={`Fields in ${section.groupTitle || section.title || "section"}`}
        ref={setDropRef}
        onDragOver={handleNativeDragOver}
        onDragLeave={handleNativeDragLeave}
        onDrop={handleNativeDrop}
        className="w-full transition-all rounded select-none"
      >
        {isEmpty ? (
          <button
            type="button"
            onClick={() => onSelectSection(section.id)}
            className={cn(
              "w-full min-h-20 sm:min-h-24 flex flex-col items-center justify-center p-3 text-center border-2 border-dashed rounded-lg transition-all cursor-pointer",
              showHover
                ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-xs"
                : "border-border/60 bg-muted/5 text-muted-foreground hover:border-primary/40",
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Plus
                className={cn("size-3.5", showHover ? "text-primary" : "text-muted-foreground")}
              />
              <span>
                {showHover ? "Release to drop field here" : emptyLabel || defaultEmptyText}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-1">
              Drag variables from the left palette to place them inside
            </p>
          </button>
        ) : (
          <div className={cn("grid gap-2", getGridColsClass(numCols))}>
            {section.fields.map((field) => {
              const fieldId = String(field.SN || field.NAME || "field");
              const isSelected =
                selectedFieldId === fieldId ||
                selectedFieldId === field.SN ||
                selectedFieldId === field.NAME;

              return (
                <DesignerFieldCard
                  key={fieldId}
                  field={field}
                  sectionId={section.id}
                  isSelected={Boolean(isSelected)}
                  className={getFieldColSpanClass(numCols, field.WIDTH, field.LENGTH, field.TYPE)}
                  onSelect={() => {
                    onSelectSection(section.id);
                    onSelectField(section.id, fieldId);
                  }}
                  onRemove={() => onRemoveField(fieldId)}
                  disabled={disabled}
                />
              );
            })}

            {/* Active Drop Placeholder Slot at End of Grid */}
            {showHover && (
              <div className="border-2 border-dashed border-primary bg-primary/10 text-primary rounded-md h-9 flex items-center justify-center gap-1.5 text-[11px] font-medium animate-pulse shadow-xs">
                <Plus className="size-3.5" />
                <span>Drop field here</span>
              </div>
            )}
          </div>
        )}
      </section>
    </SortableContext>
  );
}
