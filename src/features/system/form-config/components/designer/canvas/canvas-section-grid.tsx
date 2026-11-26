"use client";

import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import * as React from "react";
import { getFieldColSpanClass, getGridColsClass } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../context/designer-context";
import { CanvasFieldCard } from "./canvas-field-card";
import type { PaletteDragPayload, PaletteDropTarget } from "./drag-payload";
import { useSectionDropSlot } from "./use-section-drop-slot";

export interface CanvasSectionGridProps {
  section: FormSection;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField?: (fieldId: string) => void;
  onDropPaletteItem?: (payload: PaletteDragPayload, target: PaletteDropTarget) => void;
  disabled?: boolean;
  isNativeOver?: boolean;
  emptyLabel?: string;
}

/**
 * Sortable 1 to 4 column grid and droppable dropzone for a section's fields.
 * Shared across CardContainer and TabGroup sections.
 */
export function CanvasSectionGrid(props: CanvasSectionGridProps) {
  const context = useDesignerContext();
  const { section, isNativeOver: externalNativeOver, emptyLabel } = props;
  const selectedFieldId =
    props.selectedFieldId !== undefined ? props.selectedFieldId : context.selectedFieldId;
  const onSelectSection = props.onSelectSection ?? context.handleCanvasSelectSection;
  const onSelectField = props.onSelectField ?? context.handleCanvasSelectField;
  const onRemoveField = props.onRemoveField ?? context.onRemoveField;
  const onDropPaletteItem = props.onDropPaletteItem ?? context.handleDropPaletteItem;
  const disabled = props.disabled ?? context.disabled;
  const {
    fieldKeys,
    numCols,
    setDropRef,
    gridContainerRef,
    activeInsertIndex,
    showHover,
    placeholderColClass,
    dropHandlers,
  } = useSectionDropSlot({
    section,
    disabled,
    externalNativeOver,
    onDropPaletteItem,
  });
  const isEmpty = section.fields.length === 0;

  const defaultEmptyText =
    section.containerType === "tab"
      ? "No fields placed in this tab yet — drag variables from the left palette"
      : "No fields in this card yet — drag variables from the left palette";

  return (
    <SortableContext items={fieldKeys} strategy={rectSortingStrategy}>
      <section
        aria-label={`Fields in ${section.groupTitle || section.title || "section"}`}
        ref={setDropRef}
        data-canvas-section-grid="true"
        data-section-id={section.id}
        {...dropHandlers}
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
            <p className="text-2xs text-muted-foreground/80 mt-1">
              Drag variables from the left palette to place them inside
            </p>
          </button>
        ) : (
          <div
            ref={gridContainerRef}
            className={cn(
              "grid gap-2 rounded-md transition-colors",
              getGridColsClass(numCols),
              activeInsertIndex !== null && "ring-1 ring-primary/40 bg-primary/5 p-0.5 -m-0.5",
            )}
          >
            {section.fields.map((field, idx) => {
              const fieldId = fieldKeys[idx];
              const isSelected =
                selectedFieldId === fieldId ||
                selectedFieldId === field.SN ||
                selectedFieldId === field.NAME;
              const isDropTargetHere = activeInsertIndex === idx;

              return (
                <React.Fragment key={fieldId}>
                  {isDropTargetHere && <DropPlaceholder className={placeholderColClass} />}
                  <CanvasFieldCard
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
                </React.Fragment>
              );
            })}

            {/* Active Drop Placeholder Slot at End of Grid */}
            {activeInsertIndex !== null && activeInsertIndex >= section.fields.length && (
              <DropPlaceholder className={placeholderColClass} />
            )}
          </div>
        )}
      </section>
    </SortableContext>
  );
}

/** The slot a dragged field would take, sized like the field. */
function DropPlaceholder({ className }: { className: string }) {
  return (
    <div
      data-drop-placeholder="true"
      className={cn(
        "border-2 border-dashed border-primary bg-primary/10 text-primary rounded-md h-9 flex items-center justify-center gap-1.5 text-2xs font-medium shadow-xs pointer-events-none",
        className,
      )}
    >
      <Plus className="size-3.5" />
      <span>Drop field here</span>
    </div>
  );
}
