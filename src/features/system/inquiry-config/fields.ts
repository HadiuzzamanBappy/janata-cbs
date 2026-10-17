export type InquiryMetaFieldGroup = "IDENTITY" | "SETTINGS";

export interface InquiryMetaFieldDef {
  path: string;
  label: string;
  group: InquiryMetaFieldGroup;
  type: "text" | "number" | "select";
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  width?: "full" | "half" | "compact";
  options?: Array<{ value: string; label: string }>;
  helperText?: string;
}

export const INQUIRY_META_FIELD_GROUPS: Array<{
  id: InquiryMetaFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Inquiry Identification & Target Entity",
  },
  {
    id: "SETTINGS",
    title: "Runtime Query Settings",
  },
];

export const INQUIRY_META_FIELDS: InquiryMetaFieldDef[] = [
  {
    path: "id",
    label: "Inquiry Code",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. INQ.ACCOUNT.LIST",
    uppercase: true,
    required: true,
    width: "half",
  },
  {
    path: "targetModel",
    label: "Target Model",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. ACCOUNT",
    uppercase: true,
    required: true,
    width: "half",
    helperText: "Specifies which CBS Model entity this inquiry queries",
  },
  {
    path: "title",
    label: "Screen Title",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Customer Accounts Overview",
    required: true,
    width: "full",
  },
  {
    path: "description",
    label: "Description",
    group: "IDENTITY",
    type: "text",
    placeholder: "Short summary of this inquiry query",
    width: "full",
  },
  {
    path: "defaultPageSize",
    label: "Default Page Size",
    group: "SETTINGS",
    type: "select",
    width: "compact",
    options: [
      { value: "10", label: "10 rows" },
      { value: "25", label: "25 rows" },
      { value: "50", label: "50 rows" },
      { value: "100", label: "100 rows" },
    ],
  },
];
