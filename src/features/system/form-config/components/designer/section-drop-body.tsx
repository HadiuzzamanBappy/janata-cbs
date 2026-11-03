"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { getFieldColSpanClass, getGridColsClass } from "@/features/form-engine/utils/section-utils";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { DesignerFieldCard } from "./designer-field-card";

export interface SectionDropBodyProps {
  section: FormSection;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField: (fieldId: string) => void;
  disabled?: boolean;
  isPlainRoot?: boolean;
  isNativeOver?: boolean;
}

export function SectionDropBody({
  section,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onRemoveField,
  disabled,
  isPlainRoot,
  isNativeOver,
}: SectionDropBodyProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sec-drop-${section.id}`,
    data: { type: "section-dropzone", sectionId: section.id },
    disabled,
  });

  const isEmpty = section.fields.length === 0;
  const showHover = isOver || isNativeOver;
  const numCols = section.columns || 1;

  const fieldKeys = section.fields.map((f) => String(f.SN || f.NAME || "field"));

  return (
    <SortableContext items={fieldKeys} strategy={rectSortingStrategy}>
      <div
        ref={setDropRef}
        className={cn(
          "transition-all rounded",
          isEmpty && [
            "min-h-11.5 flex items-center justify-center border border-dashed text-[11px] text-muted-foreground/60",
            showHover
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border/60",
            isPlainRoot && "bg-muted/5 py-4 min-h-14",
          ],
          !isEmpty && showHover && "bg-primary/5 ring-1 ring-primary/20 rounded",
        )}
      >
        {isEmpty ? (
          <button
            type="button"
            onClick={() => onSelectSection(section.id)}
            className="w-full h-full py-3 bg-transparent border-0 text-[11px] text-muted-foreground/60 cursor-pointer"
          >
            {showHover
              ? "↓ Drop here"
              : isPlainRoot
                ? "Drop variables here to place directly on canvas"
                : "No fields yet — drag variables here"}
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
      </div>
    </SortableContext>
  );
}
