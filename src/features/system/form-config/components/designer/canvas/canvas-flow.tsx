"use client";

import * as React from "react";
import { getBlockGapSectionIndex, type RenderBlock } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas/form-engine-schema";
import { useDesignerContext } from "../context/designer-context";
import { CardContainerBlock, StandaloneFieldBlock } from "./canvas-card-blocks";
import { CanvasGapIndicator } from "./canvas-gap-indicator";
import type { AddSectionFn } from "./canvas-types";
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
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  disabled?: boolean;
}

export type CanvasBlockFlowProps = CanvasFlowProps;

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

  const handleDropAtGap = (payload: unknown, gapIndex: number) => {
    if (onDropPaletteItem) {
      const sectionInsertIndex = getBlockGapSectionIndex(blocks, sections, gapIndex);
      onDropPaletteItem(payload, undefined, sectionInsertIndex);
    }
  };

  return (
    <div className="flex flex-col min-h-full pt-0 pb-2">
      {/* 1. Top insertion placement slot */}
      <CanvasGapIndicator
        id="gap-top"
        gapIndex={0}
        isActive={activeGapIndex === 0}
        onDropItem={handleDropAtGap}
        disabled={disabled}
      />

      {/* 2. Dynamic independent blocks */}
      {blocks.map((block, idx) => {
        const nextGapIndex = idx + 1;

        if (block.type === "tab-group") {
          return (
            <React.Fragment key={`tab-group-${block.groupId}`}>
              <div data-canvas-block={idx} className="w-full">
                <TabGroupBlock
                  groupId={block.groupId}
                  tabSections={block.tabSections}
                  isCanvasDragging={isCanvasDragging}
                />
              </div>
              <CanvasGapIndicator
                id={`gap-${nextGapIndex}`}
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
                id={`gap-${nextGapIndex}`}
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
              id={`gap-${nextGapIndex}`}
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

export { CanvasFlow as CanvasBlockFlow };
