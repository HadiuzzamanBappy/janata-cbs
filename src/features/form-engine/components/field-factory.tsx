import { Minus, Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useFieldOptions } from "../hooks/use-field-options";
import { useMultiValue } from "../hooks/use-multi-value";
import type { UnifiedFieldFactoryProps } from "../types";
import { getFieldWidthStyle, resolveWidgetType } from "../utils/widget-utils";
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
  const elementId = field.id || `elem_${field.SN}_${field.NAME}`;
  const isMulti = field.STRUCTURE === "M";

  // Resolve options & widget configuration
  const { param, resolvedOptions, modelLoading } = useFieldOptions(field);
  const widget = useMemo(() => resolveWidgetType(field.TYPE, param), [field.TYPE, param]);
  const inputStyle = useMemo(
    () => getFieldWidthStyle(field.LENGTH, widget, field.WIDTH),
    [field.LENGTH, widget, field.WIDTH],
  );
  const placeholder = field.ENRICHTEXT || field.DEFAULTVALUE || undefined;

  // Manage multi-value array states
  const { itemIds, arrayValues, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem } =
    useMultiValue(value, isMulti, onChange, fieldKey);

  const renderSingleWidget = (val: unknown, onValChange: (next: unknown) => void, rowId: string) => {
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
      inputStyle,
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
              required={field.REQUIRED && isFirst}
              error={isFirst ? error : undefined}
              indexSuffix={itemIdx + 1}
              actionBeforeColon={actionControls}
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

  // View Mode display text
  const viewDisplay =
    value !== undefined && value !== null && value !== ""
      ? Array.isArray(value)
        ? value.join(", ")
        : (resolvedOptions.find((o) => o.code === String(value))?.label ?? String(value))
      : undefined;

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
      style={inputStyle}
    >
      {renderSingleWidget(value, (newVal) => onChange(fieldKey, newVal), elementId)}
    </FieldRow>
  );
}
