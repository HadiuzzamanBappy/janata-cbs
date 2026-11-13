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
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 35,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT:
          "Database column identifier in strict camelCase (e.g. accountNumber, openingDate).",
      },
      {
        SN: "2",
        NAME: "TYPE",
        LABEL: "Data Type",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 20,
        WIDGET: "segmented",
        DEFAULTVALUE: "Text",
        PARAMETER: {
          type: "O",
          data: [
            { code: "Text", label: "Text" },
            { code: "Number", label: "Number" },
            { code: "Amount", label: "Amount" },
            { code: "Rate", label: "Rate" },
            { code: "Date", label: "Date" },
            { code: "DateTime", label: "DateTime" },
            { code: "Boolean", label: "Boolean" },
            { code: "Object", label: "Object" },
          ],
        },
        ENRICHTEXT:
          "Physical database column data type: Text, Number, Amount, Rate, Date, DateTime, Boolean, or Object.",
      },
      {
        SN: "3",
        NAME: "STRUCTURE",
        LABEL: "Structure",
        TYPE: "Text",
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
        ENRICHTEXT: "Single (S) scalar value or Multi-Value (M) repeating primitive array.",
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
        ENRICHTEXT: "Maximum character storage limit or numerical precision allowed in database.",
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
