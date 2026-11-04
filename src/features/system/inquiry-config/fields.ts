import type { FormSection } from "@/lib/data-schemas/form-config-schema";

/**
 * Standard Form Sections definition for INQUIRY.CONFIG General tab.
 * Rendered using the CBS platform's FormRenderer.
 */
export const INQUIRY_CONFIG_SECTIONS: FormSection[] = [
  {
    id: "sec_inq_identity",
    title: "Inquiry Identification & Target Controller",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "description",
        LABEL: "Description",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 120,
        REQUIRED: true,
        WIDTH: 280,
        ENRICHTEXT: "Descriptive title of this inquiry definition.",
      },
      {
        SN: "2",
        NAME: "controllerName",
        LABEL: "Controller / Model",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: true,
        WIDTH: 280,
        ENRICHTEXT: "Target CBS entity or primary controller table (e.g. ACCOUNT or USER).",
      },
      {
        SN: "3",
        NAME: "inqType",
        LABEL: "Inquiry Type",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        REQUIRED: true,
        WIDGET: "segmented",
        WIDTH: 320,
        DEFAULTVALUE: "DFT",
        PARAMETER: {
          type: "O",
          data: [
            { code: "DFT", label: "Default Table (DFT)" },
            { code: "RPT", label: "Report View (RPT)" },
            { code: "CUST", label: "Custom Drill (CUST)" },
          ],
        },
      },
    ],
  },
  {
    id: "sec_inq_layout",
    title: "Display & Pagination Settings",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "4",
        NAME: "pageOrientation",
        LABEL: "Page Orientation",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "segmented",
        WIDTH: 180,
        DEFAULTVALUE: "Portrait",
        PARAMETER: {
          type: "O",
          data: [
            { code: "Portrait", label: "Portrait" },
            { code: "Landscape", label: "Landscape" },
          ],
        },
      },
      {
        SN: "5",
        NAME: "perpageItem",
        LABEL: "Records Per Page",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 4,
        WIDTH: 120,
        DEFAULTVALUE: "30",
        ENRICHTEXT: "Default page size limit for pagination.",
      },
      {
        SN: "6",
        NAME: "showSerial",
        LABEL: "Show Serial Numbers",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: 1000,
        DEFAULTVALUE: "true",
        ENRICHTEXT: "Render row serial number (1, 2, 3...) in table results.",
      },
      {
        SN: "7",
        NAME: "showPagination",
        LABEL: "Enable Pagination",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: 1000,
        DEFAULTVALUE: "true",
        ENRICHTEXT: "Show footer paging controls and page navigation.",
      },
      {
        SN: "8",
        NAME: "showBranchWise",
        LABEL: "Branch-Wise Segregation",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: 1000,
        ENRICHTEXT: "Filter results to current operator's branch automatically.",
      },
    ],
  },
  {
    id: "sec_inq_routing",
    title: "Service Routing & Reporting",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "9",
        NAME: "rptControllerName",
        LABEL: "Report Controller",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        WIDTH: 280,
        ENRICHTEXT:
          "Optional report controller identifier for PDF/print generation (e.g. RPT.ACC.LIST).",
      },
      {
        SN: "10",
        NAME: "inqServicePath",
        LABEL: "Inquiry Service Path",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 100,
        REQUIRED: true,
        WIDTH: 280,
        DEFAULTVALUE: "default",
        ENRICHTEXT: "Backend service routing endpoint path.",
      },
    ],
  },
];

/**
 * Standard Form Sections definition for INQUIRY.CONFIG Selection Criteria Inspector.
 * Rendered using the CBS platform's FormRenderer.
 */
export const FILTER_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_filter_identity",
    title: "Criteria Identity",
    type: "standard",
    layoutStyle: "card",
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
        WIDTH: 280,
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
        WIDTH: 280,
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
        WIDTH: 320,
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
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "4",
        NAME: "selectFieldOperator",
        LABEL: "Default Operand",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "segmented",
        WIDTH: 420,
        DEFAULTVALUE: "EQ",
        PARAMETER: {
          type: "O",
          data: [
            { code: "EQ", label: "Equals (=)" },
            { code: "LK", label: "Contains (LK)" },
            { code: "GT", label: "Greater (>)" },
            { code: "LT", label: "Less (<)" },
            { code: "RG", label: "Range (..)" },
          ],
        },
        ENRICHTEXT:
          "Default comparison operator (EQ = Equals, LK = Like / Contains, GT = Greater Than, etc.).",
      },
      {
        SN: "5",
        NAME: "selectFieldValue",
        LABEL: "Pre-fill Value",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 100,
        WIDTH: 280,
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
        WIDTH: 1000,
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
        WIDTH: 1000,
        ENRICHTEXT:
          "Locks the comparison operator so operators cannot switch operands during inquiry.",
      },
    ],
  },
];

/**
 * Standard Form Sections definition for INQUIRY.CONFIG Column Inspector.
 * Rendered using the CBS platform's FormRenderer.
 */
export const COLUMN_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_col_identity",
    title: "Column Identity",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "fieldName",
        LABEL: "Field Key",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: true,
        WIDTH: 280,
        ENRICHTEXT:
          "Underlying database column or model property key returned in query result tuples.",
      },
      {
        SN: "2",
        NAME: "fieldDisplay",
        LABEL: "Header Label",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 80,
        REQUIRED: true,
        WIDTH: 280,
        ENRICHTEXT: "Column title displayed in the inquiry table header scanline.",
      },
      {
        SN: "3",
        NAME: "fieldType",
        LABEL: "Data Type",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "segmented",
        WIDTH: 420,
        DEFAULTVALUE: "CH",
        PARAMETER: {
          type: "O",
          data: [
            { code: "CH", label: "Character (CH)" },
            { code: "AMT", label: "Amount (AMT)" },
            { code: "NUM", label: "Numeric (NUM)" },
            { code: "D", label: "Date (D)" },
            { code: "T", label: "Time (T)" },
          ],
        },
        ENRICHTEXT:
          "Core banking data format: Character (CH), Amount (AMT), Numeric (NUM), Date (D), or Time (T).",
      },
      {
        SN: "4",
        NAME: "alignment",
        LABEL: "Alignment",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 2,
        WIDGET: "segmented",
        WIDTH: 280,
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
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "5",
        NAME: "columnWidth",
        LABEL: "Column Width",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 4,
        WIDTH: 180,
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
        WIDTH: 120,
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
        WIDTH: 120,
        DEFAULTVALUE: "1",
        ENRICHTEXT: "Column placement order index within the assigned grid row.",
      },
      {
        SN: "8",
        NAME: "fieldFunc",
        LABEL: "Conversion Routine",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 60,
        WIDTH: 280,
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
        WIDTH: 1000,
        ENRICHTEXT:
          "Permits passing this column's value into drilldown transactions or action commands.",
      },
    ],
  },
];

/**
 * Standard Form Sections definition for INQUIRY.CONFIG Row Action Inspector.
 * Rendered using the CBS platform's FormRenderer.
 */
export const ACTION_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_act_identity",
    title: "Action Preset & Button Label",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "cmdButton",
        LABEL: "Button Label",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: true,
        WIDTH: 280,
        ENRICHTEXT:
          "Label text rendered on the row action button or context menu (e.g. View, Edit, Auth).",
      },
    ],
  },
  {
    id: "sec_act_command",
    title: "Target & Parameter Configuration",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "2",
        NAME: "cmdFor",
        LABEL: "Command Target",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 120,
        REQUIRED: true,
        WIDTH: 420,
        ENRICHTEXT:
          "Command template executed when clicked, with field placeholder tokens (e.g. ACCOUNT S recordId).",
      },
    ],
  },
];
