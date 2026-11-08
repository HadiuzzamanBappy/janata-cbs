"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Layers, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { SectionDropBody } from "./section-drop-body";

export interface SortableSectionCardProps {
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
    targetType: "card" | "plain" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
  disabled?: boolean;
}

export function SortableSectionCard({
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
}: SortableSectionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section", section },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isPlainRoot =
    section.containerType === "plain" || !section.title || section.title === "Canvas Root";
  const config = section.containerConfig || {};

  const variantClass = React.useMemo(() => {
    switch (config.variant) {
      case "subtle":
        return "bg-muted/30 border-border/50";
      case "bordered":
        return "bg-card border-border/90 shadow-none";
      case "elevated":
        return "bg-card border-border/80 shadow-md";
      case "ghost":
        return "bg-transparent border-transparent shadow-none";
      default:
        return "bg-card/60 border-border/80 shadow-2xs";
    }
  }, [config.variant]);

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsNativeOver(true);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeOver(false);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeOver(false);
    if (disabled || !onDropPaletteItem) return;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) onDropPaletteItem(JSON.parse(dataStr), section.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      aria-label={section.title || "Form Section"}
      ref={setNodeRef}
      style={style}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      className={cn(
        "rounded-lg transition-all relative",
        isPlainRoot
          ? "border border-transparent p-0 mb-2"
          : cn("overflow-hidden mb-3.5", variantClass),
        !isPlainRoot && isSecSelected && "border-primary/80 ring-1 ring-primary/30",
        isNativeOver && "ring-2 ring-primary/60 border-primary bg-primary/5",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* Header – skip for plain-root sections */}
      {!isPlainRoot && (
        <div
          className={cn(
            "px-2.5 py-1.5 flex items-center justify-between text-xs bg-muted/20 border-b border-border/60",
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
                aria-label="Reorder section block"
              >
                <GripVertical className="size-3.5 text-muted-foreground/60" />
              </button>
            )}

            {section.collapsible && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateSection(section.id, { isCollapsed: !section.isCollapsed });
                }}
                className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                aria-label={section.isCollapsed ? "Expand section" : "Collapse section"}
              >
                {section.isCollapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSection(section.id);
                onSelectField(null, null);
              }}
              className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer text-left min-w-0"
            >
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">
                {section.title}
              </span>
              {config.badge && (
                <span className="inline-flex items-center px-1 text-[9px] font-mono rounded bg-primary/10 text-primary border border-primary/20">
                  {config.badge}
                </span>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] h-4 px-1.5 font-mono uppercase",
                  section.containerType === "tab"
                    ? "border-sky-500/40 text-sky-500 bg-sky-500/10"
                    : "border-border text-muted-foreground",
                )}
              >
                {section.containerType === "tab"
                  ? `TAB: ${section.groupTitle || section.title}`
                  : "CARD"}
              </Badge>
            </button>
          </div>

          {!disabled && (
            <div className="flex items-center gap-1">
              {onConvertSectionZone && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvertSectionZone(section.id, "tab", {
                      groupTitle: section.title || "Tab",
                    });
                  }}
                  className="h-6 px-1.5 text-[10px] text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                  title="Convert this card into a tab page"
                >
                  <Layers className="size-3 mr-1" />
                  <span>To Tab</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSection(section.id);
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Remove container"
                aria-label={`Remove section ${section.title || section.id}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Body: 12-col dropzone container */}
      <div className={cn(isPlainRoot ? "p-0" : "p-2.5")}>
        <SectionDropBody
          section={section}
          selectedFieldId={selectedFieldId}
          onSelectSection={onSelectSection}
          onSelectField={onSelectField}
          onRemoveField={onRemoveField}
          disabled={disabled}
        />
      </div>
    </section>
  );
}
