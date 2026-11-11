"use client";

import * as React from "react";
import { getBlockGapSectionIndex, type RenderBlock } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { CardContainerBlock } from "./blocks/card-container-block";
import { StandaloneFieldBlock } from "./blocks/standalone-field-block";
import { TabGroupBlock } from "./blocks/tab-group-block";
import type { AddSectionFn } from "./canvas-types";
import { InsertionIndicator } from "./insertion-indicator";

export interface CanvasBlockFlowProps {
  blocks: RenderBlock[];
  sections: FormSection[];
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  activeGapIndex?: number | null;
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
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  isCanvasDragging?: boolean;
  disabled?: boolean;
}

/**
 * Universal Canvas Block Flow.
 * Renders the vertical, open flow of independent blocks (Standalone Fields,
 * Cards, and Tab Groups) interleaved with live insertion placement indicators.
 */
export function CanvasBlockFlow({
  blocks,
  sections,
  selectedSectionId,
  selectedFieldId,
  activeGapIndex,
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
  isCanvasDragging,
  disabled,
}: CanvasBlockFlowProps) {
  const handleDropAtGap = (payload: unknown, gapIndex: number) => {
    if (onDropPaletteItem) {
      const sectionInsertIndex = getBlockGapSectionIndex(blocks, sections, gapIndex);
      onDropPaletteItem(payload, undefined, sectionInsertIndex);
    }
  };

  return (
    <div className="flex flex-col min-h-full py-1">
      {/* 1. Top insertion placement slot */}
      <InsertionIndicator
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
                  selectedSectionId={selectedSectionId}
                  selectedFieldId={selectedFieldId}
                  onSelectSection={onSelectSection}
                  onSelectField={onSelectField}
                  onAddSection={onAddSection}
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
              </div>
              <InsertionIndicator
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
                <StandaloneFieldBlock
                  section={sec}
                  selectedFieldId={selectedFieldId}
                  onSelectSection={onSelectSection}
                  onSelectField={onSelectField}
                  onRemoveSection={onRemoveSection}
                  onRemoveField={onRemoveField}
                  disabled={disabled}
                />
              </div>
              <InsertionIndicator
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
              <CardContainerBlock
                section={sec}
                isSecSelected={selectedSectionId === sec.id}
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
            </div>
            <InsertionIndicator
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
