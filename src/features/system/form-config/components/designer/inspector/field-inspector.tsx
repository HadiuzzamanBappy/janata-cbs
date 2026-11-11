"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import {
  COMPATIBLE_WIDGETS_FOR_TYPE,
  type FormElement,
  type FormWidgetType,
} from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { InspectorAnchorSection } from "./inspector-anchor-section";
import {
  FIELD_GENERAL_PROPERTIES_SECTION,
  getContextualWidgetSection,
} from "./inspector-fields-spec";
import { InspectorLookupConfig } from "./inspector-lookup-config";

export interface FieldInspectorProps {
  field: FormElement;
  matchedModelProp: ModelProperty | null;
  baseType: "TEXT" | "NUMBER" | "DATE";
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
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

  return (
    <div className="space-y-3.5 p-3 select-none text-xs">
      {/* 1. Physical DB Model Anchor */}
      <InspectorAnchorSection
        selectedField={field}
        matchedModelProp={matchedModelProp}
        baseType={baseType}
      />

      {/* 2. General Field Properties (Rendered via FormEngine from JSON spec) */}
      <FormRenderer
        frmElements={{ sections: [FIELD_GENERAL_PROPERTIES_SECTION] }}
        values={field as Record<string, unknown>}
        onChange={handleFieldPropertyChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
      />

      {/* 3. Widget Presentation Selector */}
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

      {/* 4. Contextual Widget Rules (Rendered via FormEngine from JSON spec) */}
      {contextualSection && (
        <div className="pt-2 border-t border-border/50">
          <FormRenderer
            frmElements={{ sections: [contextualSection] }}
            values={field as Record<string, unknown>}
            onChange={handleFieldPropertyChange}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
            hideHeader
            layout="stacked"
          />
        </div>
      )}

      {/* 5. Select / Lookup Binding */}
      {(currentWidget === "select" ||
        currentWidget === "radio-group" ||
        currentWidget === "segmented") && (
        <InspectorLookupConfig
          selectedField={field}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
      )}
    </div>
  );
}
