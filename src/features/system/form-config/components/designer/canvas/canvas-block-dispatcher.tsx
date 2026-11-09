"use client";

import type { RenderBlock } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { SortableSectionCard } from "../sortable-section-card";
import { SortableTabGroupCard } from "../tab-group-card";
import type { AddSectionFn } from "./canvas-types";

export interface CanvasBlockDispatcherProps {
  block: RenderBlock;
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
    targetType: "card" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
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
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  isCanvasDragging?: boolean;
  disabled?: boolean;
}

/**
 * Dispatches canvas block rendering for Single Section Cards and Tab Groups.
 */
export function CanvasBlockDispatcher({
  block,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onRemoveField,
  onConvertSectionZone,
  onReorderSections,
  onMoveFieldAcrossSections,
  onDropPaletteItem,
  onMergeTabGroup,
  isCanvasDragging = false,
  disabled,
}: CanvasBlockDispatcherProps) {
  if (block.type === "single") {
    return (
      <SortableSectionCard
        section={block.section}
        isSecSelected={selectedSectionId === block.section.id}
        selectedFieldId={selectedFieldId}
        onSelectSection={onSelectSection}
        onSelectField={onSelectField}
        onUpdateSection={onUpdateSection}
        onRemoveSection={onRemoveSection}
        onRemoveField={onRemoveField}
        onConvertSectionZone={onConvertSectionZone}
        onDropPaletteItem={onDropPaletteItem}
        disabled={disabled}
      />
    );
  }

  if (block.type === "tab-group") {
    return (
      <SortableTabGroupCard
        groupId={block.groupId}
        tabSections={block.tabSections}
        selectedSectionId={selectedSectionId}
        selectedFieldId={selectedFieldId}
        onSelectSection={onSelectSection}
        onSelectField={onSelectField}
        onAddSection={onAddSection}
        onUpdateSection={onUpdateSection}
        onRemoveSection={onRemoveSection}
        onRemoveField={onRemoveField}
        onConvertSectionZone={onConvertSectionZone}
        onReorderSections={onReorderSections}
        onMoveFieldAcrossSections={onMoveFieldAcrossSections}
        onDropPaletteItem={onDropPaletteItem}
        onMergeTabGroup={onMergeTabGroup}
        isCanvasDragging={isCanvasDragging}
        disabled={disabled}
      />
    );
  }

  return null;
}
