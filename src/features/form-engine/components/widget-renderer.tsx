import type { FormFieldItem } from "@/lib/data-schemas/form-config-schema";
import type { WidgetOption } from "../types";
import { AmountWidget } from "./widgets/amount-widget";
import { CheckboxGroupWidget } from "./widgets/checkbox-group-widget";
import { DateWidget } from "./widgets/date-widget";
import { RadioWidget } from "./widgets/radio-widget";
import { SelectWidget } from "./widgets/select-widget";
import { SwitchWidget } from "./widgets/switch-widget";
import { TextWidget } from "./widgets/text-widget";
import { TextareaWidget } from "./widgets/textarea-widget";

export interface WidgetRendererProps {
  widget: string;
  field: FormFieldItem;
  fieldKey: string;
  rowId: string;
  value: unknown;
  onChange: (next: unknown) => void;
  isReadOnly: boolean;
  error?: string;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
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
  inputStyle,
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
          style={inputStyle}
          options={resolvedOptions}
          loading={modelLoading}
          isNumeric={field.TYPE.toLowerCase() === "number"}
          label={effectiveLabel}
        />
      );
    case "date":
      return (
        <DateWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          error={error}
          style={inputStyle}
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
          style={inputStyle}
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
      return (
        <RadioWidget
          id={rowId}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          options={resolvedOptions}
          variant="standard"
        />
      );
    case "radio-group":
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
          style={inputStyle}
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
          style={inputStyle}
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
          style={inputStyle}
        />
      );
  }
}
