/**
 * @fileoverview High-Density Boolean Switch Widget
 * @module form-engine/widgets/switch-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Compact banking toggle switch with active/inactive label badge.
 */

import { isBooleanOn, toBooleanValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { BooleanWidgetConfig } from "@/lib/data-schemas";
import type { BaseWidgetProps } from "../../types";
import { WIDGET_DISABLED_CHOICE, WIDGET_TAG } from "./widget-styles";

export interface SwitchWidgetProps extends BaseWidgetProps {
  /** Labels and on / off wire values (BOOLEAN_CONFIG). */
  config?: BooleanWidgetConfig;
}

export function SwitchWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  className,
  config,
}: SwitchWidgetProps) {
  const isChecked = isBooleanOn(value, config);
  const activeLabel = config?.activeLabel || "Yes";
  const inactiveLabel = config?.inactiveLabel || "No";

  return (
    <div className={cn("flex items-center gap-2 max-w-md flex-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "relative inline-flex items-center gap-2 select-none",
          disabled ? WIDGET_DISABLED_CHOICE : "cursor-pointer",
        )}
      >
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={id}
            disabled={disabled}
            checked={isChecked}
            onChange={(e) => onChange(toBooleanValue(e.target.checked, config))}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary peer-disabled:cursor-not-allowed" />
        </div>
        <span
          className={cn(
            `${WIDGET_TAG} px-1.5 py-0.5 rounded border`,
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
