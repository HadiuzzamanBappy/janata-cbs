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
import { buildRenderBlocks, getBlockGapSectionIndex } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import { BlockDragOverlay } from "./canvas/block-drag-overlay";
import { CanvasBlockFlow } from "./canvas/canvas-block-flow";
import { CanvasCompactBar } from "./canvas/canvas-compact-bar";
import type { DesignerCanvasProps } from "./canvas/canvas-types";
import { EmptyCanvasSplash } from "./canvas/empty-canvas-splash";
import { useCanvasDrag } from "./canvas/use-canvas-drag";

export type { AddSectionFn, DesignerCanvasProps } from "./canvas/canvas-types";

/**
 * DesignerCanvas: Core visual drag-and-drop workspace for CBS Form Designer.
 * Orchestrates independent layout blocks (Standalone Fields, Cards, TabGroups).
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
  const [activeGapIndex, setActiveGapIndex] = React.useState<number | null>(null);
  const scrollContainerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsCanvasDragOver(false);
      setActiveGapIndex(null);
    };
    window.addEventListener("dragend", handleGlobalDragEnd, true);
    window.addEventListener("drop", handleGlobalDragEnd, true);
    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd, true);
      window.removeEventListener("drop", handleGlobalDragEnd, true);
    };
  }, []);

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
    if (disabled) return;
    setIsCanvasDragOver(true);

    if (blocks.length === 0) {
      setActiveGapIndex(0);
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const blockNodes = container.querySelectorAll<HTMLElement>("[data-canvas-block]");
    if (blockNodes.length === 0) {
      setActiveGapIndex(blocks.length);
      return;
    }

    const pointerY = e.clientY;
    let computedGap = blocks.length;

    for (let i = 0; i < blockNodes.length; i++) {
      const rect = blockNodes[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (pointerY < midY) {
        computedGap = i;
        break;
      }
    }

    setActiveGapIndex(computedGap);
  };

  const handleNativeCanvasDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsCanvasDragOver(false);
      setActiveGapIndex(null);
    }
  };

  const handleNativeCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const finalGap = activeGapIndex !== null ? activeGapIndex : blocks.length;
    setIsCanvasDragOver(false);
    setActiveGapIndex(null);
    if (disabled) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === "canvas-tab" && parsed.sectionId && onConvertSectionZone) {
          onConvertSectionZone(parsed.sectionId, "card");
          return;
        }
        if (onDropPaletteItem) {
          const sectionInsertIndex = getBlockGapSectionIndex(blocks, sections, finalGap);
          onDropPaletteItem(parsed, undefined, sectionInsertIndex);
        }
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
        ref={scrollContainerRef}
        aria-label="Form designer canvas workspace"
        className={cn(
          "flex-1 overflow-y-auto px-2 sm:px-3 pt-1 pb-3 select-none transition-colors",
          isCanvasDragOver && "bg-primary/5 ring-1 ring-primary/40",
        )}
        onDragOver={handleNativeCanvasDragOver}
        onDragLeave={handleNativeCanvasDragLeave}
        onDrop={handleNativeCanvasDrop}
        onClick={() => {
          onClickBackground?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClickBackground?.();
          }
        }}
      >
        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={(event) => {
            setActiveGapIndex(null);
            setIsCanvasDragOver(false);
            handleDragEnd(event);
          }}
          onDragCancel={() => {
            setActiveGapIndex(null);
            setIsCanvasDragOver(false);
            setActiveDragItem(null);
          }}
        >
          <SortableContext items={sortableCardIds} strategy={verticalListSortingStrategy}>
            <CanvasBlockFlow
              blocks={blocks}
              sections={sections}
              selectedSectionId={selectedSectionId}
              selectedFieldId={selectedFieldId}
              activeGapIndex={activeGapIndex}
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
          </SortableContext>

          <BlockDragOverlay activeDragItem={activeDragItem} />
        </DndContext>
      </section>
    </div>
  );
}
