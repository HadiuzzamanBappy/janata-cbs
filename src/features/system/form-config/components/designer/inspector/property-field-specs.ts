import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormWidgetType } from "@/lib/data-schemas/form-engine-schema";

/**
 * Canonical FormEngine specifications for the Property Inspector.
 * Standardizes all Field and Container configurations using CBS FormEngine.
 */

export const FIELD_GENERAL_SECTION: FormSection = {
  id: "sec_field_general",
  title: "General Configuration",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "LABEL",
      LABEL: "Display Label",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 60,
      REQUIRED: true,
      WIDTH: "full",
      ENRICHTEXT: "User-facing label rendered on form scanlines.",
    },
    {
      SN: "2",
      NAME: "WIDTH",
      LABEL: "Display Width",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "md",
      PARAMETER: {
        type: "O",
        data: [
          { code: "xs", label: "XS - Extra Small (Short code / Currency)" },
          { code: "sm", label: "SM - Small (Account No, Date)" },
          { code: "md", label: "MD - Medium (Standard Input)" },
          { code: "lg", label: "LG - Large (Titles, Names)" },
          { code: "xl", label: "XL - Extra Large (Addresses)" },
          { code: "xxl", label: "XXL - Double Large (Narratives)" },
          { code: "full", label: "FULL - Full Row (100% Width)" },
        ],
      },
      ENRICHTEXT: "Responsive 12-column layout width token.",
    },
    {
      SN: "3",
      NAME: "REQUIRED",
      LABEL: "Required",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "checkbox",
      WIDTH: "sm",
      ENRICHTEXT: "Whether input is mandatory before commit.",
    },
    {
      SN: "4",
      NAME: "DISABLED",
      LABEL: "Disabled / Read-Only",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "checkbox",
      WIDTH: "sm",
      ENRICHTEXT: "Disallows manual edits by operator.",
    },
    {
      SN: "5",
      NAME: "ENRICHTEXT",
      LABEL: "Guidance Text / Placeholder",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 100,
      WIDTH: "full",
      ENRICHTEXT: "Contextual placeholder or help hint displayed on the scanline.",
    },
    {
      SN: "6",
      NAME: "DEFAULTVALUE",
      LABEL: "Default Value",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "md",
      ENRICHTEXT: "Pre-filled default populated for new records.",
    },
  ],
};

export const TEXT_CONFIG_SECTION: FormSection = {
  id: "sec_text_config",
  title: "Text Presentation Rules",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "TEXT_CONFIG.textTransform",
      LABEL: "Text Transform",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "uppercase",
      PARAMETER: {
        type: "O",
        data: [
          { code: "uppercase", label: "UPPERCASE (CBS Standard)" },
          { code: "lowercase", label: "lowercase" },
          { code: "none", label: "None (Standard Input)" },
        ],
      },
      ENRICHTEXT: "Enforce case conversion on user input.",
    },
    {
      SN: "2",
      NAME: "TEXT_CONFIG.maskPattern",
      LABEL: "Input Mask Pattern",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "md",
      ENRICHTEXT: "e.g. 9999-9999-9999, SWIFT, AAA-999",
    },
  ],
};

export const TEXTAREA_CONFIG_SECTION: FormSection = {
  id: "sec_textarea_config",
  title: "Textarea Presentation Rules",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "TEXT_CONFIG.textTransform",
      LABEL: "Text Transform",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "uppercase",
      PARAMETER: {
        type: "O",
        data: [
          { code: "uppercase", label: "UPPERCASE (CBS Standard)" },
          { code: "lowercase", label: "lowercase" },
          { code: "none", label: "None (Standard Input)" },
        ],
      },
    },
    {
      SN: "2",
      NAME: "TEXT_CONFIG.maskPattern",
      LABEL: "Input Mask Pattern",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "md",
    },
  ],
};

export const NUMBER_CONFIG_SECTION: FormSection = {
  id: "sec_number_config",
  title: "Numeric & Currency Rules",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "NUMBER_CONFIG.decimals",
      LABEL: "Decimal Precision",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 2,
      WIDTH: "xs",
      DEFAULTVALUE: "2",
      ENRICHTEXT: "Number of fractional decimal digits.",
    },
    {
      SN: "2",
      NAME: "NUMBER_CONFIG.currencyCode",
      LABEL: "Currency Prefix",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 5,
      WIDTH: "xs",
      ENRICHTEXT: "e.g. BDT, USD, EUR",
    },
    {
      SN: "3",
      NAME: "NUMBER_CONFIG.allowNegative",
      LABEL: "Allow Negative Numbers",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "checkbox",
      WIDTH: "sm",
      ENRICHTEXT: "Allows negative balances or debits.",
    },
  ],
};

export const RATE_CONFIG_SECTION: FormSection = {
  id: "sec_rate_config",
  title: "Rate / Percentage Rules",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "RATE_CONFIG.decimals",
      LABEL: "Rate Decimals",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 2,
      WIDTH: "xs",
      DEFAULTVALUE: "4",
      ENRICHTEXT: "Precision digits for interest or exchange rates.",
    },
    {
      SN: "2",
      NAME: "RATE_CONFIG.suffix",
      LABEL: "Rate Suffix",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 5,
      WIDTH: "xs",
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
      WIDGET: "checkbox",
      WIDTH: "sm",
    },
  ],
};

export const DATE_CONFIG_SECTION: FormSection = {
  id: "sec_date_config",
  title: "Date & Calendar Rules",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "DATE_CONFIG.datePattern",
      LABEL: "Date Format",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "YYYY-MM-DD",
      PARAMETER: {
        type: "O",
        data: [
          { code: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO Standard)" },
          { code: "DD/MM/YYYY", label: "DD/MM/YYYY (UK / Banking)" },
          { code: "DD-MMM-YYYY", label: "DD-MMM-YYYY (e.g. 15-JAN-2026)" },
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
      WIDGET: "checkbox",
      WIDTH: "sm",
      ENRICHTEXT: "Blocks non-clearing bank calendar holidays.",
    },
  ],
};

export const BOOLEAN_CONFIG_SECTION: FormSection = {
  id: "sec_boolean_config",
  title: "Boolean DB Values",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "BOOLEAN_CONFIG.trueValue",
      LABEL: "True Value (DB)",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDTH: "xs",
      DEFAULTVALUE: "Y",
      ENRICHTEXT: "Physical database representation when active (e.g. Y, 1, TRUE).",
    },
    {
      SN: "2",
      NAME: "BOOLEAN_CONFIG.falseValue",
      LABEL: "False Value (DB)",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDTH: "xs",
      DEFAULTVALUE: "N",
      ENRICHTEXT: "Physical database representation when inactive (e.g. N, 0, FALSE).",
    },
    {
      SN: "3",
      NAME: "BOOLEAN_CONFIG.activeLabel",
      LABEL: "Active Display Label",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "sm",
      DEFAULTVALUE: "Yes",
    },
    {
      SN: "4",
      NAME: "BOOLEAN_CONFIG.inactiveLabel",
      LABEL: "Inactive Display Label",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "sm",
      DEFAULTVALUE: "No",
    },
  ],
};

export const CONTAINER_CONFIG_SECTION: FormSection = {
  id: "sec_container_config",
  title: "Container Presentation",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "title",
      LABEL: "Container Title",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT:
        "Header title displayed above this group. Leave empty for default headerless card.",
    },
    {
      SN: "2",
      NAME: "columns",
      LABEL: "Grid Columns Layout",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "1",
      PARAMETER: {
        type: "O",
        data: [
          { code: "1", label: "1 Column (Standard Vertical Form)" },
          { code: "2", label: "2 Columns (Compact Dual-Column)" },
          { code: "3", label: "3 Columns (Wide Workbench)" },
          { code: "4", label: "4 Columns (Financial Grid)" },
        ],
      },
    },
    {
      SN: "3",
      NAME: "containerConfig.variant",
      LABEL: "Visual Variant",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "default",
      PARAMETER: {
        type: "O",
        data: [
          { code: "default", label: "Default" },
          { code: "subtle", label: "Subtle (Muted Background)" },
          { code: "bordered", label: "Bordered" },
          { code: "elevated", label: "Elevated (Floating Shadow)" },
        ],
      },
    },
    {
      SN: "4",
      NAME: "containerConfig.density",
      LABEL: "Density",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "select",
      WIDTH: "md",
      DEFAULTVALUE: "compact",
      PARAMETER: {
        type: "O",
        data: [
          { code: "compact", label: "Compact (High-Density Banking)" },
          { code: "normal", label: "Normal (Standard Padding)" },
          { code: "spacious", label: "Spacious (Roomy Padding)" },
        ],
      },
    },
    {
      SN: "5",
      NAME: "containerConfig.badge",
      LABEL: "Container Header Badge",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "md",
      ENRICHTEXT: "Optional status badge rendered in container header (e.g. MANDATORY, NEW).",
    },
  ],
};

/**
 * Returns the relevant sub-config FormSection based on the active widget type.
 */
export function getWidgetSubSection(widget: FormWidgetType): FormSection | null {
  switch (widget) {
    case "text":
      return TEXT_CONFIG_SECTION;
    case "textarea":
      return TEXTAREA_CONFIG_SECTION;
    case "amount":
    case "number":
      return NUMBER_CONFIG_SECTION;
    case "rate":
      return RATE_CONFIG_SECTION;
    case "date":
    case "datetime":
      return DATE_CONFIG_SECTION;
    case "checkbox":
    case "switch":
      return BOOLEAN_CONFIG_SECTION;
    default:
      return null;
  }
}
