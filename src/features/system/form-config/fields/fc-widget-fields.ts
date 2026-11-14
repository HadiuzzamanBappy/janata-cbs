/**
 * @fileoverview Contextual widget presentation specifications for FORM.CONFIG.
 * Defines type-specific rule forms for text, number, rate, date, and boolean widgets.
 *
 * @module features/system/form-config/fields/fc-widget-fields
 */

import type { FormSection, FormWidgetType } from "@/lib/data-schemas";

/**
 * Text & Textarea Presentation Rules
 */
export const TEXT_WIDGET_SECTION: FormSection = {
  id: "sec_text_widget_rules",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "TEXT_CONFIG.textTransform",
      LABEL: "Text Transform",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "uppercase",
      PARAMETER: {
        type: "O",
        data: [
          { code: "uppercase", label: "UPPER" },
          { code: "lowercase", label: "lower" },
          { code: "none", label: "None" },
        ],
      },
      ENRICHTEXT: "Auto-casing rule enforced on input.",
    },
    {
      SN: "2",
      NAME: "TEXT_CONFIG.maskPattern",
      LABEL: "Input Mask Pattern",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "full",
      ENRICHTEXT: "e.g. 9999-9999-9999, SWIFT, AAA-999",
    },
    {
      SN: "3",
      NAME: "TEXT_CONFIG.autoTrim",
      LABEL: "Auto-Trim Whitespace",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "true",
      ENRICHTEXT: "Automatically strips leading and trailing spaces.",
    },
  ],
};

/**
 * Number & Amount Presentation Rules
 */
export const NUMBER_WIDGET_SECTION: FormSection = {
  id: "sec_number_widget_rules",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "NUMBER_CONFIG.isCurrency",
      LABEL: "Format as Currency",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      ENRICHTEXT: "Renders standard financial comma-separated amount display.",
    },
    {
      SN: "2",
      NAME: "NUMBER_CONFIG.currencyCode",
      LABEL: "Currency Prefix",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 5,
      WIDTH: "sm",
      DEFAULTVALUE: "BDT",
      ENRICHTEXT: "Currency code prefix (e.g. BDT, USD, EUR).",
    },
    {
      SN: "3",
      NAME: "NUMBER_CONFIG.decimals",
      LABEL: "Decimals Precision",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 2,
      WIDTH: "sm",
      DEFAULTVALUE: "2",
      ENRICHTEXT: "Number of fractional decimal digits.",
    },
    {
      SN: "4",
      NAME: "NUMBER_CONFIG.allowNegative",
      LABEL: "Allow Negative Numbers",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      ENRICHTEXT: "Allows negative balances or debits.",
    },
    {
      SN: "5",
      NAME: "NUMBER_CONFIG.minValue",
      LABEL: "Minimum Allowed Value",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDTH: "md",
      ENRICHTEXT: "Hard lower numerical boundary limit.",
    },
    {
      SN: "6",
      NAME: "NUMBER_CONFIG.maxValue",
      LABEL: "Maximum Allowed Value",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDTH: "md",
      ENRICHTEXT: "Hard upper numerical boundary limit.",
    },
  ],
};

/**
 * Rate Presentation Rules
 */
export const RATE_WIDGET_SECTION: FormSection = {
  id: "sec_rate_widget_rules",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "RATE_CONFIG.decimals",
      LABEL: "Rate Decimals",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 2,
      WIDTH: "sm",
      DEFAULTVALUE: "4",
      ENRICHTEXT: "Precision digits for interest or exchange rates.",
    },
    {
      SN: "2",
      NAME: "RATE_CONFIG.suffix",
      LABEL: "Rate Suffix",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 5,
      WIDTH: "sm",
      DEFAULTVALUE: "%",
      ENRICHTEXT: "Display suffix (e.g. %, bps).",
    },
    {
      SN: "3",
      NAME: "RATE_CONFIG.allowNegative",
      LABEL: "Allow Negative Rate",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
    },
    {
      SN: "4",
      NAME: "RATE_CONFIG.minValue",
      LABEL: "Minimum Rate",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 8,
      WIDTH: "sm",
      ENRICHTEXT: "Lower limit for rate input.",
    },
    {
      SN: "5",
      NAME: "RATE_CONFIG.maxValue",
      LABEL: "Maximum Rate",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 8,
      WIDTH: "sm",
      ENRICHTEXT: "Upper limit for rate input.",
    },
  ],
};

/**
 * Date Presentation Rules
 */
export const DATE_WIDGET_SECTION: FormSection = {
  id: "sec_date_widget_rules",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "DATE_CONFIG.datePattern",
      LABEL: "Date Format",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "YYYY-MM-DD",
      PARAMETER: {
        type: "O",
        data: [
          { code: "YYYY-MM-DD", label: "YYYY-MM-DD" },
          { code: "DD/MM/YYYY", label: "DD/MM/YYYY" },
          { code: "DD-MMM-YYYY", label: "DD-MMM-YYYY" },
        ],
      },
    },
    {
      SN: "2",
      NAME: "DATE_CONFIG.minDateOffset",
      LABEL: "Min Date Offset",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDTH: "sm",
      ENRICHTEXT: "Relative offset from today (e.g. -30d, -1y).",
    },
    {
      SN: "3",
      NAME: "DATE_CONFIG.maxDateOffset",
      LABEL: "Max Date Offset",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDTH: "sm",
      ENRICHTEXT: "Relative offset from today (e.g. +30d, +1y).",
    },
    {
      SN: "4",
      NAME: "DATE_CONFIG.disableHolidays",
      LABEL: "Exclude Bank Holidays",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      ENRICHTEXT: "Blocks non-clearing bank calendar holidays.",
    },
  ],
};

/**
 * Boolean Presentation Rules
 */
export const BOOLEAN_WIDGET_SECTION: FormSection = {
  id: "sec_boolean_widget_rules",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "BOOLEAN_CONFIG.widgetStyle",
      LABEL: "Control Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "switch",
      PARAMETER: {
        type: "O",
        data: [
          { code: "switch", label: "Switch" },
          { code: "checkbox", label: "Checkbox" },
        ],
      },
      ENRICHTEXT: "Visual presentation toggle style on form scanline.",
    },
    {
      SN: "2",
      NAME: "BOOLEAN_CONFIG.activeLabel",
      LABEL: "Active State Label",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "full",
      DEFAULTVALUE: "Enabled",
      ENRICHTEXT: "Label rendered when value is true (e.g. Enabled, Active, Yes).",
    },
    {
      SN: "3",
      NAME: "BOOLEAN_CONFIG.inactiveLabel",
      LABEL: "Inactive State Label",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "full",
      DEFAULTVALUE: "Disabled",
      ENRICHTEXT: "Label rendered when value is false (e.g. Disabled, Inactive, No).",
    },
    {
      SN: "4",
      NAME: "BOOLEAN_CONFIG.trueValue",
      LABEL: "True Wire Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDTH: "sm",
      DEFAULTVALUE: "Y",
      ENRICHTEXT: "Serialized value sent to backend core when checked (default 'Y').",
    },
    {
      SN: "5",
      NAME: "BOOLEAN_CONFIG.falseValue",
      LABEL: "False Wire Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDTH: "sm",
      DEFAULTVALUE: "N",
      ENRICHTEXT: "Serialized value sent to backend core when unchecked (default 'N').",
    },
  ],
};

/**
 * Returns contextual sub-section for widget rules.
 */
export function getContextualWidgetSection(widget: FormWidgetType): FormSection | null {
  switch (widget) {
    case "text":
    case "textarea":
      return TEXT_WIDGET_SECTION;
    case "amount":
    case "number":
      return NUMBER_WIDGET_SECTION;
    case "rate":
      return RATE_WIDGET_SECTION;
    case "date":
    case "datetime":
    case "time":
      return DATE_WIDGET_SECTION;
    case "switch":
    case "checkbox":
      return BOOLEAN_WIDGET_SECTION;
    default:
      return null;
  }
}
