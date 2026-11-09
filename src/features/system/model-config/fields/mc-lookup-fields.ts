import type { FormSection } from "@/lib/data-schemas/form-config-schema";

/**
 * Standard Form Section definition for Dropdown Options (Mode O).
 * Defines the repeating multi-value options schema as pure JSON.
 */
export const DROPDOWN_OPTIONS_SECTION: FormSection = {
  id: "sec_dropdown_options",
  title: "",
  containerType: "card",
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.data",
      LABEL: "Options List",
      TYPE: "Object",
      STRUCTURE: "M",
      LENGTH: 0,
      WIDTH: "full",
      PROP: [
        {
          SN: "1_1",
          NAME: "itemCode",
          LABEL: "Item Code",
          TYPE: "Text",
          STRUCTURE: "S",
          LENGTH: 20,
          REQUIRED: true,
          WIDTH: "sm",
          ENRICHTEXT: "Physical code stored in database column (e.g. S, M, HO, BR).",
        },
        {
          SN: "1_2",
          NAME: "itemLabel",
          LABEL: "Display Label",
          TYPE: "Text",
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
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "PARAMETER.modelName",
      LABEL: "Target Model",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 35,
      REQUIRED: true,
      WIDTH: "md",
      ENRICHTEXT: "Target CBS database model to query (e.g. CUSTOMER, BRANCH).",
    },
    {
      SN: "2",
      NAME: "PARAMETER.codeField",
      LABEL: "Code / Value Field",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 35,
      WIDTH: "md",
      ENRICHTEXT: "Optional. Field in target model to store. Defaults to target model's key/id.",
    },
    {
      SN: "3",
      NAME: "PARAMETER.displayField",
      LABEL: "Display Field",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 50,
      WIDTH: "md",
      ENRICHTEXT: "Field name in the target model to use as display text (e.g. branchTitle, name).",
    },
    {
      SN: "4",
      NAME: "PARAMETER.condition",
      LABEL: "Filter Condition",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 100,
      WIDTH: "xl",
      ENRICHTEXT: "Optional filter expression to limit records (e.g. status == 'ACTIVE').",
    },
  ],
};

