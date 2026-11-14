import type { FormSection } from "@/lib/data-schemas";

/**
 * Standard Form Sections definition for INQUIRY.CONFIG Column Inspector.
 * Rendered using the CBS platform's FormRenderer.
 */
export const COLUMN_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_col_identity",
    title: "Column Identity",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "fieldName",
        LABEL: "Field Key",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT:
          "Underlying database column or model property key returned in query result tuples.",
      },
      {
        SN: "2",
        NAME: "fieldDisplay",
        LABEL: "Header Label",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 80,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT: "Column title displayed in the inquiry table header scanline.",
      },
      {
        SN: "3",
        NAME: "fieldType",
        LABEL: "Field Type",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "select",
        WIDTH: "md",
        DEFAULTVALUE: "DC",
        PARAMETER: {
          type: "O",
          data: [
            { code: "VC", label: "Variable Field" },
            { code: "DC", label: "Data Column" },
          ],
        },
        ENRICHTEXT:
          "Inquiry column type: Data Column (DC) for table properties, Variable Field (VC) for variables.",
      },
      {
        SN: "4",
        NAME: "alignment",
        LABEL: "Alignment",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 2,
        WIDGET: "segmented",
        WIDTH: "md",
        DEFAULTVALUE: "L",
        PARAMETER: {
          type: "O",
          data: [
            { code: "L", label: "Left (L)" },
            { code: "C", label: "Center (C)" },
            { code: "R", label: "Right (R)" },
          ],
        },
        ENRICHTEXT:
          "Cell content alignment: Left (L) for text, Right (R) for numbers/amounts, Center (C) for codes/dates.",
      },
    ],
  },
  {
    id: "sec_col_constraints",
    title: "Storage & Display Constraints",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "5",
        NAME: "columnWidth",
        LABEL: "Column Width",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 4,
        WIDTH: "sm",
        DEFAULTVALUE: "20",
        ENRICHTEXT:
          "Display character width allocation (e.g. 20 characters for account numbers, 35 for titles).",
      },
      {
        SN: "6",
        NAME: "gridRow",
        LABEL: "Grid Row",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 2,
        WIDTH: "xs",
        DEFAULTVALUE: "1",
        ENRICHTEXT: "Multi-line ledger row index (1 for top line, 2 for second line).",
      },
      {
        SN: "7",
        NAME: "gridCol",
        LABEL: "Grid Column",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 2,
        WIDTH: "xs",
        DEFAULTVALUE: "1",
        ENRICHTEXT: "Column placement order index within the assigned grid row.",
      },
      {
        SN: "8",
        NAME: "fieldFunc",
        LABEL: "Conversion Routine",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 60,
        WIDTH: "md",
        ENRICHTEXT:
          "Optional CBS core formatting routine (e.g. SUBSTRING, DATE.CONVERT, MASK.ACCOUNT).",
      },
      {
        SN: "9",
        NAME: "dataPassable",
        LABEL: "Passable",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: "full",
        ENRICHTEXT:
          "Permits passing this column's value into drilldown transactions or action commands.",
      },
    ],
  },
];
