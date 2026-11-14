/**
 * @fileoverview High-Density Boolean Switch Widget
 * @module form-engine/widgets/switch-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Compact banking toggle switch with active/inactive label badge.
 */

import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface SwitchWidgetProps extends BaseWidgetProps {
  activeLabel?: string;
  inactiveLabel?: string;
}

export function SwitchWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  className,
  activeLabel = "Yes",
  inactiveLabel = "No",
}: SwitchWidgetProps) {
  const isChecked = Boolean(value);

  return (
    <div className={cn("flex items-center gap-2 max-w-md flex-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "relative inline-flex items-center gap-2 select-none",
          disabled ? "cursor-default opacity-85" : "cursor-pointer",
        )}
      >
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={id}
            disabled={disabled}
            checked={isChecked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-60 peer-disabled:cursor-default" />
        </div>
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
            isChecked
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
