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
import { deriveSemanticWidth, resolveWidgetType, setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  CHOICE_WIDGETS,
  type FormElement,
  type ModelProperty,
  type PropertyType,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { AUTO_WIDTH, FIELD_GENERAL_PROPERTIES_SECTION } from "../../../fields/fc-field-fields";
import { getContextualWidgetSection } from "../../../fields/fc-widget-fields";
import { useDesignerContext } from "../context/designer-context";
import { InspectorLookupConfig } from "./inspector-lookup-config";
import { InspectorRulesPane } from "./inspector-rules-pane";
import { InspectorWidgetPicker } from "./inspector-widget-picker";
import { useFieldRuleView } from "./use-field-rule-view";

export interface FieldInspectorProps {
  field: FormElement;
  matchedModelProp: ModelProperty | null;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

type FieldInspectorTab = "basics" | "widget" | "rules";

export function FieldInspector({
  field,
  matchedModelProp,
  onUpdateField,
  disabled = false,
  errors = {},
}: FieldInspectorProps) {
  const [activeTab, setActiveTab] = React.useState<FieldInspectorTab>("basics");

  const physicalType = (matchedModelProp?.TYPE ||
    field.TYPE ||
    CBS_PROPERTY_TYPE.STRING) as PropertyType;
  const isArrayField = physicalType === CBS_PROPERTY_TYPE.ARRAY;

  const isPhysicalMulti = matchedModelProp?.STRUCTURE === CBS_PROPERTY_STRUCTURE.MULTI;
  const fieldStructure =
    field.STRUCTURE || matchedModelProp?.STRUCTURE || CBS_PROPERTY_STRUCTURE.SINGLE;
  const fieldLength = matchedModelProp?.LENGTH ?? field.LENGTH;
  const isDbRequired = Boolean(matchedModelProp?.REQUIRED);
  const lengthWidth = deriveSemanticWidth(undefined, fieldLength, physicalType);

  const modelName = (matchedModelProp?.MODELNAME || field.MODELNAME || "").trim();
  const hasModel = Boolean(modelName);
  // The widget the engine renders (lookups resolve to select), so the inspector matches the form
  const currentWidget = resolveWidgetType(
    physicalType,
    field.PARAMETER,
    field.WIDGET,
    fieldStructure,
    {
      length: fieldLength,
      modelName,
    },
  );

  const { sections } = useDesignerContext();
  const ruleView = useFieldRuleView(field, sections);
  const { activeRules, toRulePatch } = ruleView;

  const handleFieldPropertyChange = React.useCallback(
    (fieldKey: string, rawValue: unknown) => {
      // A cleared input removes the setting, so an empty number never reaches the schema as ""
      const value = rawValue === "" ? undefined : rawValue;
      // AUTO clears the width, so the form derives it from the column length again
      if (fieldKey === "WIDTH" && value === AUTO_WIDTH) {
        onUpdateField({ WIDTH: undefined });
        return;
      }
      const rulePatch = toRulePatch(fieldKey, value);
      if (rulePatch) {
        onUpdateField(rulePatch);
        return;
      }
      // Invariant: Physical Single column in DB can never be changed to Multi on form
      if (
        fieldKey === "STRUCTURE" &&
        value === CBS_PROPERTY_STRUCTURE.MULTI &&
        matchedModelProp?.STRUCTURE !== CBS_PROPERTY_STRUCTURE.MULTI
      ) {
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
      if (
        fieldKey === "STRUCTURE" &&
        value === CBS_PROPERTY_STRUCTURE.SINGLE &&
        field.WIDGET === "checkbox-group"
      ) {
        const updated = setFieldValue(field as Record<string, unknown>, fieldKey, value);
        const finalObj = setFieldValue(updated, "WIDGET", "select");
        onUpdateField(finalObj as Partial<FormElement>);
        return;
      }
      const updated = setFieldValue(field as Record<string, unknown>, fieldKey, value);
      onUpdateField(updated as Partial<FormElement>);
    },
    [field, onUpdateField, matchedModelProp, isDbRequired, hasModel, toRulePatch],
  );

  const generalPropertiesSection = React.useMemo(() => {
    const baseFields = isArrayField
      ? FIELD_GENERAL_PROPERTIES_SECTION.fields.filter(
          (f) => f.NAME !== "DEFAULTVALUE" && f.NAME !== "FIXEDVALUE",
        )
      : FIELD_GENERAL_PROPERTIES_SECTION.fields;

    return {
      ...FIELD_GENERAL_PROPERTIES_SECTION,
      fields: baseFields.map((f) => {
        if (f.NAME === "STRUCTURE") {
          return {
            ...f,
            DISABLED: !isPhysicalMulti,
            ENRICHTEXT: !isPhysicalMulti
              ? "Physical DB column is single-valued (S) and cannot be changed to Multi-Value."
              : "Physical DB column is multi-valued (M). You can keep as Multi (M) or capture a Single (S) item.",
          };
        }
        if (f.NAME === "WIDTH") {
          return {
            ...f,
            ENRICHTEXT: `AUTO follows the column length (now ${lengthWidth.toUpperCase()}); a size fixes the width.`,
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
  }, [isArrayField, isPhysicalMulti, isDbRequired, lengthWidth]);

  const effectiveFieldValues = React.useMemo(
    () =>
      ({
        ...field,
        WIDTH: field.WIDTH ?? AUTO_WIDTH,
        ...(isDbRequired ? { REQUIRED: true } : {}),
      }) as Record<string, unknown>,
    [field, isDbRequired],
  );

  const contextualSection = React.useMemo(
    () => getContextualWidgetSection(currentWidget),
    [currentWidget],
  );

  const isSelectionWidget = CHOICE_WIDGETS.has(currentWidget);

  const hasWidgetConfig = !isArrayField && (isSelectionWidget || Boolean(contextualSection));
  const effectiveTab = !hasWidgetConfig && activeTab === "widget" ? "basics" : activeTab;

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
          {fieldStructure === CBS_PROPERTY_STRUCTURE.MULTI ? "Multi (M)" : "Single (S)"}
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

      {/* 1. Widget Presentation Selector (Inapplicable for Array object containers) */}
      {!isArrayField && (
        <InspectorWidgetPicker
          currentWidget={currentWidget}
          physicalType={physicalType}
          structure={fieldStructure}
          length={fieldLength}
          modelName={modelName}
          disabled={disabled}
          onSelect={(w) => onUpdateField({ WIDGET: w })}
        />
      )}

      {/* 3. Tab Navigation Strip (Basics | Widget Config | Rules) */}
      <div className="flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/70 gap-0.5 select-none">
        {(
          [
            { id: "basics", label: "Basics", icon: Sliders },
            ...(hasWidgetConfig
              ? [
                  {
                    id: "widget" as const,
                    label: isSelectionWidget ? "Options & Data" : "Widget Config",
                    icon: Boxes,
                  },
                ]
              : []),
            {
              id: "rules",
              label: activeRules.size > 0 ? `Rules (${activeRules.size})` : "Rules",
              icon: ShieldCheck,
            },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 h-6 text-2xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
              effectiveTab === id
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
      {effectiveTab === "basics" && (
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
      {hasWidgetConfig && effectiveTab === "widget" && (
        <div className="space-y-2 pt-1">
          {isSelectionWidget ? (
            <InspectorLookupConfig
              selectedField={field}
              onUpdateField={onUpdateField}
              disabled={disabled}
              modelName={modelName}
            />
          ) : (
            contextualSection && (
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
            )
          )}
        </div>
      )}

      {/* 6. Tab Pane 3: Rules (Validation, Conditional Visibility, Automation) */}
      {effectiveTab === "rules" && (
        <InspectorRulesPane
          ruleView={ruleView}
          onUpdateField={onUpdateField}
          onChange={handleFieldPropertyChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
