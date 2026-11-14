/**
 * @fileoverview Field Property Inspector for Form Designer workbench.
 * Streamlined inspector rendering physical DB anchor, general specifications,
 * contextual widget rules, lookup binding, and reactive collapsible sections via Form Engine.
 *
 * @module features/system/form-config/components/designer/inspector/field-inspector
 */

"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { FormRenderer } from "@/features/form-engine";
import {
  FIELD_ADVANCED_RULES_SECTION,
  FIELD_ANCHOR_SECTION,
  FIELD_CONDITIONS_SECTION,
  FIELD_GENERAL_PROPERTIES_SECTION,
  FIELD_ON_CHANGE_SECTION,
} from "@/features/system/form-config/fields/fc-field-fields";
import { getContextualWidgetSection } from "@/features/system/form-config/fields/fc-widget-fields";
import { setFieldValue } from "@/lib/cbs-form-spec";
import {
  COMPATIBLE_WIDGETS_FOR_TYPE,
  type FormElement,
  type FormSection,
  type FormWidgetType,
  type ModelProperty,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { InspectorLookupConfig } from "./inspector-lookup-config";

export interface FieldInspectorProps {
  field: FormElement;
  matchedModelProp: ModelProperty | null;
  baseType: "TEXT" | "NUMBER" | "DATE";
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

/**
 * Physical Model Anchor view rendered in native CBS SEE mode via FormRenderer.
 */
function FieldAnchorView({
  selectedField,
  matchedModelProp,
}: {
  selectedField: FormElement;
  matchedModelProp: ModelProperty | null;
}) {
  const anchorValues = React.useMemo(
    () => ({
      NAME: selectedField.NAME,
      SN: `#${selectedField.SN}`,
      PHYSICAL_TYPE: matchedModelProp?.TYPE || selectedField.TYPE || "Text",
      STRUCTURE: selectedField.STRUCTURE === "M" ? "Multi-Value (M)" : "Single (S)",
    }),
    [selectedField, matchedModelProp],
  );

  return (
    <FormRenderer
      frmElements={{ sections: [FIELD_ANCHOR_SECTION] }}
      values={anchorValues}
      mode={CbsRecordFunction.SEE}
      hideHeader
      layout="horizontal"
    />
  );
}

export function FieldInspector({
  field,
  matchedModelProp,
  baseType,
  onUpdateField,
  disabled = false,
}: FieldInspectorProps) {
  const currentWidget = (field.WIDGET ||
    (baseType === "NUMBER" ? "amount" : baseType === "DATE" ? "date" : "text")) as FormWidgetType;

  const normalizedTypeName = (
    baseType === "NUMBER" ? "Number" : baseType === "DATE" ? "Date" : "Text"
  ) as keyof typeof COMPATIBLE_WIDGETS_FOR_TYPE;

  const compatibleWidgets = COMPATIBLE_WIDGETS_FOR_TYPE[normalizedTypeName] || ["text"];

  const handleFieldPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const updated = setFieldValue(field as Record<string, unknown>, fieldKey, value);
      onUpdateField(updated as Partial<FormElement>);
    },
    [field, onUpdateField],
  );

  const contextualSection = React.useMemo(
    () => getContextualWidgetSection(currentWidget),
    [currentWidget],
  );

  // Group all editable sections together for unified FormEngine rendering
  const editableSections = React.useMemo<FormSection[]>(() => {
    const list: FormSection[] = [FIELD_GENERAL_PROPERTIES_SECTION];
    if (contextualSection) list.push(contextualSection);
    list.push(FIELD_ADVANCED_RULES_SECTION, FIELD_ON_CHANGE_SECTION, FIELD_CONDITIONS_SECTION);
    return list;
  }, [contextualSection]);

  const isSelectionWidget =
    currentWidget === "select" ||
    currentWidget === "radio-group" ||
    currentWidget === "segmented" ||
    currentWidget === "checkbox-group";

  return (
    <div className="space-y-3.5 p-3 select-none text-xs">
      {/* 1. Physical DB Model Anchor (Horizontal View Mode) */}
      <FieldAnchorView selectedField={field} matchedModelProp={matchedModelProp} />

      {/* 2. Widget Presentation Selector */}
      <div className="space-y-1.5 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium text-foreground">Widget Presentation</Label>
          <span className="text-[10px] font-mono font-bold text-primary uppercase">
            {currentWidget}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {compatibleWidgets.map((w) => {
            const isSelected = currentWidget === w;
            return (
              <button
                key={w}
                type="button"
                disabled={disabled}
                onClick={() => onUpdateField({ WIDGET: w })}
                className={
                  isSelected
                    ? "h-6 px-2 text-[10px] font-semibold rounded bg-primary text-primary-foreground shadow-2xs cursor-pointer capitalize"
                    : "h-6 px-2 text-[10px] rounded border border-border/70 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer capitalize"
                }
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Lookup / Data Source Binding (if selection widget) */}
      {isSelectionWidget && (
        <InspectorLookupConfig
          selectedField={field}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
      )}

      {/* 4. Unified Form Engine Specification (General + Contextual + Collapsible Rules) */}
      <FormRenderer
        frmElements={{ sections: editableSections }}
        values={field as Record<string, unknown>}
        onChange={handleFieldPropertyChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
      />
    </div>
  );
}
