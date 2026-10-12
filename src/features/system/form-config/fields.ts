export type MetaFieldGroup = "IDENTITY" | "PRESENTATION" | "FLAGS";

export interface MetaFieldDef {
  path: string;
  label: string;
  group: MetaFieldGroup;
  type: "text" | "number" | "boolean" | "select";
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  width?: "full" | "half" | "compact";
  options?: Array<{ value: string; label: string }>;
  helperText?: string;
}

export const META_FIELD_GROUPS: Array<{
  id: MetaFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Form Identification & Target Model",
  },
  {
    id: "PRESENTATION",
    title: "Presentation Archetype & Visual Density",
  },
  {
    id: "FLAGS",
    title: "Status & Operational Flags",
  },
];

export const FORM_META_FIELDS: MetaFieldDef[] = [
  {
    path: "recordId",
    label: "Form Code",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. FC.ACCOUNT.RETAIL",
    uppercase: true,
    required: true,
    width: "half",
  },
  {
    path: "title",
    label: "Form Title",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Retail Account Opening Form",
    required: true,
    width: "half",
  },
  {
    path: "targetModel",
    label: "Target Model",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. ACCOUNT or CUSTOMER",
    uppercase: true,
    required: true,
    width: "half",
    helperText: "Specifies which CBS Model entity this form presents and saves into",
  },
  {
    path: "version",
    label: "Form Version",
    group: "IDENTITY",
    type: "text",
    placeholder: "1.0.0",
    width: "compact",
  },
  {
    path: "presentation.archetype",
    label: "Layout Archetype",
    group: "PRESENTATION",
    type: "select",
    width: "half",
    options: [
      { value: "grid", label: "Responsive 12-Col Grid" },
      { value: "scanline", label: "Classic Scan-line Card (CBS Default)" },
      { value: "wizard", label: "Multi-Step Stepper / Wizard" },
      { value: "master-detail", label: "Master-Detail (Top Header + Bottom Tabs)" },
      { value: "accordion", label: "Collapsible Accordion Panels" },
      { value: "tabs", label: "Embedded Tab Sheets" },
    ],
  },
  {
    path: "presentation.density",
    label: "Visual Density",
    group: "PRESENTATION",
    type: "select",
    width: "half",
    options: [
      { value: "compact", label: "Compact (High-Density Teller)" },
      { value: "normal", label: "Normal (Standard Desktop)" },
      { value: "spacious", label: "Spacious (Touch / Wide Screen)" },
    ],
  },
  {
    path: "isActive",
    label: "Form Active Status",
    group: "FLAGS",
    type: "boolean",
    width: "compact",
    helperText: "Determines if this form layout is active for operator selection",
  },
];
