/**
 * @fileoverview Field Property Inspector for Form Designer workbench.
 * Streamlined 3-tab inspector (Basics | Widget & Data | Rules) rendering physical DB anchor,
 * general specifications, contextual widget configuration, and reactive logic.
 *
 * @module features/system/form-config/components/designer/inspector/field-inspector
 */

"use client";

import { Boxes, ShieldCheck, Sliders } from "lucide-react";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { FormRenderer } from "@/features/form-engine";
import {
  FIELD_ADVANCED_RULES_SECTION,
  FIELD_CONDITIONS_SECTION,
  FIELD_GENERAL_PROPERTIES_SECTION,
  FIELD_ON_CHANGE_SECTION,
} from "@/features/system/form-config/fields/fc-field-fields";
import { getContextualWidgetSection } from "@/features/system/form-config/fields/fc-widget-fields";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import {
  COMPATIBLE_WIDGETS_FOR_TYPE,
  FORM_WIDGET_TYPES,
  type FormElement,
  type FormWidgetType,
  getDefaultWidgetForType,
  type ModelProperty,
  type PropertyType,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { InspectorLookupConfig } from "./inspector-lookup-config";

export interface FieldInspectorProps {
  field: FormElement;
  matchedModelProp: ModelProperty | null;
  baseType?: "TEXT" | "NUMBER" | "DATE";
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

type FieldInspectorTab = "basics" | "widget" | "rules";

const WIDGET_DISPLAY_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  amount: "Amount",
  rate: "Rate",
  date: "Date",
  datetime: "Date & Time",
  time: "Time",
  select: "Select (Dropdown)",
  "radio-group": "Radio Group",
  segmented: "Segmented Bar",
  switch: "Switch",
  checkbox: "Checkbox",
  "checkbox-group": "Checkbox Group",
};

export function FieldInspector({
  field,
  matchedModelProp,
  baseType: _baseType,
  onUpdateField,
  disabled = false,
}: FieldInspectorProps) {
  const [activeTab, setActiveTab] = React.useState<FieldInspectorTab>("basics");

  const physicalType = (matchedModelProp?.TYPE || field.TYPE || "String") as PropertyType;
  const currentWidget = (field.WIDGET || getDefaultWidgetForType(physicalType)) as FormWidgetType;

  const eligibleWidgetsSet = React.useMemo(() => {
    return new Set(COMPATIBLE_WIDGETS_FOR_TYPE[physicalType] || COMPATIBLE_WIDGETS_FOR_TYPE.String);
  }, [physicalType]);

  // Sort: All eligible widgets appear first (in canonical category order), followed by ineligible (disabled) widgets
  const sortedWidgets = React.useMemo(() => {
    const list = [...FORM_WIDGET_TYPES];
    return list.sort((a, b) => {
      const aEligible = eligibleWidgetsSet.has(a);
      const bEligible = eligibleWidgetsSet.has(b);
      if (aEligible && !bEligible) return -1;
      if (!aEligible && bEligible) return 1;
      return 0;
    });
  }, [eligibleWidgetsSet]);

  const isPhysicalMulti = matchedModelProp?.STRUCTURE === "M";

  const handleFieldPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      // Invariant: Physical Single column in DB can never be changed to Multi on form
      if (fieldKey === "STRUCTURE" && value === "M" && matchedModelProp?.STRUCTURE !== "M") {
        return;
      }
      const updated = setFieldValue(field as Record<string, unknown>, fieldKey, value);
      onUpdateField(updated as Partial<FormElement>);
    },
    [field, onUpdateField, matchedModelProp],
  );

  const generalPropertiesSection = React.useMemo(() => {
    return {
      ...FIELD_GENERAL_PROPERTIES_SECTION,
      fields: FIELD_GENERAL_PROPERTIES_SECTION.fields.map((f) => {
        if (f.NAME === "STRUCTURE") {
          return {
            ...f,
            DISABLED: !isPhysicalMulti,
            ENRICHTEXT: !isPhysicalMulti
              ? "Physical DB column is single-valued (S) and cannot be changed to Multi-Value."
              : "Physical DB column is multi-valued (M). You can keep as Multi (M) or capture a Single (S) item.",
          };
        }
        return f;
      }),
    };
  }, [isPhysicalMulti]);

  const contextualSection = React.useMemo(
    () => getContextualWidgetSection(currentWidget),
    [currentWidget],
  );

  const isSelectionWidget =
    currentWidget === "select" ||
    currentWidget === "radio-group" ||
    currentWidget === "segmented" ||
    currentWidget === "checkbox-group";

  const rulesSections = React.useMemo(
    () => [FIELD_ADVANCED_RULES_SECTION, FIELD_CONDITIONS_SECTION, FIELD_ON_CHANGE_SECTION],
    [],
  );

  return (
    <div className="space-y-3 p-3 select-none text-xs">
      {/* 1. Widget Presentation Selector (Always Visible at Top of Inspector) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium text-foreground">Widget Presentation</Label>
          <span className="text-[10px] font-mono font-bold text-primary uppercase">
            {currentWidget}
          </span>
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
                onClick={() => isEligible && onUpdateField({ WIDGET: w })}
                title={
                  !isEligible
                    ? `Incompatible with ${physicalType} data type`
                    : WIDGET_DISPLAY_LABELS[w] || w
                }
                className={cn(
                  "h-6 px-2 text-[10px] rounded transition-all duration-150 capitalize",
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

      {/* 3. Three-Tab Navigation Strip (Basics | Widget Config | Rules) */}
      <div className="flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/70 gap-0.5 select-none">
        <button
          type="button"
          onClick={() => setActiveTab("basics")}
          className={cn(
            "flex-1 h-6 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
            activeTab === "basics"
              ? "bg-background text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40",
          )}
        >
          <Sliders className="size-3" />
          Basics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("widget")}
          className={cn(
            "flex-1 h-6 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
            activeTab === "widget"
              ? "bg-background text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40",
          )}
        >
          <Boxes className="size-3" />
          {isSelectionWidget ? "Options & Data" : "Widget Config"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={cn(
            "flex-1 h-6 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
            activeTab === "rules"
              ? "bg-background text-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40",
          )}
        >
          <ShieldCheck className="size-3" />
          Rules
        </button>
      </div>

      {/* 4. Tab Pane 1: Basics (Field Identity, Width, Mandatory, Read-Only, Tooltip) */}
      {activeTab === "basics" && (
        <div className="space-y-2 pt-1">
          <FormRenderer
            frmElements={{ sections: [generalPropertiesSection] }}
            values={field as Record<string, unknown>}
            onChange={handleFieldPropertyChange}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
            hideHeader
            layout="stacked"
            className="overflow-visible"
          />
        </div>
      )}

      {/* 5. Tab Pane 2: Widget Config & Data (Contextual Config) */}
      {activeTab === "widget" && (
        <div className="space-y-2 pt-1">
          {isSelectionWidget ? (
            <InspectorLookupConfig
              selectedField={field}
              onUpdateField={onUpdateField}
              disabled={disabled}
            />
          ) : contextualSection ? (
            <FormRenderer
              frmElements={{ sections: [contextualSection] }}
              values={field as Record<string, unknown>}
              onChange={handleFieldPropertyChange}
              disabled={disabled}
              mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
              hideHeader
              layout="stacked"
              className="overflow-visible"
            />
          ) : (
            <div className="text-[11px] text-muted-foreground/60 italic py-2">
              Standard presentation with no additional configuration required.
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Pane 3: Rules (Validation, Conditional Visibility, Automation) */}
      {activeTab === "rules" && (
        <div className="space-y-4 pt-1">
          <FormRenderer
            frmElements={{ sections: rulesSections }}
            values={field as Record<string, unknown>}
            onChange={handleFieldPropertyChange}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
            layout="stacked"
            className="overflow-visible"
          />
        </div>
      )}
    </div>
  );
}
