"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { buildRenderBlocks } from "@/features/form-engine/utils/section-utils";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { BetweenBlockDropZone } from "./canvas/between-block-drop-zone";
import { CanvasRootDropzone } from "./canvas/canvas-root-dropzone";
import type { DesignerCanvasProps } from "./canvas/canvas-types";
import { EmptyCanvasSplash } from "./canvas/empty-canvas-splash";
import { useCanvasDrag } from "./canvas/use-canvas-drag";
import { SortableSectionCard } from "./sortable-section-card";
import { SortableTabGroupCard } from "./tab-group-card";

export type { AddSectionFn, DesignerCanvasProps } from "./canvas/canvas-types";

export function DesignerCanvas({
  sections,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onRemoveField,
  onReorderFields,
  onMoveFieldAcrossSections,
  onReorderSections,
  onConvertSectionZone,
  onDropPaletteItem,
  onClickBackground,
  onMergeTabGroup,
  disabled,
}: DesignerCanvasProps) {
  const [isCanvasDragOver, setIsCanvasDragOver] = React.useState(false);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const blocks = React.useMemo(() => buildRenderBlocks(sections), [sections]);
  const sortableCardIds = React.useMemo(
    () =>
      blocks.map((b) => (b.type === "single" ? b.section.id : b.tabSections[0]?.id || b.groupId)),
    [blocks],
  );

  const {
    activeDragItem,
    setActiveDragItem,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useCanvasDrag({
    sections,
    blocks,
    disabled,
    onMoveFieldAcrossSections,
    onReorderFields,
    onReorderSections,
    onConvertSectionZone,
    onMergeTabGroup,
  });

  const handleNativeCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsCanvasDragOver(true);
  };

  const handleNativeCanvasDragLeave = () => setIsCanvasDragOver(false);

  const handleNativeCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCanvasDragOver(false);
    if (disabled) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === "canvas-tab" && parsed.sectionId && onConvertSectionZone) {
          onConvertSectionZone(parsed.sectionId, "standard");
          return;
        }
        if (onDropPaletteItem) onDropPaletteItem(parsed);
      }
    } catch {
      /* ignore */
    }
  };

  const totalFieldsCount = sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0);
  const hasContainersOrFields =
    sections.length > 0 &&
    (totalFieldsCount > 0 || sections.some((s) => s.layoutStyle !== "plain" && Boolean(s.title)));

  if (!hasContainersOrFields) {
    return (
      <EmptyCanvasSplash
        isOver={isCanvasDragOver}
        onAddSection={onAddSection}
        onClickBackground={() => {
          onSelectSection(null);
          onSelectField(null, null);
        }}
        onDragOver={handleNativeCanvasDragOver}
        onDragLeave={handleNativeCanvasDragLeave}
        onDrop={handleNativeCanvasDrop}
        disabled={disabled}
      />
    );
  }

  return (
    <section
      aria-label="Form designer canvas workspace"
      className={cn(
        "flex-1 overflow-y-auto p-3 select-none transition-colors",
        isCanvasDragOver && "bg-primary/5 ring-1 ring-primary/40",
      )}
      onDragOver={handleNativeCanvasDragOver}
      onDragLeave={handleNativeCanvasDragLeave}
      onDrop={handleNativeCanvasDrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClickBackground?.();
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget)
          onClickBackground?.();
      }}
    >
      <DndContext
        sensors={dndSensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragItem(null)}
      >
        <SortableContext items={sortableCardIds} strategy={verticalListSortingStrategy}>
          <BetweenBlockDropZone
            id="gap-top"
            gapIndex={0}
            isActive={isDragging}
            onDropPaletteItem={onDropPaletteItem}
            onConvertSectionZone={onConvertSectionZone}
            disabled={disabled}
          />

          {blocks.map((block, i) => (
            <React.Fragment key={block.type === "single" ? block.section.id : block.groupId}>
              {block.type === "single" ? (
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
              ) : (
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
                  isCanvasDragging={isDragging}
                  disabled={disabled}
                />
              )}

              <BetweenBlockDropZone
                id={`gap-${i}`}
                gapIndex={i + 1}
                isActive={isDragging}
                onDropPaletteItem={onDropPaletteItem}
                onConvertSectionZone={onConvertSectionZone}
                disabled={disabled}
              />
            </React.Fragment>
          ))}
        </SortableContext>

        <CanvasRootDropzone
          onDropPaletteItem={onDropPaletteItem}
          onConvertSectionZone={onConvertSectionZone}
          disabled={disabled}
        />

        <DragOverlay>
          {activeDragItem?.type === "field" ? (
            <div className="rounded border px-2 py-1.5 flex items-center justify-between text-xs bg-card shadow-xl ring-2 ring-primary border-primary">
              <span className="font-semibold text-foreground truncate">
                {(activeDragItem.data as FormElement).LABEL}
              </span>
              <Badge variant="outline" className="text-[9px] h-3.5 px-1 uppercase ml-2">
                {(activeDragItem.data as FormElement).TYPE}
              </Badge>
            </div>
          ) : activeDragItem?.type === "section" ? (
            <div className="rounded border p-3 bg-card shadow-2xl ring-2 ring-primary border-primary text-xs font-semibold uppercase">
              {(activeDragItem.data as FormSection).title || "Section"}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
