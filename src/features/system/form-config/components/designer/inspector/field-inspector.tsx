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
import { FormRenderer } from "@/components/cbs-form-engine";
import { Label } from "@/components/ui/label";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import {
  FORM_WIDGET_TYPES,
  type FormElement,
  type FormWidgetType,
  getCompatibleWidgets,
  getDefaultWidgetForType,
  type ModelProperty,
  type PropertyType,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import {
  FIELD_ADVANCED_RULES_SECTION,
  FIELD_CONDITIONS_SECTION,
  FIELD_GENERAL_PROPERTIES_SECTION,
  FIELD_ON_CHANGE_SECTION,
  FIELD_VISIBILITY_SECTION,
} from "../../../fields/fc-field-fields";
import {
  getContextualWidgetSection,
  WIDGET_DISPLAY_LABELS,
} from "../../../fields/fc-widget-fields";
import { InspectorLookupConfig } from "./inspector-lookup-config";

export interface FieldInspectorProps {
  field: FormElement;
  matchedModelProp: ModelProperty | null;
  baseType?: "TEXT" | "NUMBER" | "DATE";
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

type FieldInspectorTab = "basics" | "widget" | "rules";

export function FieldInspector({
  field,
  matchedModelProp,
  baseType: _baseType,
  onUpdateField,
  disabled = false,
  errors = {},
}: FieldInspectorProps) {
  const [activeTab, setActiveTab] = React.useState<FieldInspectorTab>("basics");

  const physicalType = (matchedModelProp?.TYPE || field.TYPE || "String") as PropertyType;
  const currentWidget = (field.WIDGET || getDefaultWidgetForType(physicalType)) as FormWidgetType;

  const isPhysicalMulti = matchedModelProp?.STRUCTURE === "M";
  const fieldStructure =
    (field.STRUCTURE as "S" | "M") || (matchedModelProp?.STRUCTURE as "S" | "M") || "S";
  const fieldLength = matchedModelProp?.LENGTH ?? field.LENGTH;
  const isDbRequired = Boolean(matchedModelProp?.REQUIRED);

  const modelName = (
    matchedModelProp?.MODELNAME ||
    (field as FormElement & { MODELNAME?: string }).MODELNAME ||
    ""
  ).trim();
  const hasModel = Boolean(modelName);

  const eligibleWidgetsSet = React.useMemo(() => {
    return new Set(
      getCompatibleWidgets({
        type: physicalType,
        structure: fieldStructure,
        length: fieldLength,
        modelName,
      }),
    );
  }, [physicalType, fieldStructure, fieldLength, modelName]);

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

  const getIneligibleReason = React.useCallback(
    (w: FormWidgetType): string => {
      if (hasModel && w !== "select") return `Locked to Select (Dropdown) for model ${modelName}`;
      if (w === "checkbox-group" && fieldStructure !== "M") {
        return "Checkbox Group requires Multi-Value (M) structure";
      }
      if (
        ["radio-group", "segmented", "checkbox", "switch"].includes(w) &&
        fieldStructure === "M"
      ) {
        return `${WIDGET_DISPLAY_LABELS[w] || w} requires Single (S) structure`;
      }
      if (w === "textarea" && (fieldLength ?? 0) < 80) {
        return "Textarea requires column length >= 80 characters";
      }
      return `Incompatible with ${physicalType} data type`;
    },
    [hasModel, modelName, fieldStructure, fieldLength, physicalType],
  );

  const handleFieldPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      // Invariant: Physical Single column in DB can never be changed to Multi on form
      if (fieldKey === "STRUCTURE" && value === "M" && matchedModelProp?.STRUCTURE !== "M") {
        return;
      }
      // Invariant: Database mandatory column can never be made optional on form
      if (fieldKey === "REQUIRED" && value === false && isDbRequired) {
        return;
      }
      // Invariant: Model columns must remain Select (Dropdown)
      if (hasModel && fieldKey === "WIDGET" && value !== "select") {
        return;
      }
      // Automatic cascade: If switching structure from M to S and current widget is checkbox-group, switch to select
      if (fieldKey === "STRUCTURE" && value === "S" && field.WIDGET === "checkbox-group") {
        const updated = setFieldValue(field as Record<string, unknown>, fieldKey, value);
        const finalObj = setFieldValue(updated, "WIDGET", "select");
        onUpdateField(finalObj as Partial<FormElement>);
        return;
      }
      const updated = setFieldValue(field as Record<string, unknown>, fieldKey, value);
      onUpdateField(updated as Partial<FormElement>);
    },
    [field, onUpdateField, matchedModelProp, isDbRequired, hasModel],
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
        if (f.NAME === "REQUIRED" && isDbRequired) {
          return {
            ...f,
            DISABLED: true,
            ENRICHTEXT:
              "Column is mandatory in database schema (MODEL.CONFIG) and cannot be made optional on forms.",
          };
        }
        return f;
      }),
    };
  }, [isPhysicalMulti, isDbRequired]);

  const effectiveFieldValues = React.useMemo(() => {
    if (isDbRequired && !field.REQUIRED) {
      return { ...field, REQUIRED: true } as Record<string, unknown>;
    }
    return field as Record<string, unknown>;
  }, [field, isDbRequired]);

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
    () => [
      FIELD_ADVANCED_RULES_SECTION,
      FIELD_VISIBILITY_SECTION,
      FIELD_CONDITIONS_SECTION,
      FIELD_ON_CHANGE_SECTION,
    ],
    [],
  );

  return (
    <div className="space-y-3 p-3 select-none text-xs">
      {/* 0. Physical Schema Definition Anchor */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/30 rounded border border-border/70 text-3xs font-mono">
        <span className="font-bold text-foreground truncate max-w-30">
          {field.NAME || matchedModelProp?.NAME}
        </span>
        <span className="text-muted-foreground/40">|</span>
        <span className="px-1 rounded bg-muted text-muted-foreground font-semibold">
          {physicalType}
          {fieldLength ? `(${fieldLength})` : ""}
        </span>
        <span className="px-1 rounded bg-muted text-muted-foreground">
          {fieldStructure === "M" ? "Multi (M)" : "Single (S)"}
        </span>
        {isDbRequired ? (
          <span className="px-1 rounded bg-destructive/10 text-destructive font-semibold">
            NOT NULL
          </span>
        ) : (
          <span className="px-1 rounded bg-muted text-muted-foreground/60">NULL</span>
        )}
        {modelName && (
          <span className="px-1 rounded bg-primary/10 text-primary font-semibold truncate max-w-25">
            FK: {modelName}
          </span>
        )}
      </div>

      {/* 1. Widget Presentation Selector (Always Visible at Top of Inspector) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-2xs font-medium text-foreground">Widget Presentation</Label>
          <span className="text-3xs font-mono font-bold text-primary uppercase">
            {currentWidget}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {sortedWidgets.map((w) => {
            const isSelected = currentWidget === w;
            const isEligible = eligibleWidgetsSet.has(w);
            const isWidgetLocked = hasModel && w !== "select";
            const isDisabled = disabled || !isEligible || isWidgetLocked;

            return (
              <button
                key={w}
                type="button"
                disabled={isDisabled}
                onClick={() => isEligible && !isWidgetLocked && onUpdateField({ WIDGET: w })}
                title={isDisabled ? getIneligibleReason(w) : WIDGET_DISPLAY_LABELS[w] || w}
                className={cn(
                  "h-6 px-2 text-3xs rounded transition-all duration-150 capitalize",
                  isSelected &&
                    "bg-primary text-primary-foreground font-semibold shadow-2xs cursor-pointer",
                  isEligible &&
                    !isSelected &&
                    !isWidgetLocked &&
                    "border border-border/70 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer",
                  (!isEligible || isWidgetLocked) &&
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
        {(
          [
            { id: "basics", label: "Basics", icon: Sliders },
            {
              id: "widget",
              label: isSelectionWidget ? "Options & Data" : "Widget Config",
              icon: Boxes,
            },
            { id: "rules", label: "Rules", icon: ShieldCheck },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 h-6 text-2xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
              activeTab === id
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <Icon className="size-3" />
            {label}
          </button>
        ))}
      </div>

      {/* 4. Tab Pane 1: Basics (Field Identity, Width, Mandatory, Read-Only, Tooltip) */}
      {activeTab === "basics" && (
        <div className="space-y-2 pt-1">
          <FormRenderer
            frmElements={{ sections: [generalPropertiesSection] }}
            values={effectiveFieldValues}
            onChange={handleFieldPropertyChange}
            errors={errors}
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
              modelName={modelName}
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
            <div className="text-2xs text-muted-foreground/60 italic py-2">
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
