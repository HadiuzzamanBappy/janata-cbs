"use client";

import {
  closestCenter,
  DndContext,
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
import { PanelLeft } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { buildRenderBlocks } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import { BetweenBlockDropZone } from "./canvas/between-block-drop-zone";
import { CanvasBlockDispatcher } from "./canvas/canvas-block-dispatcher";
import { CanvasCompactBar } from "./canvas/canvas-compact-bar";
import { CanvasDragOverlay } from "./canvas/canvas-drag-overlay";
import type { DesignerCanvasProps } from "./canvas/canvas-types";
import { EmptyCanvasSplash } from "./canvas/empty-canvas-splash";
import { useCanvasDrag } from "./canvas/use-canvas-drag";

export type { AddSectionFn, DesignerCanvasProps } from "./canvas/canvas-types";

/**
 * DesignerCanvas: Core visual drag-and-drop workspace for CBS Form Designer.
 * Orchestrates layout blocks (Card, TabGroup) and Dnd-Kit sensors.
 */
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
  isCompact = false,
  isPaletteOpen = false,
  isInspectorOpen = false,
  hasSelection = false,
  onTogglePalette,
  onToggleInspector,
}: DesignerCanvasProps) {
  const [isCanvasDragOver, setIsCanvasDragOver] = React.useState(false);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const blocks = React.useMemo(() => buildRenderBlocks(sections), [sections]);
  const sortableCardIds = React.useMemo(
    () =>
      blocks.map((b) => {
        if (b.type === "single") return b.section.id;
        return b.tabSections[0]?.id || b.groupId;
      }),
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
          onConvertSectionZone(parsed.sectionId, "card");
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
    sections.length > 0 && (totalFieldsCount > 0 || sections.some((s) => Boolean(s.title)));

  if (!hasContainersOrFields) {
    return (
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {isCompact && (
          <div className="px-3 py-1.5 border-b border-border/70 bg-card/60 flex items-center justify-between shrink-0">
            <Button
              type="button"
              variant={isPaletteOpen ? "secondary" : "outline"}
              size="sm"
              onClick={onTogglePalette}
              className="h-7 text-xs px-2 gap-1.5 cursor-pointer font-medium"
            >
              <PanelLeft className="size-3.5" />
              <span>Palette</span>
            </Button>
            <span className="text-[11px] font-mono text-muted-foreground">Empty Canvas</span>
          </div>
        )}
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
      {isCompact && (
        <CanvasCompactBar
          sectionsCount={sections.length}
          totalFieldsCount={totalFieldsCount}
          isPaletteOpen={isPaletteOpen}
          isInspectorOpen={isInspectorOpen}
          hasSelection={hasSelection}
          onTogglePalette={onTogglePalette}
          onToggleInspector={onToggleInspector}
        />
      )}

      <section
        aria-label="Form designer canvas workspace"
        className={cn(
          "flex-1 overflow-y-auto p-2 sm:p-3 select-none transition-colors",
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
                <CanvasBlockDispatcher
                  block={block}
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

          <CanvasDragOverlay activeDragItem={activeDragItem} />
        </DndContext>
      </section>
    </div>
  );
}
