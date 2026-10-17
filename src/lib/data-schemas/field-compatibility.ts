import type { FormWidgetType } from "./form-config-schema";
import { formWidgetTypeSchema } from "./form-config-schema";
import type { PropertyType } from "./model-config-schema";

/* -------------------------------------------------------------------------- */
/* Widget ↔ Model Property Type Compatibility Dictionary                      */
/* -------------------------------------------------------------------------- */

/**
 * Single source of truth mapping a Model Property data type (MODEL.CONFIG)
 * to its allowed visual presentation widgets (FORM.CONFIG / FORM-ENGINE).
 *
 * Rules:
 *  - Number can be rendered as a number input, amount field, or single-choice select/radio
 *    (e.g. Tenor: 12, 24, 36 months → Dropdown)
 *  - Dropdown and Radio are interchangeable single-choice presentations (same underlying data)
 *  - Boolean supports switch toggle only (true/false — no text alternative)
 *  - Checkbox/Array are multi-value collections
 *  - Object is handled structurally by the container (section-card), not as a field widget
 */
export const WIDGET_COMPATIBILITY_MAP: Record<PropertyType, FormWidgetType[]> = {
  Text: ["text", "textarea", "account-lookup"],
  Number: ["number", "amount", "select", "radio", "radio-group"],
  Date: ["date"],
  Boolean: ["switch"],
  Textarea: ["textarea", "text"],
  Dropdown: ["select", "radio", "radio-group"],
  Radio: ["radio", "radio-group", "select"],
  Checkbox: ["checkbox-group"],
  Array: ["checkbox-group"],
  Object: ["text"], // Structural — container handles rendering, not field-factory
};

/**
 * Human-readable labels and descriptions for all supported form widget types.
 * Used in the Form Config property inspector dropdown.
 */
export const WIDGET_LABELS: Record<FormWidgetType, { label: string; description: string }> = {
  text: { label: "Single-line Text", description: "Standard text input field" },
  number: { label: "Numeric Input", description: "Direct numeric entry with spin button" },
  amount: { label: "Amount / Currency", description: "Currency-formatted input with prefix" },
  date: { label: "Calendar Date Picker", description: "Date selection with calendar modal" },
  select: { label: "Dropdown Select", description: "Standard select dropdown menu" },
  radio: { label: "Radio List (Vertical)", description: "Vertical radio button list" },
  "radio-group": { label: "Segmented Buttons", description: "Horizontal pill/button group" },
  "checkbox-group": { label: "Multi-Checkbox Group", description: "Multiple choice checkbox tags" },
  textarea: { label: "Multi-line Text Area", description: "Expandable multiline text block" },
  switch: { label: "Boolean Toggle Switch", description: "On/Off binary toggle" },
  "account-lookup": {
    label: "CBS Account Lookup",
    description: "Account number picker with search",
  },
};

/* -------------------------------------------------------------------------- */
/* Helper Functions                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns the list of widgets allowed for a given model property type.
 * If no model type is provided (unbound / custom field), all widgets are available.
 */
export function getCompatibleWidgets(modelType?: PropertyType): FormWidgetType[] {
  if (!modelType) return formWidgetTypeSchema.options as FormWidgetType[];
  return WIDGET_COMPATIBILITY_MAP[modelType] ?? ["text"];
}

/**
 * Checks whether a specific widget is valid for a given model property type.
 */
export function isWidgetCompatible(
  modelType: PropertyType | undefined,
  widget: FormWidgetType,
): boolean {
  if (!modelType) return true;
  return (WIDGET_COMPATIBILITY_MAP[modelType] ?? []).includes(widget);
}

/**
 * Returns the default (best-fit) widget for a model property type.
 * Used when placing a field from the palette for the first time.
 */
export function getDefaultWidget(modelType: PropertyType): FormWidgetType {
  return WIDGET_COMPATIBILITY_MAP[modelType]?.[0] ?? "text";
}
