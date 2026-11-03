"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import * as React from "react";
import { getFieldColSpanClass, getGridColsClass } from "@/features/form-engine/utils/section-utils";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { DesignerFieldCard } from "../designer-field-card";

export interface TabDropBodyProps {
  section: FormSection;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField: (fieldId: string) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
}

export function TabDropBody({
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

  const fieldKeys = section.fields.map((f) => String(f.SN || f.NAME || "field"));

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
