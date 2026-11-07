import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { WidgetOption } from "../types";
import { AmountWidget } from "./widgets/amount-widget";
import { CheckboxGroupWidget } from "./widgets/checkbox-group-widget";
import { CheckboxWidget } from "./widgets/checkbox-widget";
import { DateWidget } from "./widgets/date-widget";
import { RadioWidget } from "./widgets/radio-widget";
import { RateWidget } from "./widgets/rate-widget";
import { SelectWidget } from "./widgets/select-widget";
import { SwitchWidget } from "./widgets/switch-widget";
import { TextWidget } from "./widgets/text-widget";
import { TextareaWidget } from "./widgets/textarea-widget";

export interface WidgetRendererProps {
  widget: string;
  field: FormElement;
  fieldKey: string;
  rowId: string;
  value: unknown;
  onChange: (next: unknown) => void;
  isReadOnly: boolean;
  error?: string;
  placeholder?: string;
  resolvedOptions: WidgetOption[];
  modelLoading: boolean;
  effectiveLabel: string;
}

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
      return (
        <DateWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          type={widget === "datetime" ? "datetime-local" : "date"}
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
        />
      );
    case "radio":
    case "radio-group":
      return (
        <RadioWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          options={resolvedOptions}
          variant={field.WIDGET === "segmented" ? "group" : "standard"}
        />
      );
    case "segmented":
      return (
        <RadioWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          options={resolvedOptions}
          variant="group"
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
        />
      );
  }
}
