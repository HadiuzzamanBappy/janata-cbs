import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

/**
 * Standard Form Sections definition for INQUIRY.CONFIG General tab.
 * Rendered using the CBS platform's form-engine SectionCard.
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
        WIDTH: "md",
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
        WIDTH: "md",
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
        WIDGET: "select",
        WIDTH: "sm",
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
        WIDTH: "sm",
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
        WIDTH: "xs",
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
        WIDTH: "full",
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
        WIDTH: "full",
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
        WIDTH: "full",
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
        WIDTH: "md",
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
        WIDTH: "md",
        ENRICHTEXT: "Backend service routing endpoint path.",
      },
    ],
  },
];

/**
 * Immutable field updater for InquiryConfigRecord's INQInfo
 */
export function setInquiryFieldValue(
  record: InquiryConfigRecord,
  fieldKey: string,
  value: unknown,
): InquiryConfigRecord {
  const inqInfo = { ...record.INQInfo };
  let finalVal = value;

  if (fieldKey === "perpageItem") {
    finalVal = value !== "" && value !== undefined && value !== null ? Number(value) : 30;
  } else if (fieldKey === "controllerName" || fieldKey === "rptControllerName") {
    finalVal = typeof value === "string" ? value.toUpperCase() : value;
  }

  (inqInfo as Record<string, unknown>)[fieldKey] = finalVal;

  return {
    ...record,
    INQInfo: inqInfo,
  };
}
