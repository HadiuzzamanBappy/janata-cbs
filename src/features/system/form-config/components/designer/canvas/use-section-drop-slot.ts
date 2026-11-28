"use client";

import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { getFieldColSpanClass } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas";
import { useGlobalDragReset } from "./canvas-chrome";
import { type PaletteDragPayload, type PaletteDropTarget, readDragPayload } from "./drag-payload";
import { dropsAfterLastField } from "./use-canvas-drag";

export interface SectionDropSlotOptions {
  section: FormSection;
  disabled?: boolean;
  /** A parent (tab strip, card header) reports a native drag over the whole section. */
  externalNativeOver?: boolean;
  onDropPaletteItem?: (payload: PaletteDragPayload, target: PaletteDropTarget) => void;
}

/**
 * Where a dragged field would land in a section's grid: tracks dnd-kit moves from other
 * sections and native palette drags, and drops palette items at that slot.
 */
export function useSectionDropSlot({
  section,
  disabled,
  externalNativeOver,
  onDropPaletteItem,
}: SectionDropSlotOptions) {
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
        // The same rule the drop applies (use-canvas-drag): past the last card's middle means the end
        setDndInsertIndex(
          dropsAfterLastField(
            section.fields,
            overId,
            event.active.rect.current.translated,
            event.over?.rect,
          )
            ? section.fields.length
            : idx,
        );
      } else if (overData?.type === "section-dropzone") {
        // A drop on the section itself (not on a card) appends, so the indicator shows the end
        setDndInsertIndex(section.fields.length);
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
    const payload = readDragPayload(e);
    if (payload && payload.type !== "canvas-tab") {
      onDropPaletteItem(payload, {
        kind: "section",
        sectionId: section.id,
        insertIndex: finalIndex,
      });
    }
  };

  return {
    fieldKeys,
    numCols,
    setDropRef,
    gridContainerRef,
    activeInsertIndex,
    showHover,
    placeholderColClass,
    dropHandlers: {
      onDragOver: handleNativeDragOver,
      onDragLeave: handleNativeDragLeave,
      onDrop: handleNativeDrop,
    },
  };
}
