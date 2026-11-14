/**
 * @fileoverview Field presentation, anchor, and reactive rules specifications for FORM.CONFIG.
 * Defines schemas for Physical DB Anchors, General Field Properties, Advanced Validation,
 * Reactive Automation (ON_CHANGE), and Conditional Logic (DISABLED_WHEN).
 *
 * @module features/system/form-config/fields/fc-field-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/**
 * Physical Model Anchor Section specification for Field Inspector.
 * Rendered natively via FormRenderer in View mode (mode="S") without card wrappers.
 */
export const FIELD_ANCHOR_SECTION: FormSection = {
  id: "sec_physical_anchor",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "NAME",
      LABEL: "Column Key",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
    },
    {
      SN: "2",
      NAME: "SN",
      LABEL: "Sequence (SN)",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
    },
    {
      SN: "3",
      NAME: "PHYSICAL_TYPE",
      LABEL: "Physical Type",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 20,
    },
    {
      SN: "4",
      NAME: "STRUCTURE",
      LABEL: "Structure",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 20,
    },
  ],
};

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
          { code: "xxl", label: "XXL" },
          { code: "full", label: "FULL" },
        ],
      },
      ENRICHTEXT: "12-column responsive layout width token.",
    },
    {
      SN: "3",
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
      SN: "4",
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
        widgetStyle: "switch",
        trueValue: "true",
        falseValue: "false",
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
      LABEL: "Default Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT: "Pre-filled default populated for new records.",
    },
    {
      SN: "8",
      NAME: "FIXEDVALUE",
      LABEL: "Fixed Constant Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT: "Immutable constant locked by the server (cannot be modified by user).",
    },
  ],
};

/**
 * Advanced Field Rules & Transforms
 */
export const FIELD_ADVANCED_RULES_SECTION: FormSection = {
  id: "sec_field_advanced_rules",
  title: "Validation & Transforms",
  containerType: "card",
  containerConfig: { variant: "subtle", showHeader: true, bordered: true },
  collapsible: true,
  isCollapsed: true,
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "TRANSFORM",
      LABEL: "Input Transformation",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 20,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "none",
      PARAMETER: {
        type: "O",
        data: [
          { code: "none", label: "None" },
          { code: "uppercase", label: "UPPER" },
          { code: "lowercase", label: "lower" },
          { code: "trim", label: "Trim" },
          { code: "stripWhitespace", label: "Strip Space" },
        ],
      },
      ENRICHTEXT: "Automatic string sanitizer executed before saving value.",
    },
    {
      SN: "2",
      NAME: "VALIDATION.matches",
      LABEL: "Regex Validation Pattern",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 80,
      WIDTH: "full",
      ENRICHTEXT: "Regular expression constraint (e.g. ^[A-Z]{3}$, ^\\d{10}$).",
    },
    {
      SN: "3",
      NAME: "VALIDATION.message",
      LABEL: "Custom Error Message",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 100,
      WIDTH: "full",
      ENRICHTEXT: "Custom error shown when regex or constraint fails.",
    },
  ],
};

/**
 * Reactive Automation Rules (ON_CHANGE)
 */
export const FIELD_ON_CHANGE_SECTION: FormSection = {
  id: "sec_field_on_change",
  title: "Field Automation (On Change)",
  containerType: "card",
  containerConfig: { variant: "subtle", showHeader: true, bordered: true },
  collapsible: true,
  isCollapsed: true,
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "ON_CHANGE.target",
      LABEL: "Target Destination Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Target field updated reactively when this field changes.",
    },
    {
      SN: "2",
      NAME: "ON_CHANGE.action",
      LABEL: "Automated Action",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 20,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "copy",
      PARAMETER: {
        type: "O",
        data: [
          { code: "copy", label: "Copy" },
          { code: "join", label: "Join" },
          { code: "clear", label: "Clear" },
          { code: "uppercase", label: "UPPER" },
          { code: "lowercase", label: "lower" },
        ],
      },
      ENRICHTEXT: "Action performed on target field.",
    },
    {
      SN: "3",
      NAME: "ON_CHANGE.delimiter",
      LABEL: "Join Delimiter",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 5,
      WIDTH: "xs",
      DEFAULTVALUE: "#",
      ENRICHTEXT: "Delimiter character when joining values (default '#').",
    },
  ],
};

/**
 * Conditional Dependencies (DISABLED_WHEN)
 */
export const FIELD_CONDITIONS_SECTION: FormSection = {
  id: "sec_field_conditions",
  title: "Conditional State (Disabled When)",
  containerType: "card",
  containerConfig: { variant: "subtle", showHeader: true, bordered: true },
  collapsible: true,
  isCollapsed: true,
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "DISABLED_WHEN.field",
      LABEL: "Depends On Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Field name whose value controls this field's disabled state.",
    },
    {
      SN: "2",
      NAME: "DISABLED_WHEN.operator",
      LABEL: "Comparison Operator",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "eq",
      PARAMETER: {
        type: "O",
        data: [
          { code: "eq", label: "==" },
          { code: "neq", label: "!=" },
          { code: "truthy", label: "Truthy" },
          { code: "falsy", label: "Falsy" },
          { code: "gt", label: ">" },
          { code: "lt", label: "<" },
        ],
      },
      ENRICHTEXT: "Comparison operation against dependency value.",
    },
    {
      SN: "3",
      NAME: "DISABLED_WHEN.value",
      LABEL: "Match Value",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Expected value that triggers the condition.",
    },
  ],
};
