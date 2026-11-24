"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, ChevronDown, ChevronUp, GripVertical, Minus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildRenderBlocks,
  deriveSemanticWidth,
  getBlockGapSectionIndex,
} from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import { type FormElement, getDefaultWidgetForType, type PropertyType } from "@/lib/data-schemas";
import { useOptionalDesignerContext } from "../context/designer-context";
import { CanvasObjectFields } from "./canvas-object-fields";
import { selectableProps } from "./selectable";

export interface CanvasFieldCardProps {
  field: FormElement;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  className?: string;
  disabled?: boolean;
}

export function CanvasFieldCard({
  field,
  sectionId,
  isSelected,
  onSelect,
  onRemove,
  className,
  disabled,
}: CanvasFieldCardProps) {
  const fieldId = String(field.SN || field.NAME || "field");
  const ctx = useOptionalDesignerContext();
  const fieldErrors = ctx ? ctx.getFieldErrors(fieldId) : [];
  const hasErrors = fieldErrors.length > 0;

  const matchedProp = React.useMemo(() => {
    return ctx?.modelProperties?.find((p) => p.SN === field.SN || p.NAME === field.NAME);
  }, [ctx?.modelProperties, field.SN, field.NAME]);

  const overrides = React.useMemo(() => {
    const list: {
      key: string;
      label: string;
      variant?: "secondary" | "outline";
      className?: string;
    }[] = [];

    // 1. Widget override
    const physicalType = (matchedProp?.TYPE || field.TYPE || "String") as PropertyType;
    const defaultWidget = getDefaultWidgetForType(physicalType);
    if (field.WIDGET && field.WIDGET !== defaultWidget) {
      list.push({ key: "widget", label: field.WIDGET.toUpperCase(), variant: "outline" });
    }

    // 2. Width override (only if explicitly changed from default width)
    const defaultWidth = matchedProp
      ? deriveSemanticWidth(undefined, matchedProp.LENGTH, matchedProp.TYPE)
      : undefined;
    if (field.WIDTH && defaultWidth && field.WIDTH !== defaultWidth) {
      list.push({ key: "width", label: String(field.WIDTH).toUpperCase(), variant: "secondary" });
    }

    // 3. Disabled / Read-Only override
    if (field.DISABLED) {
      list.push({
        key: "disabled",
        label: "DISABLED",
        variant: "outline",
        className: "text-muted-foreground border-border bg-muted/40",
      });
    }

    // 4. Structure override (e.g. Model is M, but form chose S)
    if (matchedProp?.STRUCTURE === "M" && field.STRUCTURE === "S") {
      list.push({ key: "structure", label: "SINGLE", variant: "outline" });
    }

    // 5. Active Rule Badges (Visible When, Disabled When, Cascade, On Change, Validation)
    if (field.VISIBLE_WHEN) {
      list.push({
        key: "rule-vis",
        label: "VIS",
        variant: "secondary",
        className: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold",
      });
    }

    if (field.DISABLED_WHEN) {
      list.push({
        key: "rule-dis",
        label: "DIS",
        variant: "secondary",
        className:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold",
      });
    }

    if (Array.isArray(field.CASCADE) && field.CASCADE.length > 0) {
      list.push({
        key: "rule-cas",
        label: "CAS",
        variant: "secondary",
        className:
          "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold",
      });
    }

    if (field.ON_CHANGE?.target) {
      list.push({
        key: "rule-chg",
        label: "CHG",
        variant: "secondary",
        className:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold",
      });
    }

    if (
      (field.TRANSFORM && field.TRANSFORM !== "none") ||
      field.VALIDATION?.matches ||
      field.VALIDATION?.min !== undefined ||
      field.VALIDATION?.max !== undefined
    ) {
      list.push({
        key: "rule-val",
        label: "VAL",
        variant: "secondary",
        className:
          "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold",
      });
    }

    return list;
  }, [field, matchedProp]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldId,
    data: {
      type: "field",
      sectionId,
      field,
    },
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const { canMoveUp, canMoveDown, moveField } = React.useMemo(() => {
    const sections = ctx?.sections ?? [];
    const currentSection = sections.find((s) => s.id === sectionId);
    const isStandalone = Boolean(
      currentSection && !currentSection.title?.trim() && currentSection.containerType !== "tab",
    );

    if (isStandalone) {
      const blocks = buildRenderBlocks(sections);
      const blockIdx = blocks.findIndex((b) => b.type === "single" && b.section.id === sectionId);
      const move = (dir: -1 | 1) => {
        if (!ctx || blockIdx < 0) return;
        const targetBlock = blocks[blockIdx + dir];
        if (!targetBlock) return;
        const targetSecId =
          targetBlock.type === "single" ? targetBlock.section.id : targetBlock.tabSections[0]?.id;
        if (!targetSecId) return;
        const insertIdx =
          dir === 1
            ? getBlockGapSectionIndex(blocks, sections, blockIdx + 2)
            : getBlockGapSectionIndex(blocks, sections, blockIdx - 1);
        ctx.onReorderSections?.(sectionId, targetSecId, insertIdx);
      };
      return {
        canMoveUp: blockIdx > 0,
        canMoveDown: blockIdx >= 0 && blockIdx < blocks.length - 1,
        moveField: move,
      };
    }

    const fields = currentSection?.fields ?? [];
    const fieldIdx = fields.findIndex((f) => (f.SN || f.NAME) === fieldId);
    const move = (dir: -1 | 1) => {
      if (!ctx || fieldIdx < 0) return;
      const target = fields[fieldIdx + dir];
      if (!target) return;
      ctx.onReorderFields?.(sectionId, fieldId, String(target.SN || target.NAME));
    };
    return {
      canMoveUp: fieldIdx > 0,
      canMoveDown: fieldIdx >= 0 && fieldIdx < fields.length - 1,
      moveField: move,
    };
  }, [ctx, sectionId, fieldId]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-field-card="true"
      {...selectableProps(onSelect, isSelected)}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-xs transition-all bg-card/90 hover:border-primary/50 select-none",
        isSelected
          ? hasErrors
            ? "border-destructive ring-1 ring-destructive/40 bg-destructive/10 shadow-xs"
            : "border-primary ring-1 ring-primary/40 bg-primary/10 shadow-xs"
          : hasErrors
            ? "border-destructive/60 bg-destructive/5 hover:border-destructive"
            : "border-border/70",
        isDragging && "shadow-md opacity-40",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab text-muted-foreground/50 hover:text-foreground shrink-0 p-0.5"
            aria-label="Reorder field"
          >
            <GripVertical className="size-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-foreground truncate">{field.LABEL}</span>
              {field.REQUIRED && (
                <span className="text-destructive font-bold text-xs shrink-0">*</span>
              )}
              {hasErrors && (
                <span
                  className="flex items-center gap-0.5 text-destructive text-3xs font-semibold shrink-0"
                  title={fieldErrors.map((e) => e.message).join("\n")}
                >
                  <AlertTriangle className="size-3 text-destructive" />
                  <span>{fieldErrors.length}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-3xs text-muted-foreground font-mono min-w-0 overflow-hidden">
              <span className="truncate max-w-36">{field.NAME}</span>
              {overrides.map((ov) => (
                <Badge
                  key={ov.key}
                  variant={ov.variant || "outline"}
                  className={cn("text-3xs h-3.5 px-1 font-mono uppercase shrink-0", ov.className)}
                >
                  {ov.label}
                </Badge>
              ))}
            </div>
          </button>
        </div>

        {!disabled && (
          <div className="flex items-center shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                moveField(-1);
              }}
              className="size-5 p-0 text-muted-foreground/60 hover:text-foreground rounded cursor-pointer"
              title="Move up"
            >
              <ChevronUp className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                moveField(1);
              }}
              className="size-5 p-0 text-muted-foreground/60 hover:text-foreground rounded cursor-pointer"
              title="Move down"
            >
              <ChevronDown className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="size-5 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
              title={`Remove field ${field.LABEL}`}
            >
              <Minus className="size-3.5 stroke-[2.5]" />
            </Button>
          </div>
        )}
      </div>

      {/* Object group: its inner fields, each configurable on its own */}
      <CanvasObjectFields parent={field} sectionId={sectionId} disabled={disabled} />
    </div>
  );
}
