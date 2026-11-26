/**
 * @fileoverview High-Density Radio & Segmented Button Group Widget
 * @module form-engine/widgets/radio-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Supports standard circular radio list and compact segmented button bar ("group" variant).
 */

"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps, WidgetOption } from "../../types";
import { WIDGET_DISABLED_CHOICE, WIDGET_TEXT, WIDGET_TEXT_SELECTED } from "./widget-styles";

export interface RadioWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
  variant?: "standard" | "group";
}

/** A stored value selects an option by its exact code or label (case and spaces ignored). */
function isOptionSelected(value: unknown, opt: WidgetOption): boolean {
  const valStr = String(value ?? "")
    .trim()
    .toUpperCase();
  return (
    Boolean(valStr) &&
    (valStr === opt.code.trim().toUpperCase() || valStr === opt.label.trim().toUpperCase())
  );
}

export function RadioWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  options,
  variant = "standard",
  className,
}: RadioWidgetProps) {
  if (variant === "group") {
    return (
      <div
        className={cn(
          "inline-flex flex-wrap rounded border border-border/80 p-0.5 bg-muted/30 gap-0.5 max-w-full",
          className,
        )}
      >
        {options.map((opt) => {
          const isSelected = isOptionSelected(value, opt);
          return (
            <button
              key={opt.code}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.code)}
              className={cn(
                `px-2.5 py-0.5 ${WIDGET_TEXT} rounded transition-all cursor-pointer border-0`,
                isSelected
                  ? `bg-primary text-primary-foreground shadow-2xs ${WIDGET_TEXT_SELECTED}`
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50 bg-transparent",
                disabled && WIDGET_DISABLED_CHOICE,
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <RadioGroup
      value={value ? String(value) : ""}
      onValueChange={(val: string) => onChange(val)}
      disabled={disabled}
      className={cn("flex items-center gap-5", className)}
    >
      {options.map((opt) => {
        const radioId = `${id}-${opt.code}`;
        const isSelected = isOptionSelected(value, opt);
        return (
          <div key={opt.code} className="flex items-center gap-1.5">
            <RadioGroupItem
              id={radioId}
              value={opt.code}
              disabled={disabled}
              className="size-3.5"
            />
            <Label
              htmlFor={radioId}
              className={cn(
                `${WIDGET_TEXT} cursor-pointer select-none`,
                isSelected ? `text-foreground ${WIDGET_TEXT_SELECTED}` : "text-muted-foreground",
                disabled && WIDGET_DISABLED_CHOICE,
              )}
            >
              {opt.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
