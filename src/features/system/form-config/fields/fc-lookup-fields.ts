/**
 * @fileoverview Form section specifications for dropdown options and lookup inspectors.
 * Defines nested schema for Static Options (O), Model Entity Lookups (M), and Local Catalogs (L).
 *
 * @module features/system/form-config/fields/fc-lookup-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/**
 * Standard Form Section definition for Dropdown Source Selector (Modes O, M, L).
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
          { code: "M", label: "Model" },
          { code: "L", label: "Local" },
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
      TYPE: "Json",
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
    {
      SN: "5",
      NAME: "PARAMETER.reference",
      LABEL: "Reference Field",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Optional reference or foreign key link field in the model.",
    },
  ],
};

/**
 * Standard Form Section definition for Local CBS Catalog Lookup (Mode L).
 * Defines local table/reference lookup fields as pure JSON.
 */
export const DROPDOWN_LOCAL_SECTION: FormSection = {
  id: "sec_dropdown_local",
  title: "",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.reference",
      LABEL: "Local Catalog / Reference Table",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      REQUIRED: true,
      WIDTH: "full",
      ENRICHTEXT: "Name of the local CBS lookup catalog or system reference table.",
    },
    {
      SN: "2",
      NAME: "PARAMETER.codeField",
      LABEL: "Code / Value Key",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 35,
      WIDTH: "full",
      ENRICHTEXT: "Key in local table to store as the value.",
    },
    {
      SN: "3",
      NAME: "PARAMETER.displayField",
      LABEL: "Display Text Key",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "full",
      ENRICHTEXT: "Key in local table to render as the human-readable label.",
    },
  ],
};
