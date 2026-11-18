"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../../context/designer-context";
import { CanvasSectionGrid } from "../canvas-section-grid";
import { selectableProps } from "../selectable";
import { TabGroupHeader } from "./tab-group-header";
import { useTabGroupDrop } from "./use-tab-group-drop";

export interface TabGroupBlockProps {
  groupId: string;
  tabSections: FormSection[];
  selectedSectionId?: string | null;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  isCanvasDragging?: boolean;
  disabled?: boolean;
}

/**
 * Tab Group Block.
 * Renders an independent multi-page tabbed container block on the canvas.
 */
export function TabGroupBlock(props: TabGroupBlockProps) {
  const context = useDesignerContext();
  const { groupId, tabSections, isCanvasDragging = false } = props;
  const selectedSectionId =
    props.selectedSectionId !== undefined ? props.selectedSectionId : context.selectedSectionId;
  const selectedFieldId =
    props.selectedFieldId !== undefined ? props.selectedFieldId : context.selectedFieldId;
  const onSelectSection = props.onSelectSection ?? context.handleCanvasSelectSection;
  const onSelectField = props.onSelectField ?? context.handleCanvasSelectField;
  const disabled = props.disabled ?? context.disabled;
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
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isGroupContainerSelected =
    Boolean(selectedSectionId) &&
    tabSections.some((s) => s.id === selectedSectionId) &&
    !selectedFieldId &&
    context.tabScope === "container";

  const groupConfig = React.useMemo(() => {
    const configuredTab = tabSections.find(
      (t) =>
        t.containerConfig?.tabVariant ||
        t.containerConfig?.heightMode ||
        t.containerConfig?.minHeight,
    );
    return configuredTab?.containerConfig || activeSection?.containerConfig || {};
  }, [tabSections, activeSection]);

  const tabVariant = groupConfig.tabVariant || "card";
  const heightMode = groupConfig.heightMode || "auto";
  const minHeightVal =
    heightMode === "fixed" && groupConfig.minHeight
      ? typeof groupConfig.minHeight === "number"
        ? `${groupConfig.minHeight}px`
        : groupConfig.minHeight
      : undefined;

  const containerVariantClass = {
    card: "rounded-lg border border-border/80 bg-card/60 shadow-2xs",
    workbench: "rounded-none border-b border-border/80 bg-transparent shadow-none",
    pills: "rounded-lg border border-border/60 bg-muted/20 shadow-2xs",
  }[tabVariant];

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(minHeightVal ? { minHeight: minHeightVal } : {}),
  };

  return (
    <section
      data-tab-group-container="true"
      aria-label="Tab group container"
      ref={setNodeRef}
      style={mergedStyle}
      {...selectableProps(() => {
        if (activeSection) {
          onSelectSection(activeSection.id);
          onSelectField(activeSection.id, null);
          context.setTabScope("container");
        }
      }, isGroupContainerSelected)}
      className={cn(
        containerVariantClass,
        heightMode === "fill" && "min-h-[350px]",
        "overflow-hidden transition-all relative first:mt-0 my-1",
        isGroupContainerSelected && "border-primary/80 ring-2 ring-primary/40",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      <TabGroupHeader
        groupId={groupId}
        tabSections={tabSections}
        activeTabId={activeTabId}
        isCanvasDragging={isCanvasDragging}
        dropZone={dropZone}
        attributes={attributes}
        listeners={listeners}
        onHeaderDragOver={handleHeaderDragOver}
        onHeaderDragLeave={handleHeaderDragLeave}
        onHeaderDrop={handleHeaderDrop}
        setActiveTabIdState={setActiveTabIdState}
        setDropZone={setDropZone}
      />

      {activeSection && (
        <section
          aria-label="Tab content drop zone"
          onDragOver={handleBodyDragOver}
          onDragLeave={handleBodyDragLeave}
          onDrop={handleBodyDrop}
          className={cn("p-2.5 transition-colors", dropZone === "body" && "bg-primary/5")}
        >
          <CanvasSectionGrid section={activeSection} isNativeOver={dropZone === "body"} />
        </section>
      )}
    </section>
  );
}
