"use client";

import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import * as React from "react";
import { getFieldColSpanClass, getGridColsClass } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../context/designer-context";
import { useGlobalDragReset } from "./canvas-chrome";
import { CanvasFieldCard } from "./canvas-field-card";

export interface CanvasSectionGridProps {
  section: FormSection;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveField?: (fieldId: string) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  disabled?: boolean;
  isNativeOver?: boolean;
  emptyLabel?: string;
}

/**
 * Universal 12-column sortable grid and droppable dropzone for form fields.
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
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sec-drop-${section.id}`,
    data: { type: "section-dropzone", sectionId: section.id },
    disabled,
  });

  const [internalNativeOver, setInternalNativeOver] = React.useState(false);
  const [dropInsertIndex, setDropInsertIndex] = React.useState<number | null>(null);
  const [dndInsertIndex, setDndInsertIndex] = React.useState<number | null>(null);
  const [draggedField, setDraggedField] = React.useState<FormSection["fields"][number] | null>(
    null,
  );
  const gridContainerRef = React.useRef<HTMLDivElement | null>(null);

  const fieldKeys = React.useMemo(
    () => section.fields.map((f, idx) => String(f.SN || f.NAME || `field-${idx}`)),
    [section.fields],
  );

  const updateDndInsert = React.useCallback(
    (event: {
      active: {
        data: { current?: Record<string, unknown> };
        rect: { current: { translated: { top: number; height: number } | null } };
      };
      over: {
        id: string | number;
        data: { current?: Record<string, unknown> };
        rect: { top: number; height: number };
      } | null;
    }) => {
      if (disabled) return;
      const activeData = event.active.data.current;
      const overData = event.over?.data.current;
      if (activeData?.type !== "field" || activeData.sectionId === section.id) {
        if (dndInsertIndex !== null) setDndInsertIndex(null);
        return;
      }
      if (overData?.sectionId !== section.id) {
        if (dndInsertIndex !== null) setDndInsertIndex(null);
        return;
      }
      if (overData?.type === "field") {
        const overId = String(event.over?.id);
        const idx = section.fields.findIndex(
          (f, i) => fieldKeys[i] === overId || String(f.NAME || "") === overId,
        );
        if (idx === -1) {
          setDndInsertIndex(section.fields.length);
          return;
        }
        // When hovering the bottom half of the last card, place indicator at the bottom of the list
        const translated = event.active.rect.current.translated;
        const overRect = event.over?.rect;
        if (
          idx === section.fields.length - 1 &&
          translated &&
          overRect &&
          translated.top + translated.height / 2 > overRect.top + overRect.height / 2
        ) {
          setDndInsertIndex(section.fields.length);
        } else {
          setDndInsertIndex(idx);
        }
      } else if (overData?.type === "section-dropzone") {
        const translated = event.active.rect.current.translated;
        const cards = gridContainerRef.current?.querySelectorAll<HTMLElement>("[data-field-card]");
        const lastRect =
          cards && cards.length > 0 ? cards[cards.length - 1].getBoundingClientRect() : null;
        const isBelowLast =
          translated && lastRect ? translated.top + translated.height / 2 > lastRect.bottom : false;
        if (dndInsertIndex === null || isBelowLast) {
          setDndInsertIndex(section.fields.length);
        }
      } else {
        setDndInsertIndex(null);
      }
    },
    [disabled, dndInsertIndex, fieldKeys, section.fields, section.id],
  );

  useDndMonitor({
    onDragStart(event) {
      const activeData = event.active.data.current;
      if (activeData?.type === "field") {
        setDraggedField((activeData.field as FormSection["fields"][number]) ?? null);
      }
    },
    onDragOver: updateDndInsert,
    onDragMove: updateDndInsert,
    onDragEnd() {
      setDndInsertIndex(null);
      setDraggedField(null);
    },
    onDragCancel() {
      setDndInsertIndex(null);
      setDraggedField(null);
    },
  });

  useGlobalDragReset(
    React.useCallback(() => {
      setInternalNativeOver(false);
      setDropInsertIndex(null);
      setDndInsertIndex(null);
      setDraggedField(null);
    }, []),
  );

  const activeInsertIndex = internalNativeOver
    ? dropInsertIndex
    : dndInsertIndex !== null
      ? dndInsertIndex
      : externalNativeOver
        ? section.fields.length
        : null;
  const showHover = isOver || externalNativeOver || internalNativeOver || dndInsertIndex !== null;
  const isEmpty = section.fields.length === 0;
  const numCols = section.columns || 1;
  const placeholderColClass = draggedField
    ? getFieldColSpanClass(numCols, draggedField.WIDTH, draggedField.LENGTH, draggedField.TYPE)
    : getFieldColSpanClass(numCols, "md");

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!internalNativeOver) setInternalNativeOver(true);

    // Keep slot stable while pointer rests on the rendered placeholder box
    if ((e.target as HTMLElement | null)?.closest("[data-drop-placeholder]")) {
      return;
    }

    if (section.fields.length === 0) {
      setDropInsertIndex(0);
      return;
    }

    const gridEl = gridContainerRef.current;
    if (!gridEl) {
      setDropInsertIndex(section.fields.length);
      return;
    }

    const fieldCards = gridEl.querySelectorAll<HTMLElement>("[data-field-card]");
    if (fieldCards.length === 0) {
      setDropInsertIndex(section.fields.length);
      return;
    }

    const pointerX = e.clientX;
    const pointerY = e.clientY;
    let computedIndex = section.fields.length;

    for (let i = 0; i < fieldCards.length; i++) {
      const rect = fieldCards[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const midX = rect.left + rect.width / 2;

      // Pointer is strictly above this card row
      if (pointerY < rect.top) {
        computedIndex = i;
        break;
      }

      // Pointer is within this card row
      if (pointerY <= rect.bottom) {
        if (numCols === 1) {
          // In 1 column layout: top half = before card; bottom half = after card
          if (pointerY < midY) {
            computedIndex = i;
            break;
          }
          computedIndex = i + 1;
          continue;
        }

        // Multi-column layout: left half = before card; right half = after card
        if (pointerX < midX) {
          computedIndex = i;
          break;
        }
        computedIndex = i + 1;
      }
    }

    setDropInsertIndex(computedIndex);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setInternalNativeOver(false);
      setDropInsertIndex(null);
    }
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalIndex = dropInsertIndex !== null ? dropInsertIndex : section.fields.length;
    setInternalNativeOver(false);
    setDropInsertIndex(null);
    if (disabled || !onDropPaletteItem) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) onDropPaletteItem(JSON.parse(dataStr), section.id, finalIndex);
    } catch {
      /* ignore */
    }
  };

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
                  {isDropTargetHere && (
                    <div
                      data-drop-placeholder="true"
                      className={cn(
                        "border-2 border-dashed border-primary bg-primary/10 text-primary rounded-md h-9 flex items-center justify-center gap-1.5 text-2xs font-medium shadow-xs pointer-events-none",
                        placeholderColClass,
                      )}
                    >
                      <Plus className="size-3.5" />
                      <span>Drop field here</span>
                    </div>
                  )}
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
              <div
                data-drop-placeholder="true"
                className={cn(
                  "border-2 border-dashed border-primary bg-primary/10 text-primary rounded-md h-9 flex items-center justify-center gap-1.5 text-2xs font-medium shadow-xs pointer-events-none",
                  placeholderColClass,
                )}
              >
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
