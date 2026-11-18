import type { FormSection } from "@/lib/data-schemas";

/**
 * Generates Form Sections for the Action Inspector using native Form Engine widgets.
 * Features a segmented action preset control that cascades values and disables fields when fixed.
 */
export function getActionInspectorSections(targetModel = "ACCOUNT"): FormSection[] {
  const model = targetModel.trim() || "ACCOUNT";

  return [
    {
      id: "sec_act_config",
      title: "Action Configuration",
      containerType: "card",
      columns: 1,
      fields: [
        {
          SN: "1",
          NAME: "actionPreset",
          LABEL: "Action Mode",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 20,
          WIDGET: "segmented",
          WIDTH: "full",
          DEFAULTVALUE: "S",
          PARAMETER: {
            type: "O",
            data: [
              { code: "S", label: "View (S)" },
              { code: "I", label: "Edit (I)" },
              { code: "A", label: "Auth (A)" },
              { code: "D", label: "Delete (D)" },
              { code: "R", label: "Reverse (R)" },
              { code: "H", label: "History (H)" },
              { code: "CUSTOM", label: "Custom (*)" },
            ],
          },
          CASCADE: [
            { when: "S", set: { cmdButton: "View", cmdFor: `${model} S recordId` } },
            { when: "I", set: { cmdButton: "Edit", cmdFor: `${model} I recordId` } },
            { when: "A", set: { cmdButton: "Auth", cmdFor: `${model} A recordId` } },
            { when: "D", set: { cmdButton: "Delete", cmdFor: `${model} D recordId` } },
            { when: "R", set: { cmdButton: "Reverse", cmdFor: `${model} R recordId` } },
            { when: "H", set: { cmdButton: "History", cmdFor: `${model} H recordId` } },
          ],
          ENRICHTEXT:
            "Select a standard CBS banking action mode or choose Custom to specify manual command syntax.",
        },
        {
          SN: "2",
          NAME: "cmdButton",
          LABEL: "Button Label",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 50,
          REQUIRED: true,
          WIDTH: "md",
          DISABLED_WHEN: {
            field: "actionPreset",
            operator: "neq",
            value: "CUSTOM",
          },
          ENRICHTEXT:
            "Label text rendered on the row action button (auto-filled for presets, editable in Custom mode).",
        },
        {
          SN: "3",
          NAME: "cmdFor",
          LABEL: "Command Syntax",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 120,
          REQUIRED: true,
          WIDTH: "lg",
          DISABLED_WHEN: {
            field: "actionPreset",
            operator: "neq",
            value: "CUSTOM",
          },
          ENRICHTEXT: "Command template executed when clicked (e.g. ACCOUNT S recordId).",
        },
      ],
    },
  ];
}
