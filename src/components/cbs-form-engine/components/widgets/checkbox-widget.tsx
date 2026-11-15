/**
 * @fileoverview High-Density Boolean Checkbox Widget
 * @module form-engine/widgets/checkbox-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Does NOT mutate base UI primitives (src/components/ui/checkbox.tsx remains pristine).
 * - Renders active/inactive semantic badges with high-contrast disabled styling.
 */

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface CheckboxWidgetProps extends BaseWidgetProps {
  activeLabel?: string;
  inactiveLabel?: string;
}

export function CheckboxWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  className,
  activeLabel = "Yes",
  inactiveLabel = "No",
}: CheckboxWidgetProps) {
  const isChecked = Boolean(value);

  return (
    <div className={cn("flex items-center gap-2 max-w-md flex-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-2 select-none",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <Checkbox
          id={id}
          checked={isChecked}
          disabled={disabled}
          onCheckedChange={(val: boolean) => onChange(Boolean(val))}
          className={cn(
            "rounded",
            "dark:data-checked:text-primary-foreground",
            disabled &&
              (isChecked
                ? "!bg-muted/70 !border-border !text-muted-foreground"
                : "!bg-input/40 !border-border/60"),
          )}
        />
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
            disabled
              ? isChecked
                ? "bg-muted/70 text-muted-foreground border-border/80"
                : "bg-input/40 text-muted-foreground/70 border-border/50"
              : isChecked
                ? "bg-primary/10 text-primary border-primary/25"
                : "bg-muted text-muted-foreground border-border/40",
          )}
        >
          {isChecked ? activeLabel : inactiveLabel}
        </span>
      </label>
    </div>
  );
}
