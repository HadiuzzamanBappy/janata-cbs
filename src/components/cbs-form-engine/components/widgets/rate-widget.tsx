/**
 * @fileoverview High-Density Percentage & Rate Input Widget
 * @module form-engine/widgets/rate-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Monospace numeric input with fixed rate suffix badge ("%").
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";
import { WIDGET_DISABLED_FIELD, WIDGET_TAG, WIDGET_TEXT } from "./widget-styles";

export interface RateWidgetProps extends BaseWidgetProps {
  suffix?: string;
}

export function RateWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  error,
  placeholder = "0.0000",
  className,
  suffix = "%",
}: RateWidgetProps) {
  return (
    <div className={cn("relative flex items-center w-full min-w-0", className)}>
      <Input
        type="number"
        step="any"
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          `h-7 ${WIDGET_TEXT} font-mono bg-background rounded border-border/80 w-full pr-6 focus-visible:ring-0 focus-visible:border-foreground/50`,
          error && "border-destructive focus-visible:border-destructive",
          disabled && WIDGET_DISABLED_FIELD,
        )}
      />
      <span
        className={`absolute right-2 ${WIDGET_TAG} text-muted-foreground select-none pointer-events-none`}
      >
        {suffix}
      </span>
    </div>
  );
}
