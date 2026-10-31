"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Folder } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormElement, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { DesignerCanvasProps } from "./canvas-types";
import { SortableSectionCard } from "./section-card";
import { SortableTabGroupCard } from "./tab-group-card";

export type { DesignerCanvasProps } from "./canvas-types";

// ---------------------------------------------------------------------------
// Cluster sections into render-blocks preserving insertion order
// ---------------------------------------------------------------------------
type RenderBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] };

function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const seenTabGroups = new Map<string, FormSection[]>();

  for (const sec of sections) {
    if (sec.zone === "tab") {
      const grpId = sec.tabGroupId?.trim() || "default_tab_group";
      if (!seenTabGroups.has(grpId)) {
        const grpList: FormSection[] = [sec];
        seenTabGroups.set(grpId, grpList);
        blocks.push({ type: "tab-group", groupId: grpId, tabSections: grpList });
      } else {
        seenTabGroups.get(grpId)?.push(sec);
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// BetweenBlockDropZone — shown between blocks to allow dropping anywhere
// ---------------------------------------------------------------------------
interface BetweenBlockDropZoneProps {
  id: string;
  gapIndex: number;
  isActive: boolean;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  disabled?: boolean;
}

function BetweenBlockDropZone({
  id,
  gapIndex,
  isActive,
  onDropPaletteItem,
  onConvertSectionZone,
  disabled,
}: BetweenBlockDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "between-block-gap", gapId: id, gapIndex },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);

  // Reset native drag state whenever dragging stops or window cancels drag
  React.useEffect(() => {
    const handleDragReset = () => setIsNativeOver(false);
    window.addEventListener("dragend", handleDragReset);
    window.addEventListener("drop", handleDragReset);
    return () => {
      window.removeEventListener("dragend", handleDragReset);
      window.removeEventListener("drop", handleDragReset);
    };
  }, []);

  const isHighlighted = isOver || isNativeOver;
  const showIndicator = isActive || isNativeOver;

  return (
    <section
      aria-label={`Drop gap ${gapIndex}`}
      ref={setNodeRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsNativeOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNativeOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNativeOver(false);
        if (disabled) return;
        try {
          const dataStr = e.dataTransfer.getData("application/json");
          if (dataStr) {
            const parsed = JSON.parse(dataStr);
            // If dragging a tab to the gap outside, detach it to card
            if (parsed.type === "canvas-tab" && parsed.sectionId && onConvertSectionZone) {
              onConvertSectionZone(parsed.sectionId, "standard");
              return;
            }
            if (onDropPaletteItem) {
              onDropPaletteItem(parsed, undefined, gapIndex);
            }
          }
        } catch {
          /* ignore */
        }
      }}
      className={cn(
        "transition-all rounded mx-0.5 relative flex items-center justify-center",
        showIndicator
          ? isHighlighted
            ? "h-8 mb-2 bg-primary/15 border-2 border-dashed border-primary"
            : "h-3 mb-1.5 border border-dashed border-border/50 hover:border-primary/50"
          : "h-0 my-0 border-0 opacity-0 overflow-hidden pointer-events-none",
      )}
    >
      {isHighlighted && (
        <span className="text-[10px] font-semibold text-primary select-none">
          + Place item here
        </span>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root canvas droppable — catches any field/variable drop on the canvas
// ---------------------------------------------------------------------------
function CanvasRootDropzone({
  onDropPaletteItem,
  onConvertSectionZone,
  disabled,
}: {
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root-zone",
    data: { type: "canvas-root" },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);
  const show = isOver || isNativeOver;

  return (
    <section
      aria-label="Root canvas drop target"
      ref={setNodeRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsNativeOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNativeOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNativeOver(false);
        if (disabled) return;
        try {
          const dataStr = e.dataTransfer.getData("application/json");
          if (dataStr) {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "canvas-tab" && parsed.sectionId && onConvertSectionZone) {
              onConvertSectionZone(parsed.sectionId, "standard");
              return;
            }
            if (onDropPaletteItem) {
              onDropPaletteItem(parsed);
            }
          }
        } catch {
          /* ignore */
        }
      }}
      className={cn(
        "transition-all flex items-center justify-center text-xs text-muted-foreground/60",
        show
          ? "min-h-12 rounded-lg border-2 border-dashed border-primary bg-primary/10 text-primary font-medium my-2"
          : "h-0 my-0 border-0 opacity-0 overflow-hidden pointer-events-none",
      )}
    >
      {show && <span>↓ Drop directly onto root canvas</span>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Empty-canvas splash
// ---------------------------------------------------------------------------
interface EmptyCanvasProps {
  isOver: boolean;
  onAddSection?: DesignerCanvasProps["onAddSection"];
  onClickBackground: () => void;
  onDragOver: React.DragEventHandler;
  onDragLeave: React.DragEventHandler;
  onDrop: React.DragEventHandler;
  disabled?: boolean;
}

function EmptyCanvasSplash({
  isOver,
  onAddSection,
  onClickBackground,
  onDragOver,
  onDragLeave,
  onDrop,
  disabled,
}: EmptyCanvasProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl m-4 transition-all cursor-pointer bg-transparent",
        isOver
          ? "border-primary bg-primary/10 text-primary scale-[1.01]"
          : "border-border/60 bg-muted/5",
      )}
      onClick={onClickBackground}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <Folder className="size-6 text-muted-foreground/60" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">Canvas is Empty</h4>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
        Drag variables or containers here, or click any variable on the left to add directly.
      </p>

      {!disabled && onAddSection && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSection("standard", "standard", [], "card", "Card Section")}
            className="h-8 text-xs bg-background shadow-xs hover:border-emerald-500/50"
          >
            + Card Container
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSection("object-group", "standard", [], "card", "Object Group")}
            className="h-8 text-xs bg-background shadow-xs hover:border-purple-500/50"
          >
            + Object Group
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSection("standard", "tab", [], "card", "Tab 1", undefined, "Tab 1")}
            className="h-8 text-xs bg-background shadow-xs hover:border-sky-500/50"
          >
            + Tab Group
          </Button>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DesignerCanvas
// ---------------------------------------------------------------------------
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
  const [activeDragItem, setActiveDragItem] = React.useState<{
    type: "field" | "section";
    data: FormElement | FormSection;
  } | null>(null);

  const isDragging = activeDragItem !== null;

  const [isCanvasDragOver, setIsCanvasDragOver] = React.useState(false);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Drag Handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const d = event.active.data.current;
    if (d?.type === "field") {
      setActiveDragItem({ type: "field", data: d.field as FormElement });
    } else if (d?.type === "section") {
      setActiveDragItem({ type: "section", data: d.section as FormSection });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "field" && onMoveFieldAcrossSections) {
      const sourceSecId = activeData.sectionId as string;
      let targetSecId: string | undefined;
      let targetFieldId: string | undefined;

      if (overData?.type === "field") {
        targetSecId = overData.sectionId as string;
        targetFieldId = String(over.id);
      } else if (overData?.type === "section-dropzone") {
        targetSecId = overData.sectionId as string;
      } else if (overData?.type === "section") {
        targetSecId = String(over.id);
      }

      if (sourceSecId && targetSecId && sourceSecId !== targetSecId) {
        onMoveFieldAcrossSections(sourceSecId, targetSecId, String(active.id), targetFieldId);
        activeData.sectionId = targetSecId;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || disabled) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeData = active.data.current;
    const overData = over.data.current;

    // ── Field drag ─────────────────────────────────────────────────────────
    if (activeData?.type === "field") {
      const sourceSecId = activeData.sectionId as string;
      let targetSecId: string | undefined;
      let targetFieldId: string | undefined;
      let insertAtIndex: number | undefined;

      if (overData?.type === "field") {
        targetSecId = overData.sectionId as string;
        targetFieldId = overId;
      } else if (overData?.type === "section-dropzone") {
        targetSecId = overData.sectionId as string;
      } else if (overData?.type === "section") {
        targetSecId = overId;
      } else if (overData?.type === "canvas-root") {
        targetSecId = "canvas-root";
      } else if (overData?.type === "between-block-gap") {
        targetSecId = "canvas-root";
        const gapIdx = overData.gapIndex as number;
        // Translate block gapIndex into actual sections array index
        if (gapIdx <= 0) {
          insertAtIndex = 0;
        } else if (gapIdx >= blocks.length) {
          insertAtIndex = sections.length;
        } else {
          const targetBlock = blocks[gapIdx];
          const targetSec =
            targetBlock.type === "single" ? targetBlock.section : targetBlock.tabSections[0];
          const rawIdx = targetSec ? sections.findIndex((s) => s.id === targetSec.id) : -1;
          insertAtIndex = rawIdx >= 0 ? rawIdx : undefined;
        }
      }

      if (sourceSecId && targetSecId) {
        if (sourceSecId === targetSecId) {
          if (targetFieldId && targetFieldId !== activeId) {
            onReorderFields(sourceSecId, activeId, targetFieldId);
          }
        } else if (onMoveFieldAcrossSections) {
          onMoveFieldAcrossSections(
            sourceSecId,
            targetSecId,
            activeId,
            targetFieldId,
            insertAtIndex,
          );
        }
      }
      return;
    }

    // ── Section drag ────────────────────────────────────────────────────────
    if (activeData?.type === "section") {
      const activeSec =
        (activeData.section as FormSection) || sections.find((s) => s.id === activeId);

      // Check if dropped onto a tab-group dropzone or card to merge or convert zone
      if (overData?.type === "section-dropzone" || overData?.type === "section") {
        const targetSecId =
          overData.type === "section-dropzone" ? (overData.sectionId as string) : overId;
        const targetSec = sections.find((s) => s.id === targetSecId);

        if (targetSec && targetSec.zone === "tab") {
          // If active is a tab in a DIFFERENT tab group -> merge entire tab group or move tab!
          if (
            activeSec &&
            activeSec.zone === "tab" &&
            activeSec.tabGroupId &&
            targetSec.tabGroupId &&
            activeSec.tabGroupId !== targetSec.tabGroupId
          ) {
            onMergeTabGroup?.(activeSec.tabGroupId, targetSec.tabGroupId);
            return;
          }

          if (onConvertSectionZone && activeId !== String(targetSec.id)) {
            onConvertSectionZone(activeId, "tab", {
              tabGroupId: targetSec.tabGroupId,
              tabTitle: activeSec?.title || "New Tab",
            });
            return;
          }
        }
      }

      // Check if dropped onto a between-block-gap
      if (overData?.type === "between-block-gap" && onReorderSections) {
        const gapIndex = overData.gapIndex as number;
        // Translate block gapIndex to the corresponding section in the raw sections array
        if (gapIndex <= 0) {
          // Put before the very first section
          const firstSecId = sections[0]?.id;
          if (firstSecId) {
            onReorderSections(activeId, firstSecId, 0);
          }
        } else if (gapIndex >= blocks.length) {
          // Put at the very end of the sections array
          onReorderSections(activeId, "", sections.length);
        } else {
          // Put before the first section of block `gapIndex`
          const targetBlock = blocks[gapIndex];
          const targetSec =
            targetBlock.type === "single" ? targetBlock.section : targetBlock.tabSections[0];
          if (targetSec) {
            const rawTargetIndex = sections.findIndex((s) => s.id === targetSec.id);
            onReorderSections(
              activeId,
              targetSec.id,
              rawTargetIndex >= 0 ? rawTargetIndex : undefined,
            );
          }
        }
        return;
      }

      if (onReorderSections && activeId !== overId) {
        onReorderSections(activeId, overId);
      }
    }
  };

  // ── Native HTML5 handlers ─────────────────────────────────────────────────
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

  // ── Empty-state ────────────────────────────────────────────────────────────
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

  // ── Build render blocks ────────────────────────────────────────────────────
  const blocks = buildRenderBlocks(sections);
  const sortableCardIds = blocks.map((b) =>
    b.type === "single" ? b.section.id : b.tabSections[0]?.id || b.groupId,
  );

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
          {/* Top gap */}
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

              {/* Gap between blocks */}
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

        {/* Root drop target at end */}
        <CanvasRootDropzone
          onDropPaletteItem={onDropPaletteItem}
          onConvertSectionZone={onConvertSectionZone}
          disabled={disabled}
        />

        {/* Drag Overlay Preview */}
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
