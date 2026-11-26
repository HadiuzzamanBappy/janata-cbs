/**
 * @fileoverview Field presentation, anchor, and reactive rules specifications for FORM.CONFIG.
 * General field properties (Basics tab). Rules-tab specs live in `fc-rule-fields.ts`.
 *
 * @module features/system/form-config/fields/fc-field-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/** Layout Width choice for an unset WIDTH (the form derives it from the column length). Never stored. */
export const AUTO_WIDTH = "auto";

/**
 * Standard Form Sections definition for Field Properties in the Inspector.
 * Uses Janata CBS FormEngine specifications.
 */
export const FIELD_GENERAL_PROPERTIES_SECTION: FormSection = {
  id: "sec_field_general",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "STRUCTURE",
      LABEL: "Input Structure",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "S",
      PARAMETER: {
        type: "O",
        data: [
          { code: "S", label: "Single (S)" },
          { code: "M", label: "Multi-Value (M)" },
        ],
      },
      ENRICHTEXT: "Capture a single value or a repeatable multi-value array on the form.",
    },
    {
      SN: "2",
      NAME: "REQUIRED",
      LABEL: "Required Field",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        activeLabel: "Mandatory",
        inactiveLabel: "Optional",
      },
      ENRICHTEXT: "Whether input is mandatory before commit.",
    },
    {
      SN: "3",
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
      SN: "4",
      NAME: "WIDTH",
      LABEL: "Layout Width",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: AUTO_WIDTH, label: "AUTO" },
          { code: "xs", label: "XS" },
          { code: "sm", label: "SM" },
          { code: "md", label: "MD" },
          { code: "lg", label: "LG" },
          { code: "xl", label: "XL" },
          { code: "xxl", label: "XXL" },
          { code: "full", label: "FULL" },
        ],
      },
      ENRICHTEXT: "AUTO follows the column length; a size fixes the width.",
    },
    {
      SN: "5",
      NAME: "DISABLED",
      LABEL: "Read-Only / Disabled",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        activeLabel: "Disabled",
        inactiveLabel: "Editable",
      },
      ENRICHTEXT: "Disallows manual operator input.",
    },
    {
      SN: "6",
      NAME: "ENRICHTEXT",
      LABEL: "Help & Guidance Tooltip",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 120,
      WIDTH: "full",
      ENRICHTEXT: "Contextual help text shown on hover via dotted underline tooltip.",
    },
    {
      SN: "7",
      NAME: "DEFAULTVALUE",
      LABEL: "Default Initial Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT:
        "Pre-filled for new records; operator can change it. For dropdowns/lookups, enter the option Code (e.g. 'M', '1001').",
      VISIBLE_WHEN: { field: "FIXEDVALUE", operator: "falsy" },
    },
    {
      SN: "8",
      NAME: "FIXEDVALUE",
      LABEL: "Fixed Constant Value (Locked)",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT:
        "Permanent value written on input and locked read-only (operator cannot edit). Replaces default value.",
    },
  ],
};
