import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/core-utils";
import { useFieldOptions } from "../hooks/use-field-options";
import { useMultiValue } from "../hooks/use-multi-value";
import type { UnifiedFieldFactoryProps } from "../types";
import { getInputWidthClass } from "../utils/section-utils";
import { resolveWidgetType } from "../utils/widget-utils";
import { renderFieldWidget } from "./widget-renderer";
import { FieldRow } from "./widgets/field-row";

export function UnifiedFieldFactory({
  field,
  value,
  onChange,
  error,
  disabled = false,
  mode = "I",
  labelOverride,
  labelSuffix,
  actionBeforeColon,
}: UnifiedFieldFactoryProps) {
  const isInputMode = mode === "I";
  const isViewMode = !isInputMode;
  const isReadOnly = disabled || field.DISABLED || isViewMode;
  const effectiveLabel = labelOverride ?? field.LABEL ?? field.NAME;
  const fieldKey = field.NAME;
  const elementId = `elem_${field.SN}_${field.NAME}`;
  // Resolve options & widget configuration
  const { param, resolvedOptions, modelLoading } = useFieldOptions(field);
  const widget = useMemo(
    () => resolveWidgetType(field.TYPE, param, field.WIDGET),
    [field.TYPE, param, field.WIDGET],
  );
  const isMulti = field.STRUCTURE === "M" && widget !== "checkbox" && widget !== "checkbox-group";
  const inputWidthClass = useMemo(
    () => getInputWidthClass(field.WIDTH, field.LENGTH, field.TYPE, widget),
    [field.WIDTH, field.LENGTH, field.TYPE, widget],
  );
  const effectiveEnrichText =
    field.ENRICHTEXT || ((field as Record<string, unknown>).enrichText as string) || undefined;

  // Resolve default value from field configuration if no value is set
  const rawDefault = field.DEFAULTVALUE ?? field.FIXEDVALUE;
  const effectiveDefault = useMemo(() => {
    if (rawDefault === undefined || rawDefault === null || rawDefault === "") {
      return undefined;
    }
    const normType = (field.TYPE || "").toLowerCase();
    if (normType === "number" || normType === "amount" || normType === "rate") {
      const n = Number(rawDefault);
      return Number.isNaN(n) ? rawDefault : n;
    }
    if (normType === "boolean") {
      const lower = String(rawDefault).toLowerCase().trim();
      return lower === "true" || lower === "1" || lower === "y";
    }
    return rawDefault;
  }, [rawDefault, field.TYPE]);

  // Use DEFAULTVALUE only on initial mount when value is strictly undefined or null (never when user cleared to "")
  const effectiveValue =
    value !== undefined && value !== null
      ? value
      : isInputMode && effectiveDefault !== undefined
        ? effectiveDefault
        : (value ?? "");

  const placeholder = typeof rawDefault === "string" ? rawDefault : undefined;

  // Auto-populate form kernel state with default value on creation when no value was provided
  const hasAppliedDefault = useRef(false);
  useEffect(() => {
    if (
      isInputMode &&
      !hasAppliedDefault.current &&
      (value === undefined || value === null) &&
      effectiveDefault !== undefined
    ) {
      hasAppliedDefault.current = true;
      onChange(fieldKey, effectiveDefault);
    }
  }, [isInputMode, value, effectiveDefault, fieldKey, onChange]);

  // Manage multi-value array states
  const { itemIds, arrayValues, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem } =
    useMultiValue(effectiveValue, isMulti, onChange, fieldKey);

  // View Mode display text (computed unconditionally at top level for React Rule of Hooks)
  const viewDisplay = useMemo(() => {
    if (value === undefined || value === null || value === "") return undefined;
    if (Array.isArray(value)) return value.join(", ");

    const matchedOption = resolvedOptions.find((o) => o.code === String(value));
    if (matchedOption) return matchedOption.label;

    const normType = (field.TYPE || "").toLowerCase();
    if (normType === "amount") {
      return formatCurrency(value as number | string, {
        currency: field.NUMBER_CONFIG?.currencyCode || "BDT",
        decimals: field.NUMBER_CONFIG?.decimals ?? 2,
      });
    }
    if (normType === "rate") {
      const num = Number(value);
      const dec = field.RATE_CONFIG?.decimals ?? 4;
      const suf = field.RATE_CONFIG?.suffix ?? "%";
      return Number.isNaN(num) ? `${String(value)}${suf}` : `${num.toFixed(dec)}${suf}`;
    }
    if (normType === "boolean") {
      const lower = String(value).toLowerCase().trim();
      const isTrue = lower === "true" || lower === "y" || lower === "1";
      return isTrue
        ? field.BOOLEAN_CONFIG?.activeLabel || "Yes"
        : field.BOOLEAN_CONFIG?.inactiveLabel || "No";
    }

    return String(value);
  }, [
    value,
    resolvedOptions,
    field.TYPE,
    field.NUMBER_CONFIG,
    field.RATE_CONFIG,
    field.BOOLEAN_CONFIG,
  ]);

  const renderSingleWidget = (
    val: unknown,
    onValChange: (next: unknown) => void,
    rowId: string,
  ) => {
    return renderFieldWidget({
      widget,
      field,
      fieldKey,
      rowId,
      value: val,
      onChange: onValChange,
      isReadOnly,
      error,
      placeholder,
      resolvedOptions,
      modelLoading,
      effectiveLabel,
    });
  };

  // Multi-Value Mode (M)
  if (isMulti) {
    return (
      <div className="space-y-1.5">
        {arrayValues.map((itemVal, itemIdx) => {
          const stableKey = itemIds[itemIdx] || `${elementId}-item-${itemIdx}`;
          const isFirst = itemIdx === 0;

          const actionControls = !isReadOnly ? (
            <div className="flex items-center gap-0.5 shrink-0">
              {arrayValues.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArrayItem(itemIdx)}
                  className="size-5 p-0 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  title="Remove this item"
                >
                  <Minus className="size-3.5 stroke-[2.5]" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleAddArrayItem(itemIdx)}
                className="size-5 p-0 text-primary hover:bg-primary/10 rounded cursor-pointer"
                title={`Insert another ${effectiveLabel} after item .${itemIdx + 1}`}
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </Button>
            </div>
          ) : undefined;

          return (
            <FieldRow
              key={stableKey}
              id={isFirst ? elementId : undefined}
              label={effectiveLabel}
              required={Boolean(field.REQUIRED)}
              error={isFirst ? error : undefined}
              indexSuffix={itemIdx + 1}
              enrichText={isFirst ? effectiveEnrichText : undefined}
              actionBeforeColon={actionControls}
              inputClassName={inputWidthClass}
            >
              {renderSingleWidget(
                itemVal,
                (newVal) => handleArrayChange(itemIdx, newVal),
                `${elementId}_${itemIdx}`,
              )}
            </FieldRow>
          );
        })}
      </div>
    );
  }

  // Single-Value Mode
  return (
    <FieldRow
      id={elementId}
      label={effectiveLabel}
      required={field.REQUIRED}
      error={error}
      isViewMode={isViewMode}
      viewDisplayValue={viewDisplay}
      labelSuffix={labelSuffix}
      actionBeforeColon={actionBeforeColon}
      enrichText={effectiveEnrichText}
      inputClassName={inputWidthClass}
    >
      {renderSingleWidget(effectiveValue, (newVal) => onChange(fieldKey, newVal), elementId)}
    </FieldRow>
  );
}
