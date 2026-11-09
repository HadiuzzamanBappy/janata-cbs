"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
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
  const showHover = isOver || externalNativeOver || internalNativeOver;
  const isEmpty = section.fields.length === 0;
  const numCols = section.columns || 1;

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setInternalNativeOver(true);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalNativeOver(false);
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
      : "No fields yet — drag variables here";

  return (
    <SortableContext items={fieldKeys} strategy={rectSortingStrategy}>
      <section
        aria-label={`Fields in ${section.groupTitle || section.title || "section"}`}
        ref={setDropRef}
        onDragOver={handleNativeDragOver}
        onDragLeave={handleNativeDragLeave}
        onDrop={handleNativeDrop}
        className={cn(
          "transition-all rounded",
          isEmpty && [
            "min-h-12 flex items-center justify-center border border-dashed text-xs text-muted-foreground/60",
            showHover
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border/60",
          ],
          !isEmpty && showHover && "bg-primary/5 ring-1 ring-primary/20 rounded",
        )}
      >
        {isEmpty ? (
          <button
            type="button"
            onClick={() => onSelectSection(section.id)}
            className="w-full h-full py-3.5 bg-transparent border-0 text-xs text-muted-foreground/60 cursor-pointer"
          >
            {showHover ? "↓ Drop field here" : emptyLabel || defaultEmptyText}
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
          </div>
        )}
      </section>
    </SortableContext>
  );
}
