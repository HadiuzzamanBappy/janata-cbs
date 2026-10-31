"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import { TabDropBody } from "./tab-group/tab-drop-body";
import { TabGroupHeader } from "./tab-group/tab-group-header";
import type { SortableTabGroupCardProps } from "./tab-group/tab-group-types";
import { useTabGroupDrop } from "./tab-group/use-tab-group-drop";

export type { SortableTabGroupCardProps };

export function SortableTabGroupCard({
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
}: SortableTabGroupCardProps) {
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

  const isAnyTabSelected = tabSections.some((s) => s.id === selectedSectionId);

  return (
    <section
      aria-label="Tab group container"
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-all relative shadow-2xs mb-3.5",
        isAnyTabSelected && "border-sky-500/80 ring-1 ring-sky-500/30",
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
        <section
          aria-label={`Tab content for ${activeSection.tabTitle || activeSection.title}`}
          onDragOver={handleBodyDragOver}
          onDragLeave={handleBodyDragLeave}
          onDrop={handleBodyDrop}
          className={cn(
            "p-2.5 bg-card/40 transition-all",
            dropZone === "body" && "bg-emerald-500/5 ring-2 ring-inset ring-emerald-500/30",
          )}
        >
          {dropZone === "body" && (
            <div className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-400/40 rounded px-2 py-1 mb-2 text-center select-none">
              Container → new tab · Field → inside
            </div>
          )}

          <TabDropBody
            section={activeSection}
            selectedFieldId={selectedFieldId}
            onSelectSection={onSelectSection}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            onDropPaletteItem={onDropPaletteItem}
            disabled={disabled}
          />
        </section>
      )}
    </section>
  );
}
