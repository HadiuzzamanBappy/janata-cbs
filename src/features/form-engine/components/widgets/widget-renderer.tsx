/**
 * @fileoverview Form Widget Resolver & Dynamic Dispatcher
 * @module form-engine/widget-renderer
 *
 * Core Invariants:
 * - Exhaustive routing from FormWidgetType to concrete high-density widget components.
 * - Enforces BaseWidgetProps contract across all widgets.
 * - Handles specialized widget variants (e.g. segmented radio group, multiline date/time).
 */

import type { WidgetRendererProps } from "../../types";
import { AmountWidget } from "./amount-widget";
import { CheckboxGroupWidget } from "./checkbox-group-widget";
import { CheckboxWidget } from "./checkbox-widget";
import { DateWidget } from "./date-widget";
import { RadioWidget } from "./radio-widget";
import { RateWidget } from "./rate-widget";
import { SelectWidget } from "./select-widget";
import { SwitchWidget } from "./switch-widget";
import { TextWidget } from "./text-widget";
import { TextareaWidget } from "./textarea-widget";

export type { WidgetRendererProps };

/**
 * Dispatches a field to its concrete presentation widget based on normalized widget type.
 *
 * @param props Normalized widget renderer props.
 * @returns Rendered JSX widget element.
 */
export function renderFieldWidget({
  widget,
  field,
  fieldKey,
  rowId,
  value,
  onChange,
  isReadOnly,
  error,
  placeholder,
  resolvedOptions,
  modelLoading,
  effectiveLabel,
}: WidgetRendererProps) {
  switch (widget) {
    case "select":
    case "combobox":
      return (
        <SelectWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          placeholder={placeholder}
          options={resolvedOptions}
          loading={modelLoading}
          isNumeric={field.TYPE.toLowerCase() === "number"}
          label={effectiveLabel}
        />
      );
    case "date":
    case "datetime":
    case "time":
      return (
        <DateWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          type={widget === "datetime" ? "datetime-local" : widget === "time" ? "time" : "date"}
        />
      );
    case "textarea":
      return (
        <TextareaWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          placeholder={placeholder}
        />
      );
    case "switch":
      return (
        <SwitchWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          activeLabel={field.BOOLEAN_CONFIG?.activeLabel}
          inactiveLabel={field.BOOLEAN_CONFIG?.inactiveLabel}
        />
      );
    case "radio":
    case "radio-group":
    case "segmented":
      return (
        <RadioWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          options={resolvedOptions}
          variant={widget === "segmented" || field.WIDGET === "segmented" ? "group" : "standard"}
        />
      );
    case "checkbox":
      if (resolvedOptions && resolvedOptions.length > 0) {
        return (
          <CheckboxGroupWidget
            id={rowId}
            fieldKey={fieldKey}
            value={value}
            onChange={onChange}
            disabled={isReadOnly}
            options={resolvedOptions}
          />
        );
      }
      return (
        <CheckboxWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          activeLabel={field.BOOLEAN_CONFIG?.activeLabel}
          inactiveLabel={field.BOOLEAN_CONFIG?.inactiveLabel}
        />
      );
    case "checkbox-group":
      return (
        <CheckboxGroupWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          options={resolvedOptions}
        />
      );
    case "amount":
      return (
        <AmountWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          placeholder={placeholder}
          currencyPrefix={field.NUMBER_CONFIG?.currencyCode || "BDT"}
        />
      );
    case "rate":
      return (
        <RateWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          placeholder={placeholder || "0.0000"}
          suffix={field.RATE_CONFIG?.suffix || "%"}
        />
      );
    case "number":
      return (
        <TextWidget
          type="number"
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          placeholder={placeholder}
        />
      );
    default:
      return (
        <TextWidget
          type="text"
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          placeholder={placeholder}
          config={field.TEXT_CONFIG}
        />
      );
  }
}
