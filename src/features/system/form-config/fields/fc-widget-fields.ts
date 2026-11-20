/**
 * @fileoverview Contextual widget settings for FORM.CONFIG: one section per widget family.
 * Every setting here is honoured by the form engine (`@/components/cbs-form-engine`,
 * `@/lib/cbs-form-spec`). Value ranges are `VALIDATION.min` / `max`; text shaping is the
 * field's TRANSFORM (Rules tab), so nothing is configured in two places.
 *
 * Inspector specs set no DEFAULTVALUE: opening the inspector must never write settings into
 * the field. The engine's fallback is stated in each tooltip instead.
 *
 * @module features/system/form-config/fields/fc-widget-fields
 */

import type { FieldVisibilityCondition, FormElement, FormSection } from "@/lib/data-schemas";

function textSetting(
  sn: string,
  name: string,
  label: string,
  enrich: string,
  length = 20,
  visibleWhen?: FieldVisibilityCondition,
): FormElement {
  return {
    SN: sn,
    NAME: name,
    LABEL: label,
    TYPE: "String",
    STRUCTURE: "S",
    LENGTH: length,
    WIDTH: "full",
    ENRICHTEXT: enrich,
    ...(visibleWhen ? { VISIBLE_WHEN: visibleWhen } : {}),
  };
}

function numberSetting(sn: string, name: string, label: string, enrich: string): FormElement {
  return {
    SN: sn,
    NAME: name,
    LABEL: label,
    TYPE: "Number",
    STRUCTURE: "S",
    LENGTH: 15,
    WIDTH: "sm",
    ENRICHTEXT: enrich,
  };
}

function settingsSection(id: string, fields: FormElement[]): FormSection {
  return { id, containerType: "card", containerConfig: { variant: "ghost" }, columns: 1, fields };
}

/** Shown only for String columns: a Boolean column always stores true / false. */
const STRING_COLUMN_ONLY: FieldVisibilityCondition = {
  field: "TYPE",
  operator: "eq",
  value: "String",
};

const valueRange = (minSn: string, maxSn: string): FormElement[] => [
  numberSetting(minSn, "VALIDATION.min", "Minimum Value", "Lowest accepted value (inclusive)."),
  numberSetting(maxSn, "VALIDATION.max", "Maximum Value", "Highest accepted value (inclusive)."),
];

/** `number` and `amount`. */
const NUMBER_WIDGET_SECTION = settingsSection("sec_number_widget_rules", [
  textSetting(
    "1",
    "NUMBER_CONFIG.currencyCode",
    "Currency Badge",
    "Currency shown before the amount (default BDT).",
    5,
    { field: "WIDGET", operator: "eq", value: "amount" },
  ),
  numberSetting(
    "2",
    "NUMBER_CONFIG.decimals",
    "Decimal Places",
    "Maximum decimal places accepted (0 = whole numbers). Amounts display with 2 when unset.",
  ),
  ...valueRange("3", "4"),
]);

/** `rate`. */
const RATE_WIDGET_SECTION = settingsSection("sec_rate_widget_rules", [
  numberSetting(
    "1",
    "RATE_CONFIG.decimals",
    "Decimal Places",
    "Maximum decimal places accepted. Rates display with 4 when unset.",
  ),
  textSetting("2", "RATE_CONFIG.suffix", "Suffix Badge", "Shown after the value (default %).", 5),
  ...valueRange("3", "4"),
]);

/** `date` and `datetime`: the range applies to the calendar day. */
const DATE_WIDGET_SECTION = settingsSection("sec_date_widget_rules", [
  numberSetting(
    "1",
    "DATE_CONFIG.minDateOffset",
    "Earliest Date (days from today)",
    "0 = today, -30 = thirty days ago. The picker and validation both enforce it.",
  ),
  numberSetting(
    "2",
    "DATE_CONFIG.maxDateOffset",
    "Latest Date (days from today)",
    "0 = today, 365 = one year ahead. Leave empty for no limit.",
  ),
]);

/** `switch` and single `checkbox`. */
const BOOLEAN_WIDGET_SECTION = settingsSection("sec_boolean_widget_rules", [
  textSetting("1", "BOOLEAN_CONFIG.activeLabel", "On Label", "Badge text when on (default Yes)."),
  textSetting(
    "2",
    "BOOLEAN_CONFIG.inactiveLabel",
    "Off Label",
    "Badge text when off (default No).",
  ),
  textSetting(
    "3",
    "BOOLEAN_CONFIG.trueValue",
    "Stored Value When On",
    "Value written to the String column when on (e.g. Y). Empty stores true.",
    10,
    STRING_COLUMN_ONLY,
  ),
  textSetting(
    "4",
    "BOOLEAN_CONFIG.falseValue",
    "Stored Value When Off",
    "Value written to the String column when off (e.g. N). Empty stores false.",
    10,
    STRING_COLUMN_ONLY,
  ),
]);

export const WIDGET_DISPLAY_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  amount: "Amount",
  rate: "Rate",
  date: "Date",
  datetime: "Date & Time",
  time: "Time",
  select: "Select (Dropdown)",
  "radio-group": "Radio Group",
  segmented: "Segmented Bar",
  switch: "Switch",
  checkbox: "Checkbox",
  "checkbox-group": "Checkbox Group",
};

/**
 * The settings section for a widget, or null when the widget has none (text and textarea are
 * shaped by TRANSFORM and the pattern / length rules in the Rules tab; time has no settings).
 */
export function getContextualWidgetSection(widget: string): FormSection | null {
  switch (widget) {
    case "amount":
    case "number":
      return NUMBER_WIDGET_SECTION;
    case "rate":
      return RATE_WIDGET_SECTION;
    case "date":
    case "datetime":
      return DATE_WIDGET_SECTION;
    case "switch":
    case "checkbox":
      return BOOLEAN_WIDGET_SECTION;
    default:
      return null;
  }
}
