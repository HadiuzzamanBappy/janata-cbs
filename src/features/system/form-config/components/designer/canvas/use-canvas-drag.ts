import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import * as React from "react";
import { getBlockGapSectionIndex, type RenderBlock } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { DesignerCanvasProps } from "./canvas-types";

export interface UseCanvasDragProps {
  sections: FormSection[];
  blocks: RenderBlock[];
  disabled?: boolean;
  onMoveFieldAcrossSections?: DesignerCanvasProps["onMoveFieldAcrossSections"];
  onReorderFields: DesignerCanvasProps["onReorderFields"];
  onReorderSections?: DesignerCanvasProps["onReorderSections"];
  onConvertSectionZone?: DesignerCanvasProps["onConvertSectionZone"];
  onMergeTabGroup?: DesignerCanvasProps["onMergeTabGroup"];
}

export function useCanvasDrag({
  sections,
  blocks,
  disabled,
  onMoveFieldAcrossSections,
  onReorderFields,
  onReorderSections,
  onConvertSectionZone,
  onMergeTabGroup,
}: UseCanvasDragProps) {
  const [activeDragItem, setActiveDragItem] = React.useState<{
    type: "field" | "section";
    data: FormElement | FormSection;
  } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const d = event.active.data.current;
    if (d?.type === "field") {
      setActiveDragItem({ type: "field", data: d.field as FormElement });
    } else if (d?.type === "section") {
      setActiveDragItem({ type: "section", data: d.section as FormSection });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Only reorder items on dragEnd, do not mutate sections in dragOver
    // to prevent premature field deletion or disappearance when hovering outside
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || disabled) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeData = active.data.current;
    const overData = over.data.current;

    // Field drag
    if (activeData?.type === "field") {
      const sourceSecId = activeData.sectionId as string;
      let targetSecId: string | undefined;
      let targetFieldId: string | undefined;
      let insertAtIndex: number | undefined;

      if (overData?.type === "field") {
        targetSecId = overData.sectionId as string;
        targetFieldId = overId;
      } else if (overData?.type === "section-dropzone") {
        targetSecId = overData.sectionId as string;
      } else if (overData?.type === "section") {
        targetSecId = overId;
      } else if (overData?.type === "canvas-root") {
        targetSecId = "canvas-root";
      } else if (overData?.type === "between-block-gap") {
        const gapIdx = overData.gapIndex as number;
        targetSecId = gapIdx <= 0 ? "gap-top" : `gap-${gapIdx}`;
        insertAtIndex = getBlockGapSectionIndex(blocks, sections, gapIdx);
      } else {
        // Dragged outside any known drop target: DO NOTHING, return safely
        return;
      }

      if (sourceSecId && targetSecId) {
        if (sourceSecId === targetSecId) {
          if (targetFieldId && targetFieldId !== activeId) {
            onReorderFields(sourceSecId, activeId, targetFieldId);
          }
        } else if (onMoveFieldAcrossSections) {
          onMoveFieldAcrossSections(
            sourceSecId,
            targetSecId,
            activeId,
            targetFieldId,
            insertAtIndex,
          );
        }
      }
      return;
    }

    // Section drag
    if (activeData?.type === "section") {
      const activeSec =
        (activeData.section as FormSection) || sections.find((s) => s.id === activeId);

      // Check tab-group merge or convert
      if (overData?.type === "section-dropzone" || overData?.type === "section") {
        const targetSecId =
          overData.type === "section-dropzone" ? (overData.sectionId as string) : overId;
        const targetSec = sections.find((s) => s.id === targetSecId);

        if (targetSec && targetSec.containerType === "tab") {
          if (
            activeSec &&
            activeSec.containerType === "tab" &&
            activeSec.groupId &&
            targetSec.groupId &&
            activeSec.groupId !== targetSec.groupId
          ) {
            onMergeTabGroup?.(activeSec.groupId, targetSec.groupId);
            return;
          }

          if (onConvertSectionZone && activeId !== String(targetSec.id)) {
            onConvertSectionZone(activeId, "tab", {
              groupId: targetSec.groupId,
              groupTitle: activeSec?.title || "New Tab",
            });
            return;
          }
        }
      }

      // Check between-block-gap reorder
      if (overData?.type === "between-block-gap" && onReorderSections) {
        const gapIndex = overData.gapIndex as number;
        if (gapIndex <= 0) {
          const firstSecId = sections[0]?.id;
          if (firstSecId) onReorderSections(activeId, firstSecId, 0);
        } else if (gapIndex >= blocks.length) {
          onReorderSections(activeId, "", sections.length);
        } else {
          const targetBlock = blocks[gapIndex];
          const targetSec =
            targetBlock.type === "single" ? targetBlock.section : targetBlock.tabSections[0];
          if (targetSec) {
            const rawTargetIndex = sections.findIndex((s) => s.id === targetSec.id);
            onReorderSections(
              activeId,
              targetSec.id,
              rawTargetIndex >= 0 ? rawTargetIndex : undefined,
            );
          }
        }
        return;
      }

      if (onReorderSections && activeId !== overId) {
        onReorderSections(activeId, overId);
      }
    }
  };

  return {
    activeDragItem,
    setActiveDragItem,
    isDragging: activeDragItem !== null,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
