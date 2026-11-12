"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Layers, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { CanvasSectionGrid } from "../canvas-section-grid";

export interface CardContainerBlockProps {
  section: FormSection;
  isSecSelected: boolean;
  selectedFieldId: string | null;
  onSelectSection: (id: string | null) => void;
  onSelectField: (sectionId: string | null, fieldId: string | null) => void;
  onUpdateSection: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection: (id: string) => void;
  onRemoveField: (fieldId: string) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetType: "card" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
}

/**
 * Card Container Block.
 * Renders an independent, titled multi-column card section on the canvas.
 */
export function CardContainerBlock({
  section,
  isSecSelected,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onUpdateSection,
  onRemoveSection,
  onRemoveField,
  onConvertSectionZone,
  onDropPaletteItem,
  disabled,
}: CardContainerBlockProps) {
  const [isBodyOver, setIsBodyOver] = React.useState(false);

  React.useEffect(() => {
    const handleReset = () => setIsBodyOver(false);
    window.addEventListener("dragend", handleReset);
    window.addEventListener("drop", handleReset);
    return () => {
      window.removeEventListener("dragend", handleReset);
      window.removeEventListener("drop", handleReset);
    };
  }, []);

  const handleBodyDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isBodyOver) setIsBodyOver(true);
  };

  const handleBodyDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsBodyOver(false);
    }
  };

  const handleBodyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBodyOver(false);
    if (disabled || !onDropPaletteItem) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) onDropPaletteItem(JSON.parse(dataStr), section.id);
    } catch {
      /* ignore */
    }
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section", section },
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const numCols = section.columns || 1;
  const isCollapsed = Boolean(section.collapsible && section.isCollapsed);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: canvas selectable container
    <section
      aria-label={section.title || "Card Section"}
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection(section.id);
        onSelectField(section.id, null);
      }}
      className={cn(
        "rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-all relative shadow-2xs my-1",
        isSecSelected && "border-primary/80 ring-1 ring-primary/30",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* Card Header Toolbar */}
      <div
        className={cn(
          "px-2.5 py-1.5 flex items-center justify-between text-xs bg-muted/25 border-b border-border/60 select-none",
          isSecSelected && "bg-primary/5",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {!disabled && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground/50 hover:text-foreground shrink-0 p-0.5"
              aria-label="Reorder card block"
            >
              <GripVertical className="size-3.5" />
            </button>
          )}

          {section.collapsible && (
            <button
              type="button"
              onClick={() => onUpdateSection(section.id, { isCollapsed: !section.isCollapsed })}
              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer rounded"
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            >
              {isCollapsed ? (
                <ChevronRight className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSelectSection(section.id);
              onSelectField(section.id, null);
            }}
            className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer text-left min-w-0"
          >
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">
              {section.title || "Untitled Card"}
            </span>
            <Badge
              variant="outline"
              className="text-[9px] h-3.5 px-1 font-mono uppercase text-muted-foreground"
            >
              {numCols} {numCols === 1 ? "COL" : "COLS"}
            </Badge>
          </button>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1 shrink-0">
            {onConvertSectionZone && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onConvertSectionZone(section.id, "tab", {
                    groupTitle: section.title || "Tab",
                  })
                }
                className="h-6 px-1.5 text-[10px] text-sky-500 hover:bg-sky-500/10 cursor-pointer"
                title="Convert this card into a tab container"
              >
                <Layers className="size-3 mr-1" />
                <span>To Tab</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveSection(section.id)}
              className="size-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
              title="Delete Card Section"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Grid Body */}
      {!isCollapsed && (
        // biome-ignore lint/a11y/noStaticElementInteractions: droppable card container body
        <div
          onDragOver={handleBodyDragOver}
          onDragLeave={handleBodyDragLeave}
          onDrop={handleBodyDrop}
          className={cn("p-2.5 transition-colors", isBodyOver && "bg-primary/5")}
        >
          <CanvasSectionGrid
            section={section}
            selectedFieldId={selectedFieldId}
            onSelectSection={onSelectSection}
            onSelectField={onSelectField}
            onRemoveField={onRemoveField}
            onDropPaletteItem={onDropPaletteItem}
            isNativeOver={isBodyOver}
            disabled={disabled}
          />
        </div>
      )}
    </section>
  );
}
