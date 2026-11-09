import type { FormSection } from "@/lib/data-schemas/form-config-schema";

/**
 * Standard Form Sections definition for INQUIRY.CONFIG Row Action Inspector.
 * Rendered using the CBS platform's FormRenderer.
 */
export const ACTION_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_act_identity",
    title: "Action Preset & Button Label",
    containerType: "card",
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
        WIDTH: "md",
        ENRICHTEXT:
          "Label text rendered on the row action button or context menu (e.g. View, Edit, Auth).",
      },
    ],
  },
  {
    id: "sec_act_command",
    title: "Target & Parameter Configuration",
    containerType: "card",
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
        WIDTH: "xl",
        ENRICHTEXT:
          "Command template executed when clicked, with field placeholder tokens (e.g. ACCOUNT S recordId).",
      },
    ],
  },
];
