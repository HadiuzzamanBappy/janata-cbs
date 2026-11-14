/**
 * @fileoverview Single-section canvas layout blocks for Form Designer.
 * Contains CardContainerBlock (titled multi-column card) and StandaloneFieldBlock (root-level field).
 *
 * @module features/system/form-config/components/designer/canvas/canvas-card-blocks
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Layers, Trash2, Ungroup } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-engine-schema";
import { useDesignerContext } from "../context/designer-context";
import { CanvasFieldCard } from "./canvas-field-card";
import { CanvasSectionGrid } from "./canvas-section-grid";

// ============================================================================
// 1. STANDALONE FIELD BLOCK (Untitled Root Single Field)
// ============================================================================

export interface StandaloneFieldBlockProps {
  section: FormSection;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onRemoveSection?: (id: string) => void;
  onRemoveField?: (fieldId: string) => void;
  disabled?: boolean;
}

/**
 * Independent Standalone Field Block.
 * Renders an un-enclosed form field directly at the root canvas level.
 */
export function StandaloneFieldBlock(props: StandaloneFieldBlockProps) {
  const context = useDesignerContext();
  const { section } = props;
  const selectedFieldId =
    props.selectedFieldId !== undefined ? props.selectedFieldId : context.selectedFieldId;
  const onSelectSection = props.onSelectSection ?? context.handleCanvasSelectSection;
  const onSelectField = props.onSelectField ?? context.handleCanvasSelectField;
  const onRemoveSection = props.onRemoveSection ?? context.onRemoveSection;
  const onRemoveField = props.onRemoveField ?? context.onRemoveField;
  const disabled = props.disabled ?? context.disabled;

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

  const field = section.fields[0];
  if (!field) return null;

  const fieldId = field.SN || field.NAME;
  const isSelected = selectedFieldId === fieldId;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: canvas selectable standalone field
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection(section.id);
        onSelectField(section.id, fieldId);
      }}
      className={cn(
        "relative rounded-md transition-all select-none first:mt-0 my-1 group",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      <div {...attributes} {...listeners}>
        <CanvasFieldCard
          field={field}
          sectionId={section.id}
          isSelected={isSelected}
          onSelect={() => {
            onSelectSection(section.id);
            onSelectField(section.id, fieldId);
          }}
          onRemove={() => {
            onRemoveField(fieldId);
            onRemoveSection(section.id);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 2. CARD CONTAINER BLOCK (Titled Multi-Column Card Container)
// ============================================================================

export interface CardContainerBlockProps {
  section: FormSection;
  isSecSelected?: boolean;
  selectedFieldId?: string | null;
  onSelectSection?: (id: string | null) => void;
  onSelectField?: (sectionId: string | null, fieldId: string | null) => void;
  onUpdateSection?: (id: string, patch: Partial<FormSection>) => void;
  onRemoveSection?: (id: string) => void;
  onUngroupSection?: (id: string) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetType: "card" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  disabled?: boolean;
}

/**
 * Card Container Block.
 * Renders an independent, titled multi-column card section on the canvas.
 */
export function CardContainerBlock(props: CardContainerBlockProps) {
  const context = useDesignerContext();
  const { section } = props;
  const isSecSelected =
    props.isSecSelected !== undefined
      ? props.isSecSelected
      : context.selectedSectionId === section.id;
  const selectedFieldId =
    props.selectedFieldId !== undefined ? props.selectedFieldId : context.selectedFieldId;
  const onSelectSection = props.onSelectSection ?? context.handleCanvasSelectSection;
  const onSelectField = props.onSelectField ?? context.handleCanvasSelectField;
  const onUpdateSection = props.onUpdateSection ?? context.onUpdateSection;
  const onRemoveSection = props.onRemoveSection ?? context.onRemoveSection;
  const onUngroupSection = props.onUngroupSection ?? context.onUngroupSection;
  const onConvertSectionZone = props.onConvertSectionZone ?? context.onConvertSectionZone;
  const disabled = props.disabled ?? context.disabled;

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
  const isContainerExplicitlySelected = isSecSelected && !selectedFieldId;
  const config = section.containerConfig || {};

  const bg =
    config.background ??
    (config.variant === "ghost" ? "none" : config.variant === "subtle" ? "subtle" : "regular");

  const isBordered = config.bordered !== undefined ? config.bordered : config.variant !== "ghost";

  const shouldShowHeader =
    config.showHeader !== undefined
      ? config.showHeader
      : Boolean(section.title || section.collapsible || config.badge) && config.variant !== "ghost";

  const borderClass = !isBordered
    ? "border border-dashed border-border/40"
    : config.variant === "bordered"
      ? "border-2 border-border"
      : config.variant === "subtle" || bg === "subtle"
        ? "border border-border/40"
        : "border border-border/80";

  const bgClass =
    bg === "none"
      ? "bg-card/10"
      : bg === "subtle"
        ? "bg-muted/20"
        : config.variant === "bordered"
          ? "bg-card"
          : "bg-card/60";

  const shadowClass =
    config.variant === "elevated" ? "shadow-sm" : bg === "none" || !isBordered ? "" : "shadow-2xs";

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: canvas selectable container
    <section
      data-canvas-card="true"
      aria-label={section.title || "Card Section"}
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection(section.id);
        onSelectField(section.id, null);
      }}
      className={cn(
        "rounded-lg overflow-hidden transition-all relative first:mt-0 my-1",
        borderClass,
        bgClass,
        shadowClass,
        config.customClass,
        isContainerExplicitlySelected && "border-primary/80 ring-1 ring-primary/30",
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* Card Header Toolbar */}
      {shouldShowHeader ? (
        <div
          className={cn(
            "px-2.5 py-1.5 flex items-center justify-between text-xs bg-muted/25 border-b border-border/60 select-none",
            isContainerExplicitlySelected && "bg-primary/5",
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
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider shrink-0 whitespace-nowrap">
                {section.title || "Untitled Card"}
              </span>
              {section.description && (
                <span
                  className="text-[11px] text-muted-foreground/60 font-normal truncate min-w-0"
                  title={section.description}
                >
                  &bull; {section.description}
                </span>
              )}
              <Badge
                variant="outline"
                className="text-[9px] h-3.5 px-1 font-mono uppercase text-muted-foreground shrink-0"
              >
                {numCols} {numCols === 1 ? "COL" : "COLS"}
              </Badge>
              {config.badge && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.2 text-[9px] font-medium rounded-full shrink-0 whitespace-nowrap",
                    config.badgeVariant === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : config.badgeVariant === "outline"
                        ? "border border-border text-foreground"
                        : config.badgeVariant === "secondary"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary/10 text-primary",
                  )}
                >
                  {config.badge}
                </span>
              )}
            </button>
          </div>

          {!disabled && (
            <div className="flex items-center gap-0.5 shrink-0">
              {onConvertSectionZone && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onConvertSectionZone(section.id, "tab", {
                      groupTitle: section.title || "Tab",
                    })
                  }
                  className="size-6 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                  title="Convert this card into a tab container"
                  aria-label="Convert to Tab"
                >
                  <Layers className="size-3.5" />
                </Button>
              )}
              {onUngroupSection && (section.fields?.length || 0) > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUngroupSection(section.id)}
                  className="size-6 p-0 text-muted-foreground hover:text-amber-500 cursor-pointer"
                  title="Ungroup card (convert fields to standalone)"
                  aria-label="Ungroup Card"
                >
                  <Ungroup className="size-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveSection(section.id)}
                className="size-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Delete Card Section"
                aria-label="Delete Card Section"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Compact Designer Handle for Headerless Cards */
        <div
          className={cn(
            "px-2 py-0.5 flex items-center justify-between text-[10px] text-muted-foreground/60 bg-muted/15 border-b border-border/30 select-none",
            isContainerExplicitlySelected && "bg-primary/5",
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
                <GripVertical className="size-3" />
              </button>
            )}
            <span className="text-[10px] italic text-muted-foreground/60 truncate">
              {section.title || "Headerless Section"}
            </span>
            <Badge
              variant="outline"
              className="text-[8px] h-3 px-1 font-mono uppercase text-muted-foreground/60 shrink-0"
            >
              {numCols} {numCols === 1 ? "COL" : "COLS"}
            </Badge>
          </div>
          {!disabled && (
            <div className="flex items-center gap-0.5 shrink-0">
              {onUngroupSection && (section.fields?.length || 0) > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUngroupSection(section.id)}
                  className="size-5 p-0 text-muted-foreground hover:text-amber-500 cursor-pointer"
                  title="Ungroup card"
                  aria-label="Ungroup Card"
                >
                  <Ungroup className="size-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveSection(section.id)}
                className="size-5 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Remove card"
                aria-label="Remove Card"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Card Grid Body */}
      {!isCollapsed && (
        <div className="p-2.5">
          <CanvasSectionGrid section={section} />
        </div>
      )}
    </section>
  );
}
