/**
 * @fileoverview Form section specifications for dropdown options and lookup inspectors.
 * Clean, minimal schema for Static Options (O) and Model Lookup (Flat vs Array).
 *
 * Ordered logically:
 * - For Flat List: Target Model -> Filter Condition -> Code Field -> Display Field
 * - For Array List: Target Model -> Record / Category ID -> Array Property Name -> Item Code Field -> Item Display Field
 *
 * @module features/system/form-config/fields/fc-lookup-fields
 */

import { CBS_PARAMETER_TYPE, CBS_PROPERTY_STRUCTURE, type FormSection } from "@/lib/data-schemas";

/**
 * Dropdown Source: Static List vs Lookup.
 */
export const DROPDOWN_SOURCE_SELECTOR_SECTION: FormSection = {
  id: "sec_dropdown_source",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.type",
      LABEL: "Dropdown Source",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: CBS_PARAMETER_TYPE.OPTIONS,
        data: [
          { code: CBS_PARAMETER_TYPE.OPTIONS, label: "Static List" },
          { code: CBS_PARAMETER_TYPE.MODEL, label: "Lookup" },
        ],
      },
    },
  ],
};

/**
 * Options List for Static Mode (O).
 */
export const DROPDOWN_OPTIONS_SECTION: FormSection = {
  id: "sec_dropdown_options",
  title: "",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.data",
      LABEL: "Options List",
      TYPE: "Array",
      STRUCTURE: CBS_PROPERTY_STRUCTURE.MULTI,
      LENGTH: 0,
      WIDTH: "full",
      PROP: [
        {
          SN: "1_1",
          NAME: "code",
          LABEL: "Code / Value",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 20,
          REQUIRED: true,
          WIDTH: "sm",
        },
        {
          SN: "1_2",
          NAME: "label",
          LABEL: "Display Label",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 80,
          REQUIRED: true,
          WIDTH: "lg",
        },
      ],
    },
  ],
};

/**
 * Single Unified Lookup Section:
 * Field 1: Target Model / Catalog
 * Field 2: Lookup Type (Flat Table vs Array List)
 * Then organized:
 * - For Flat: Condition -> Code -> Label
 * - For Array: Record ID -> Array Property -> Code -> Label
 */
export const DROPDOWN_LOOKUP_SECTION: FormSection = {
  id: "sec_dropdown_lookup",
  title: "",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.modelName",
      LABEL: "Target Model / Catalog",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      REQUIRED: true,
      WIDTH: "full",
      ENRICHTEXT: "Target CBS database model or catalog (e.g. BRANCH, CUSTOMER, LOOKUP).",
    },
    {
      SN: "2",
      NAME: "_lookupType",
      LABEL: "Lookup Type",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      ENRICHTEXT:
        "Flat List: 1 record = 1 option (e.g. BRANCH, CUSTOMER). Array List: unwrap nested items from a category record (e.g. LOOKUP -> GENDER).",
      PARAMETER: {
        type: CBS_PARAMETER_TYPE.OPTIONS,
        data: [
          { code: "flat", label: "Flat List" },
          { code: "array", label: "Array List" },
        ],
      },
    },

    // ── ARRAY-SPECIFIC: Record ID & Array Property ─────────
    {
      SN: "3",
      NAME: "PARAMETER.recordId",
      LABEL: "Record / Category ID",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Category or record identifier to unwrap (e.g. GENDER, MARITAL_STATUS).",
      VISIBLE_WHEN: {
        field: "_lookupType",
        operator: "eq",
        value: "array",
      },
    },
    {
      SN: "4",
      NAME: "PARAMETER.arrayField",
      LABEL: "Array Property Name",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      WIDTH: "full",
      ENRICHTEXT: "Property inside record containing items (e.g. itemArray, signatories).",
      VISIBLE_WHEN: {
        field: "_lookupType",
        operator: "eq",
        value: "array",
      },
    },

    // ── SHARED: Code Field & Display Field ────────────────
    {
      SN: "5",
      NAME: "PARAMETER.codeField",
      LABEL: "Code / Value Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      WIDTH: "full",
      ENRICHTEXT: "Key to store as value (e.g. id, branchCode, itemCode).",
    },
    {
      SN: "6",
      NAME: "PARAMETER.displayField",
      LABEL: "Display Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Key to display as label (e.g. name, branchTitle, itemLabel).",
    },

    // ── SHARED (BOTTOM): Filter Condition ──────────────────
    {
      SN: "7",
      NAME: "PARAMETER.condition",
      LABEL: "Filter Condition",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 100,
      WIDTH: "full",
      ENRICHTEXT:
        "Optional filter expression (e.g. status == 'ACTIVE', isSpecial == 'true'). Applies to rows in Flat List or items in Array List.",
    },
  ],
};
