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
import { BlockDragOverlay, CanvasCompactBar, EmptyCanvasSplash } from "./canvas/canvas-chrome";
import { CanvasFlow } from "./canvas/canvas-flow";
import type { DesignerCanvasProps } from "./canvas/canvas-types";
import { useCanvasDrag } from "./canvas/use-canvas-drag";
import { useDesignerContext } from "./context/designer-context";

export type { AddSectionFn, DesignerCanvasProps } from "./canvas/canvas-types";

/**
 * DesignerCanvas: Core visual drag-and-drop workspace for CBS Form Designer.
 * Orchestrates independent layout blocks (Standalone Fields, Cards, TabGroups).
 */
export function DesignerCanvas(props: DesignerCanvasProps = {}) {
  const context = useDesignerContext();

  const sections = props.sections ?? context.sections;
  const onReorderFields = props.onReorderFields ?? context.onReorderFields;
  const onMoveFieldAcrossSections =
    props.onMoveFieldAcrossSections ?? context.onMoveFieldAcrossSections;
  const onReorderSections = props.onReorderSections ?? context.onReorderSections;
  const onConvertSectionZone = props.onConvertSectionZone ?? context.onConvertSectionZone;
  const onDropPaletteItem = props.onDropPaletteItem ?? context.handleDropPaletteItem;
  const onClickBackground = props.onClickBackground ?? context.handleCanvasBackgroundClick;
  const onMergeTabGroup = props.onMergeTabGroup ?? context.onMergeTabGroup;
  const disabled = props.disabled ?? context.disabled;
  const isCompact = props.isCompact ?? context.isCompact;
  const isPaletteOpen = props.isPaletteOpen ?? context.isPaletteOpen;
  const onTogglePalette = props.onTogglePalette ?? context.togglePalette;
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

    // 1. If dragging directly over an internal container dropzone (card, section grid, tab header, field card),
    // clear activeGapIndex so no between-block insertion line shows simultaneously.
    const target = e.target as HTMLElement | null;
    const isInsideContainerDropZone = Boolean(
      target?.closest(
        "[data-canvas-card], [data-tab-group-container], [data-canvas-section-grid], [data-tab-header], [data-field-card]",
      ),
    );

    if (isInsideContainerDropZone) {
      setActiveGapIndex(null);
      return;
    }

    // 2. If hovering directly over a gap indicator, activate that specific gap.
    const gapElem = target?.closest<HTMLElement>("[data-canvas-gap]");
    if (gapElem) {
      const gapIdx = Number(gapElem.getAttribute("data-gap-index"));
      if (!Number.isNaN(gapIdx)) {
        setActiveGapIndex(gapIdx);
        return;
      }
    }

    // 3. Coordinate-based gap detection for empty canvas margins / between blocks.
    const blockNodes = container.querySelectorAll<HTMLElement>("[data-canvas-block]");
    if (blockNodes.length === 0) {
      setActiveGapIndex(blocks.length);
      return;
    }

    const pointerY = e.clientY;
    const firstRect = blockNodes[0].getBoundingClientRect();
    const lastRect = blockNodes[blockNodes.length - 1].getBoundingClientRect();

    // Above the first block -> top gap (0)
    if (pointerY <= firstRect.top + 8) {
      setActiveGapIndex(0);
      return;
    }

    // Below the last block -> bottom gap (blocks.length)
    if (pointerY >= lastRect.bottom - 8) {
      setActiveGapIndex(blocks.length);
      return;
    }

    // Between adjacent blocks
    const GAP_SNAP_BUFFER = 16;
    for (let i = 0; i < blockNodes.length - 1; i++) {
      const currentBottom = blockNodes[i].getBoundingClientRect().bottom;
      const nextTop = blockNodes[i + 1].getBoundingClientRect().top;

      if (pointerY >= currentBottom - GAP_SNAP_BUFFER && pointerY <= nextTop + GAP_SNAP_BUFFER) {
        setActiveGapIndex(i + 1);
        return;
      }
    }

    // Pointer is squarely inside a block body that is not a dropzone
    setActiveGapIndex(null);
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

    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-canvas-section-grid], [data-tab-header]")) {
      return;
    }

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
          onClickBackground={onClickBackground}
          onDragOver={handleNativeCanvasDragOver}
          onDragLeave={handleNativeCanvasDragLeave}
          onDrop={handleNativeCanvasDrop}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
      {isCompact && <CanvasCompactBar />}

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
            <CanvasFlow
              blocks={blocks}
              activeGapIndex={activeGapIndex}
              isCanvasDragging={isDragging}
            />
          </SortableContext>

          <BlockDragOverlay activeDragItem={activeDragItem} />
        </DndContext>
      </section>
    </div>
  );
}
