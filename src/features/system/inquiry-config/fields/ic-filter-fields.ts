import { INQUIRY_OPERAND_OPTIONS } from "@/features/inquiry-engine";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";

/**
 * Standard Form Sections definition for INQUIRY.CONFIG Selection Criteria Inspector.
 * Rendered using the CBS platform's FormRenderer.
 */
export const FILTER_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_filter_identity",
    title: "Criteria Identity",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "selectFieldName",
        LABEL: "Field Key",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT:
          "Database column or model property key used to query records (e.g. recordId, branchCode).",
      },
      {
        SN: "2",
        NAME: "selectFieldDisplay",
        LABEL: "Display Label",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 80,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT: "Human-readable label displayed in the inquiry selection filter scanline.",
      },
      {
        SN: "3",
        NAME: "selectFieldType",
        LABEL: "Field Type",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 20,
        WIDGET: "segmented",
        WIDTH: "lg",
        DEFAULTVALUE: "text",
        PARAMETER: {
          type: "O",
          data: [
            { code: "text", label: "Text" },
            { code: "number", label: "Number" },
            { code: "date", label: "Date" },
            { code: "select", label: "Dropdown" },
          ],
        },
        ENRICHTEXT: "Input widget type rendered in the inquiry selection bar.",
      },
    ],
  },
  {
    id: "sec_filter_constraints",
    title: "Logic & Operator Constraints",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "4",
        NAME: "selectFieldOperator",
        LABEL: "Default Operand",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "select",
        WIDTH: "xl",
        DEFAULTVALUE: "EQ",
        PARAMETER: {
          type: "O",
          data: INQUIRY_OPERAND_OPTIONS.map((op) => ({
            code: op.value,
            label: op.label,
          })),
        },
        ENRICHTEXT:
          "Default comparison operator (EQ = Equal to, GT = Greater than, RG = Between, etc.).",
      },
      {
        SN: "5",
        NAME: "selectFieldValue",
        LABEL: "Pre-fill Value",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 100,
        WIDTH: "md",
        ENRICHTEXT: "Optional initial default filter value populated when the inquiry is launched.",
      },
      {
        SN: "6",
        NAME: "selectFieldRequired",
        LABEL: "Mandatory",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: "full",
        ENRICHTEXT:
          "When enabled, requires the operator to provide this search criterion before executing the query.",
      },
      {
        SN: "7",
        NAME: "selectFieldOperatorFixed",
        LABEL: "Lock Operator",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: "full",
        ENRICHTEXT:
          "Locks the comparison operator so operators cannot switch operands during inquiry.",
      },
    ],
  },
];
