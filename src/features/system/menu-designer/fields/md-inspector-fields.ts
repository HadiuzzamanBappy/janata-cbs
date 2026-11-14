import type { FormSection } from "@/lib/data-schemas/form-engine-schema";

/**
 * Node Inspector Specification:
 * - Read-only DB / catalog values: command, menuType (DISABLED: true).
 * - Contextual Overrides: label, menuAction (Enabled for override, menuAction disabled when folder).
 * - Menu designer setting: isVisible (Enabled toggle switch).
 * - Ghost container variant removes borders and card headers for a sleek mobile-like drawer.
 */
export const NODE_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_node_properties",
    title: "",
    containerType: "card",
    containerConfig: { variant: "ghost" },
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "command",
        LABEL: "Target Command Code",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 60,
        WIDTH: "full",
        DISABLED: true,
        ENRICHTEXT: "Physical target command inherited from catalog definition (read-only).",
      },
      {
        SN: "2",
        NAME: "menuType",
        LABEL: "Catalog Menu Type",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 20,
        WIDTH: "full",
        DISABLED: true,
        ENRICHTEXT: "Functional catalog type: GROUP, INQUIRY, FORM, or REPORT (read-only).",
      },
      {
        SN: "3",
        NAME: "label",
        LABEL: "Display Label",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 60,
        REQUIRED: true,
        WIDTH: "full",
        ENRICHTEXT:
          "Contextual override display label for this navigation item (can be overridden).",
      },
      {
        SN: "4",
        NAME: "menuAction",
        LABEL: "Action Type",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "select",
        WIDTH: "full",
        PARAMETER: {
          type: "O",
          data: [
            { code: "SCREEN", label: "SCREEN (Tab)" },
            { code: "POPUP", label: "POPUP (Detached)" },
          ],
        },
        DISABLED_WHEN: {
          field: "isFolder",
          operator: "eq",
          value: true,
        },
        ENRICHTEXT:
          "Contextual window action: SCREEN (Tab) or POPUP (Detached) (can be overridden).",
      },
      {
        SN: "5",
        NAME: "isVisible",
        LABEL: "Enable in Navigation",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "switch",
        WIDTH: "full",
        DEFAULTVALUE: "true",
        ENRICHTEXT:
          "Menu designer setting: controls whether this item appears in active workbench navigation.",
      },
    ],
  },
];
