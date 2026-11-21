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
import { isBooleanOn, toBooleanValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { BooleanWidgetConfig } from "@/lib/data-schemas";
import type { BaseWidgetProps } from "../../types";
import { WIDGET_TAG } from "./widget-styles";

export interface CheckboxWidgetProps extends BaseWidgetProps {
  /** Labels and on / off wire values (BOOLEAN_CONFIG). */
  config?: BooleanWidgetConfig;
}

export function CheckboxWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  className,
  config,
}: CheckboxWidgetProps) {
  const isChecked = isBooleanOn(value, config);
  const activeLabel = config?.activeLabel || "Yes";
  const inactiveLabel = config?.inactiveLabel || "No";

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
          onCheckedChange={(val: boolean) => onChange(toBooleanValue(Boolean(val), config))}
          className={cn(
            "rounded",
            "dark:data-checked:text-primary-foreground",
            disabled &&
              (isChecked
                ? "bg-muted/70! border-border! text-muted-foreground!"
                : "bg-input/40! border-border/60!"),
          )}
        />
        <span
          className={cn(
            `${WIDGET_TAG} px-1.5 py-0.5 rounded border`,
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
