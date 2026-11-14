"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-engine-schema";
import { CanvasSectionGrid } from "../canvas-section-grid";
import type { AddSectionFn } from "../canvas-types";
import { TabGroupHeader } from "./tab-group/tab-group-header";
import { useTabGroupDrop } from "./tab-group/use-tab-group-drop";

export interface TabGroupBlockProps {
  groupId: string;
  tabSections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
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
 * Tab Group Block.
 * Renders an independent multi-page tabbed container block on the canvas.
 */
export function TabGroupBlock({
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
  onReorderSections,
  onMoveFieldAcrossSections,
  onDropPaletteItem,
  onMergeTabGroup,
  isCanvasDragging = false,
  disabled,
}: TabGroupBlockProps) {
  const firstSection = tabSections[0];
  const [activeTabIdState, setActiveTabIdState] = React.useState<string>(firstSection?.id || "");

  const selectedTabInGroup = tabSections.find((s) => s.id === selectedSectionId);
  const activeSection =
    selectedTabInGroup || tabSections.find((s) => s.id === activeTabIdState) || tabSections[0];
  const activeTabId = activeSection?.id || "";

  const primaryId = firstSection ? firstSection.id : groupId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: primaryId,
    data: { type: "section", section: firstSection },
    disabled,
  });

  const {
    dropZone,
    setDropZone,
    handleHeaderDragOver,
    handleHeaderDragLeave,
    handleHeaderDrop,
    handleBodyDragOver,
    handleBodyDragLeave,
    handleBodyDrop,
  } = useTabGroupDrop({
    groupId,
    tabSections,
    activeSection,
    disabled,
    onConvertSectionZone,
    onMergeTabGroup,
    onDropPaletteItem,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isGroupExplicitlySelected =
    Boolean(selectedSectionId) &&
    tabSections.some((s) => s.id === selectedSectionId) &&
    !selectedFieldId;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: canvas selectable container
    <section
      aria-label="Tab group container"
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (activeSection) {
          onSelectSection(activeSection.id);
          onSelectField(activeSection.id, null);
        }
      }}
      className={cn(
        "rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-all relative shadow-2xs first:mt-0 my-1",
        isGroupExplicitlySelected && "border-primary/80 ring-1 ring-primary/30",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      <TabGroupHeader
        groupId={groupId}
        tabSections={tabSections}
        activeTabId={activeTabId}
        selectedSectionId={selectedSectionId}
        disabled={disabled}
        isCanvasDragging={isCanvasDragging}
        dropZone={dropZone}
        attributes={attributes}
        listeners={listeners}
        onSelectSection={onSelectSection}
        onSelectField={onSelectField}
        onAddSection={onAddSection}
        onRemoveSection={onRemoveSection}
        onConvertSectionZone={onConvertSectionZone}
        onReorderSections={onReorderSections}
        onMoveFieldAcrossSections={onMoveFieldAcrossSections}
        onDropPaletteItem={onDropPaletteItem}
        onHeaderDragOver={handleHeaderDragOver}
        onHeaderDragLeave={handleHeaderDragLeave}
        onHeaderDrop={handleHeaderDrop}
        setActiveTabIdState={setActiveTabIdState}
        setDropZone={setDropZone}
      />

      {activeSection && (
        // biome-ignore lint/a11y/noStaticElementInteractions: droppable container body
        <div
          onDragOver={handleBodyDragOver}
          onDragLeave={handleBodyDragLeave}
          onDrop={handleBodyDrop}
          className={cn("p-2.5 transition-colors", dropZone === "body" && "bg-primary/5")}
        >
          <CanvasSectionGrid
            section={activeSection}
            selectedFieldId={selectedFieldId}
            onSelectSection={onSelectSection}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            onDropPaletteItem={onDropPaletteItem}
            isNativeOver={dropZone === "body"}
            disabled={disabled}
          />
        </div>
      )}
    </section>
  );
}
