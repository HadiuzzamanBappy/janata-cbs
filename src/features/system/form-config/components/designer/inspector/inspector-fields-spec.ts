import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormWidgetType } from "@/lib/data-schemas/form-engine-schema";

/**
 * Standard Form Sections definition for Root Canvas Layout Properties.
 * Contains only canvas-level layout and density settings.
 */
export const ROOT_FORM_PROPERTIES_SECTION: FormSection = {
  id: "sec_root_canvas_props",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "columns",
      LABEL: "Grid Columns Layout",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "1",
      PARAMETER: {
        type: "O",
        data: [
          { code: "1", label: "1 Col" },
          { code: "2", label: "2 Col" },
          { code: "3", label: "3 Col" },
          { code: "4", label: "4 Col" },
        ],
      },
      ENRICHTEXT: "Default column grid arrangement for root canvas blocks.",
    },
    {
      SN: "2",
      NAME: "density",
      LABEL: "Canvas Density",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "compact",
      PARAMETER: {
        type: "O",
        data: [
          { code: "compact", label: "Compact" },
          { code: "normal", label: "Normal" },
          { code: "spacious", label: "Spacious" },
        ],
      },
      ENRICHTEXT: "Visual spacing and density across form sections.",
    },
  ],
};

/**
 * Standard Form Sections definition for Field Properties in the Inspector.
 * Uses Janata CBS FormEngine specifications (identical to fields.ts).
 */
export const FIELD_GENERAL_PROPERTIES_SECTION: FormSection = {
  id: "sec_field_general",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "LABEL",
      LABEL: "Display Label",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 80,
      REQUIRED: true,
      WIDTH: "full",
      ENRICHTEXT: "User-facing label rendered on form scanlines.",
    },
    {
      SN: "2",
      NAME: "WIDTH",
      LABEL: "Layout Width",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "md",
      PARAMETER: {
        type: "O",
        data: [
          { code: "xs", label: "XS" },
          { code: "sm", label: "SM" },
          { code: "md", label: "MD" },
          { code: "lg", label: "LG" },
          { code: "xl", label: "XL" },
          { code: "full", label: "FULL" },
        ],
      },
      ENRICHTEXT: "12-column responsive layout width token.",
    },
    {
      SN: "3",
      NAME: "REQUIRED",
      LABEL: "Required Field",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        widgetStyle: "switch",
        trueValue: "true",
        falseValue: "false",
        activeLabel: "Mandatory",
        inactiveLabel: "Optional",
      },
      ENRICHTEXT: "Whether input is mandatory before commit.",
    },
    {
      SN: "4",
      NAME: "DISABLED",
      LABEL: "Read-Only / Disabled",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        widgetStyle: "switch",
        trueValue: "true",
        falseValue: "false",
        activeLabel: "Disabled",
        inactiveLabel: "Editable",
      },
      ENRICHTEXT: "Disallows manual operator input.",
    },
    {
      SN: "5",
      NAME: "ENRICHTEXT",
      LABEL: "Placeholder / Guidance Text",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 120,
      WIDTH: "full",
      ENRICHTEXT: "Contextual placeholder or help hint displayed on the scanline.",
    },
    {
      SN: "6",
      NAME: "DEFAULTVALUE",
      LABEL: "Default Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT: "Pre-filled default populated for new records.",
    },
  ],
};

/**
 * Standard Form Section for Container Properties (Cards and Tab Groups).
 */
export const CONTAINER_PROPERTIES_SECTION: FormSection = {
  id: "sec_container_props",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "title",
      LABEL: "Container Title",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT:
        "Header title displayed above this container. Leave empty for default headerless card.",
    },
    {
      SN: "2",
      NAME: "columns",
      LABEL: "Grid Columns Layout",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "1",
      PARAMETER: {
        type: "O",
        data: [
          { code: "1", label: "1 Col" },
          { code: "2", label: "2 Col" },
          { code: "3", label: "3 Col" },
          { code: "4", label: "4 Col" },
        ],
      },
      ENRICHTEXT: "Number of equal responsive columns inside this section.",
    },
    {
      SN: "3",
      NAME: "collapsible",
      LABEL: "Collapsible Card",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        widgetStyle: "switch",
        trueValue: "true",
        falseValue: "false",
        activeLabel: "Yes",
        inactiveLabel: "No",
      },
      ENRICHTEXT: "Allows operators to collapse and expand this section.",
    },
    {
      SN: "4",
      NAME: "containerConfig.variant",
      LABEL: "Visual Variant",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "default",
      PARAMETER: {
        type: "O",
        data: [
          { code: "default", label: "Default" },
          { code: "subtle", label: "Subtle" },
          { code: "bordered", label: "Bordered" },
          { code: "elevated", label: "Elevated" },
        ],
      },
    },
    {
      SN: "5",
      NAME: "containerConfig.density",
      LABEL: "Density",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "compact",
      PARAMETER: {
        type: "O",
        data: [
          { code: "compact", label: "Compact" },
          { code: "normal", label: "Normal" },
          { code: "spacious", label: "Spacious" },
        ],
      },
    },
    {
      SN: "6",
      NAME: "containerConfig.badge",
      LABEL: "Header Badge",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "full",
      ENRICHTEXT: "Optional status badge rendered in container header (e.g. MANDATORY, NEW).",
    },
  ],
};

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
      SN: "2",
      NAME: "NUMBER_CONFIG.currencyCode",
      LABEL: "Currency Prefix",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 5,
      WIDTH: "sm",
      ENRICHTEXT: "Currency code prefix (e.g. BDT, USD, EUR).",
    },
    {
      SN: "3",
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
    default:
      return null;
  }
}
