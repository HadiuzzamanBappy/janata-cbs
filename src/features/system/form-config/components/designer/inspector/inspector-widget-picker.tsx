/**
 * @fileoverview Widget presentation picker of the field inspector: every widget, eligible ones
 * first, with the reason an ineligible one is disabled.
 *
 * @module features/system/form-config/components/designer/inspector/inspector-widget-picker
 */

"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/core-utils";
import {
  FORM_WIDGET_TYPES,
  type FormWidgetType,
  getCompatibleWidgets,
  type PropertyStructure,
  type PropertyType,
  widgetIneligibleReason,
} from "@/lib/data-schemas";
import { WIDGET_DISPLAY_LABELS } from "../../../fields/fc-widget-fields";

export interface InspectorWidgetPickerProps {
  currentWidget: FormWidgetType;
  physicalType: PropertyType;
  structure: PropertyStructure;
  length?: number;
  /** A model lookup locks the widget to `select`. */
  modelName: string;
  disabled: boolean;
  onSelect: (widget: FormWidgetType) => void;
}

export function InspectorWidgetPicker({
  currentWidget,
  physicalType,
  structure,
  length,
  modelName,
  disabled,
  onSelect,
}: InspectorWidgetPickerProps) {
  const eligibleWidgetsSet = React.useMemo(
    () => new Set(getCompatibleWidgets({ type: physicalType, structure, length, modelName })),
    [physicalType, structure, length, modelName],
  );

  // Eligible widgets first (in canonical category order), then the ineligible (disabled) ones
  const sortedWidgets = React.useMemo(
    () =>
      [...FORM_WIDGET_TYPES].sort(
        (a, b) => Number(eligibleWidgetsSet.has(b)) - Number(eligibleWidgetsSet.has(a)),
      ),
    [eligibleWidgetsSet],
  );

  // The same rules that decide eligibility explain it (form-widget-schema)
  const reasonFor = (w: FormWidgetType): string =>
    widgetIneligibleReason(
      { type: physicalType, structure, length, modelName },
      w,
      WIDGET_DISPLAY_LABELS[w] || w,
    ) ?? "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-2xs font-medium text-foreground">Widget Presentation</Label>
        <span className="text-3xs font-mono font-bold text-primary uppercase">{currentWidget}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {sortedWidgets.map((w) => {
          const isSelected = currentWidget === w;
          const isEligible = eligibleWidgetsSet.has(w);
          const isDisabled = disabled || !isEligible;

          return (
            <button
              key={w}
              type="button"
              disabled={isDisabled}
              onClick={() => isEligible && onSelect(w)}
              title={
                isDisabled
                  ? reasonFor(w) || WIDGET_DISPLAY_LABELS[w] || w
                  : WIDGET_DISPLAY_LABELS[w] || w
              }
              className={cn(
                "h-6 px-2 text-3xs rounded transition-all duration-150 capitalize",
                isSelected &&
                  "bg-primary text-primary-foreground font-semibold shadow-2xs cursor-pointer",
                isEligible &&
                  !isSelected &&
                  "border border-border/70 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer",
                !isEligible &&
                  "border border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed opacity-45 select-none",
              )}
            >
              {WIDGET_DISPLAY_LABELS[w] || w}
            </button>
          );
        })}
      </div>
    </div>
  );
}
