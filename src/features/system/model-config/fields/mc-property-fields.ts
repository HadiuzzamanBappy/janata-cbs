import type { FormSection } from "@/lib/data-schemas/form-config-schema";

/**
 * Standard Form Sections definition for the selected Model Property inspector.
 * Fully renders property identity & constraints using the platform's form-engine.
 */
export const PROPERTY_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_prop_definition",
    title: "Column Definition",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "NAME",
        LABEL: "Field Name",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 35,
        REQUIRED: true,
        WIDTH: "md",
        TRANSFORM: "stripWhitespace",
        ENRICHTEXT:
          "Database column identifier in strict camelCase (e.g. accountNumber, openingDate).",
      },
      {
        SN: "2",
        NAME: "TYPE",
        LABEL: "Data Type",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 20,
        WIDGET: "segmented",
        DEFAULTVALUE: "String",
        PARAMETER: {
          TYPE: "O",
          type: "O",
          DATA: [
            { itemCode: "String", itemLabel: "String" },
            { itemCode: "Number", itemLabel: "Number" },
            { itemCode: "Boolean", itemLabel: "Boolean" },
            { itemCode: "Date", itemLabel: "Date" },
            { itemCode: "DateTime", itemLabel: "DateTime" },
            { itemCode: "Time", itemLabel: "Time" },
            { itemCode: "Json", itemLabel: "Json" },
          ],
          data: [
            { code: "String", label: "String" },
            { code: "Number", label: "Number" },
            { code: "Boolean", label: "Boolean" },
            { code: "Date", label: "Date" },
            { code: "DateTime", label: "DateTime" },
            { code: "Time", label: "Time" },
            { code: "Json", label: "Json" },
          ],
        },
        CASCADE: [
          { when: "Date", set: { LENGTH: 10, PROP: undefined } },
          { when: "DateTime", set: { LENGTH: 19, PROP: undefined } },
          { when: "Time", set: { LENGTH: 8, PROP: undefined } },
          { when: "Number", set: { LENGTH: 15, PROP: undefined } },
          { when: "String", set: { LENGTH: 50, PROP: undefined } },
          { when: "Boolean", set: { LENGTH: 1, STRUCTURE: "S", PROP: undefined } },
          { when: ["Json", "Object"], set: { LENGTH: 0, PROP: [] } },
        ],
        ENRICHTEXT:
          "Physical database column data type: String, Number, Boolean, Date, DateTime, Time, or Json.",
      },
      {
        SN: "3",
        NAME: "STRUCTURE",
        LABEL: "Structure",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 5,
        WIDGET: "segmented",
        DEFAULTVALUE: "S",
        PARAMETER: {
          type: "O",
          data: [
            { code: "S", label: "Single (S)" },
            { code: "M", label: "Multi-Value (M)" },
          ],
        },
        DISABLED_WHEN: {
          field: "TYPE",
          operator: "eq",
          value: "Boolean",
        },
        ENRICHTEXT:
          "Single (S) scalar value or Multi-Value (M) repeating primitive array (strictly Single for Boolean).",
      },
      {
        SN: "4",
        NAME: "LENGTH",
        LABEL: "Length",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 4,
        WIDTH: "xs",
        DEFAULTVALUE: "50",
        DISABLED_WHEN: {
          field: "TYPE",
          operator: "in",
          value: ["Json", "Object", "Date", "DateTime", "Time", "Boolean"],
        },
        ENRICHTEXT:
          "Maximum character storage limit or numerical precision (not applicable for Json, fixed for Boolean/Date/Time).",
      },
      {
        SN: "5",
        NAME: "REQUIRED",
        LABEL: "Required",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Whether this column enforces non-null constraint at database commit.",
      },
    ],
  },
];
