"use client";

import * as React from "react";
import { getBlockGapSectionIndex, type RenderBlock } from "@/lib/cbs-form-spec";
import type { DesignerDragPayload, FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../context/designer-context";
import { CardContainerBlock } from "./canvas-card-container-block";
import { CanvasGapIndicator } from "./canvas-gap-indicator";
import { StandaloneFieldBlock } from "./canvas-standalone-field-block";
import type { AddSectionFn, ConvertSectionZoneFn } from "./canvas-types";
import type { PaletteDragPayload, PaletteDropTarget } from "./drag-payload";
import { TabGroupBlock } from "./tab-group/tab-group-block";

export interface CanvasFlowProps {
  blocks: RenderBlock[];
  activeGapIndex?: number | null;
  isCanvasDragging?: boolean;
  // Optional overrides (fallback to useDesignerContext)
  sections?: FormSection[];
  selectedSectionId?: string | null;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onAddSection?: AddSectionFn;
  onUpdateSection?: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection?: (id: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onConvertSectionZone?: ConvertSectionZoneFn;
  onReorderSections?: (activeId: string, overId: string, insertIndex?: number) => void;
  onMoveFieldAcrossSections?: (
    sourceSecId: string,
    targetSecId: string,
    fieldId: string,
    targetFieldId?: string,
    insertAtIndex?: number,
  ) => void;
  onDropPaletteItem?: (payload: PaletteDragPayload, target: PaletteDropTarget) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  disabled?: boolean;
}

/**
 * Universal Canvas Flow.
 * Renders the vertical, open flow of independent blocks (Standalone Fields,
 * Cards, and Tab Groups) interleaved with live insertion placement indicators.
 */
export function CanvasFlow(props: CanvasFlowProps) {
  const context = useDesignerContext();
  const { blocks, activeGapIndex, isCanvasDragging } = props;

  const sections = props.sections ?? context.sections;
  const onDropPaletteItem = props.onDropPaletteItem ?? context.handleDropPaletteItem;
  const disabled = props.disabled ?? context.disabled;

  const onConvertSectionZone = props.onConvertSectionZone ?? context.onConvertSectionZone;

  // A tab dropped on a gap leaves its group as a card there, the same as on the canvas background
  const handleDropAtGap = (payload: DesignerDragPayload, gapIndex: number) => {
    const insertIndex = getBlockGapSectionIndex(blocks, sections, gapIndex);
    if (payload.type === "canvas-tab") {
      onConvertSectionZone?.(payload.sectionId, "card", { insertIndex });
      return;
    }
    onDropPaletteItem?.(payload, { kind: "canvas", insertIndex });
  };

  return (
    <div className="flex flex-col min-h-full pt-0 pb-2">
      {/* 1. Top insertion placement slot */}
      <CanvasGapIndicator
        gapIndex={0}
        isActive={activeGapIndex === 0}
        onDropItem={handleDropAtGap}
        disabled={disabled}
      />

      {/* 2. Dynamic independent blocks */}
      {blocks.map((block, idx) => {
        const nextGapIndex = idx + 1;

        if (block.type === "tab-group") {
          const firstTabId = block.tabSections[0]?.id || "";
          return (
            <React.Fragment key={`tab-group-${block.groupId}-${firstTabId}-${idx}`}>
              <div data-canvas-block={idx} className="w-full">
                <TabGroupBlock
                  groupId={block.groupId}
                  tabSections={block.tabSections}
                  isCanvasDragging={isCanvasDragging}
                />
              </div>
              <CanvasGapIndicator
                gapIndex={nextGapIndex}
                isActive={activeGapIndex === nextGapIndex}
                onDropItem={handleDropAtGap}
                disabled={disabled}
              />
            </React.Fragment>
          );
        }

        // Single Block: Determine if Standalone Field or Card Container
        const sec = block.section;
        const isStandalone = !sec.title?.trim() && (sec.fields?.length || 0) <= 1;

        if (isStandalone) {
          return (
            <React.Fragment key={`standalone-${sec.id}`}>
              <div data-canvas-block={idx} className="w-full">
                <StandaloneFieldBlock section={sec} />
              </div>
              <CanvasGapIndicator
                gapIndex={nextGapIndex}
                isActive={activeGapIndex === nextGapIndex}
                onDropItem={handleDropAtGap}
                disabled={disabled}
              />
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={`card-${sec.id}`}>
            <div data-canvas-block={idx} className="w-full">
              <CardContainerBlock section={sec} />
            </div>
            <CanvasGapIndicator
              gapIndex={nextGapIndex}
              isActive={activeGapIndex === nextGapIndex}
              onDropItem={handleDropAtGap}
              disabled={disabled}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
