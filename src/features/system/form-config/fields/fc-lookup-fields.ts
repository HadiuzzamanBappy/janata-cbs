/**
 * @fileoverview Form section specifications for dropdown options and lookup inspectors.
 * Defines nested schema for Static Options (O), Model Entity Lookups (M), and Local Catalogs (L).
 *
 * @module features/system/form-config/fields/fc-lookup-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/**
 * Standard Form Section definition for Dropdown Source Selector (Modes O, M, A, L).
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
      DEFAULTVALUE: "O",
      PARAMETER: {
        type: "O",
        data: [
          { code: "O", label: "Static List" },
          { code: "M", label: "Model Table" },
          { code: "A", label: "Category / Array" },
        ],
      },
    },
  ],
};

/**
 * Standard Form Section definition for Dropdown Options (Mode O).
 * Defines the repeating multi-value options schema as pure JSON.
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
      STRUCTURE: "M",
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
          ENRICHTEXT: "Physical code stored in database column (e.g. S, M, HO, BR).",
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
          ENRICHTEXT: "Human-readable label shown to users in dropdown selectors.",
        },
      ],
    },
  ],
};

/**
 * Standard Form Section definition for Dropdown Model Lookup (Mode M).
 * Defines dynamic entity lookup fields as pure JSON.
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
      LABEL: "Target Model",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      REQUIRED: true,
      WIDTH: "full",
      ENRICHTEXT: "Target CBS database model to query (e.g. CUSTOMER, BRANCH).",
    },
    {
      SN: "2",
      NAME: "PARAMETER.codeField",
      LABEL: "Code / Value Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      WIDTH: "full",
      ENRICHTEXT: "Field in target model to store. Defaults to target model's key/id.",
    },
    {
      SN: "3",
      NAME: "PARAMETER.displayField",
      LABEL: "Display Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Field name in the target model to use as display text (e.g. branchTitle, name).",
    },
    {
      SN: "4",
      NAME: "PARAMETER.condition",
      LABEL: "Filter Condition",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 100,
      WIDTH: "full",
      ENRICHTEXT: "Optional filter expression to limit records (e.g. status == 'ACTIVE').",
    },
  ],
};

/**
 * Standard Form Section definition for Category / Nested Array Lookup (Mode A).
 * Defines categorized catalog (e.g. SC_LOOKUP) and nested child array lookups.
 */
export const DROPDOWN_ARRAY_SECTION: FormSection = {
  id: "sec_dropdown_array",
  title: "",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.modelName",
      LABEL: "Target Catalog / Model",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      DEFAULTVALUE: "LOOKUP",
      WIDTH: "full",
      ENRICHTEXT: "Target catalog or model containing the category (defaults to LOOKUP).",
    },
    {
      SN: "2",
      NAME: "PARAMETER.recordId",
      LABEL: "Category / Record ID",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      REQUIRED: true,
      WIDTH: "full",
      ENRICHTEXT: "Identifier of the category or record to unwrap (e.g. GENDER, MARITAL_STATUS).",
    },
    {
      SN: "3",
      NAME: "PARAMETER.arrayField",
      LABEL: "Array Field Name",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      DEFAULTVALUE: "itemArray",
      WIDTH: "full",
      ENRICHTEXT: "Property inside the record containing option items (defaults to itemArray).",
    },
    {
      SN: "4",
      NAME: "PARAMETER.codeField",
      LABEL: "Item Code Key",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      DEFAULTVALUE: "itemCode",
      WIDTH: "full",
      ENRICHTEXT: "Key inside each array item to store as value (defaults to itemCode).",
    },
    {
      SN: "5",
      NAME: "PARAMETER.displayField",
      LABEL: "Item Display Key",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      DEFAULTVALUE: "itemLabel",
      WIDTH: "full",
      ENRICHTEXT: "Key inside each array item to render as label (defaults to itemLabel).",
    },
  ],
};
