"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, GripVertical, Minus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defaultWidthForLength } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import { type FormElement, getDefaultWidgetForType, type PropertyType } from "@/lib/data-schemas";
import { useOptionalDesignerContext } from "../context/designer-context";
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
    const defaultWidth = matchedProp ? defaultWidthForLength(matchedProp) : undefined;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-field-card="true"
      {...selectableProps(onSelect, isSelected)}
      className={cn(
        "rounded-md border px-2.5 py-1.5 flex items-center justify-between text-xs transition-all bg-card/90 hover:border-primary/50 select-none",
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
      )}
    </div>
  );
}
