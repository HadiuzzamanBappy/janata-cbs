/**
 * @fileoverview Field Property Inspector for Form Designer workbench.
 * Streamlined 3-tab inspector (Basics | Widget & Data | Rules) rendering physical DB anchor,
 * general specifications, contextual widget configuration, and reactive logic.
 *
 * @module features/system/form-config/components/designer/inspector/field-inspector
 */

"use client";

import { Boxes, Plus, ShieldCheck, Sliders, Trash2 } from "lucide-react";
import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { resolveWidgetType, setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  FORM_WIDGET_TYPES,
  type FormElement,
  type FormWidgetType,
  getCompatibleWidgets,
  type ModelProperty,
  type PropertyType,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { FIELD_GENERAL_PROPERTIES_SECTION } from "../../../fields/fc-field-fields";
import {
  getContextualWidgetSection,
  WIDGET_DISPLAY_LABELS,
} from "../../../fields/fc-widget-fields";
import { useDesignerContext } from "../context/designer-context";
import { InspectorLookupConfig } from "./inspector-lookup-config";
import { useFieldRuleView } from "./use-field-rule-view";

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
  const isArrayField = physicalType === CBS_PROPERTY_TYPE.ARRAY;

  const isPhysicalMulti = matchedModelProp?.STRUCTURE === CBS_PROPERTY_STRUCTURE.MULTI;
  const fieldStructure =
    field.STRUCTURE || matchedModelProp?.STRUCTURE || CBS_PROPERTY_STRUCTURE.SINGLE;
  const fieldLength = matchedModelProp?.LENGTH ?? field.LENGTH;
  const isDbRequired = Boolean(matchedModelProp?.REQUIRED);

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

  const { sections } = useDesignerContext();
  const {
    activeRules,
    availableRules,
    activeRuleSections,
    ruleValues,
    toRulePatch,
    getAddRulePatch,
    getRemoveRulePatch,
  } = useFieldRuleView(field, sections);

  const handleFieldPropertyChange = React.useCallback(
    (fieldKey: string, rawValue: unknown) => {
      // A cleared input removes the setting, so an empty number never reaches the schema as ""
      const value = rawValue === "" ? undefined : rawValue;
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
  }, [isArrayField, isPhysicalMulti, isDbRequired]);

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

      {/* 1. Widget Presentation Selector (Inapplicable for Array object containers) */}
      {!isArrayField && (
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
        <div className="space-y-3 pt-1">
          {/* Add Rule Toolbar */}
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configured Rules ({activeRules.size})
            </span>
            {availableRules.length > 0 && !disabled && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-2xs px-2 gap-1 cursor-pointer font-medium"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                      <span>Add Rule</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-auto min-w-44 p-1 text-xs">
                  {availableRules.map((r) => (
                    <DropdownMenuItem
                      key={r.kind}
                      onClick={() => onUpdateField(getAddRulePatch(r.kind))}
                      title={r.description}
                      className="cursor-pointer py-1 px-2 text-xs font-medium"
                    >
                      {r.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Empty State when no rules are configured */}
          {activeRuleSections.length === 0 ? (
            <div className="rounded border border-dashed border-border/70 p-4 text-center space-y-1.5 bg-muted/10">
              <ShieldCheck className="w-5 h-5 text-muted-foreground/40 mx-auto" />
              <p className="text-2xs text-muted-foreground font-medium">
                No active rules on this field.
              </p>
              <p className="text-3xs text-muted-foreground/60 max-w-55 mx-auto">
                Click <span className="font-semibold text-foreground">+ Add Rule</span> to attach
                validation, conditional visibility, cascades, or automation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRuleSections.map(({ kind, section }) => (
                <div key={section.id} className="relative group">
                  <div className="absolute right-2.5 top-2 z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdateField(getRemoveRulePatch(kind))}
                      disabled={disabled}
                      className="h-4 w-4 p-0 text-muted-foreground/60 hover:text-destructive hover:bg-transparent cursor-pointer"
                      title="Remove this rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <FormRenderer
                    frmElements={{ sections: [section] }}
                    values={ruleValues}
                    onChange={handleFieldPropertyChange}
                    disabled={disabled}
                    mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
                    layout="stacked"
                    className="overflow-visible"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
