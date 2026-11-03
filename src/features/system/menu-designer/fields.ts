import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

/**
 * Standard Form Sections definition for MENU.DESIGNER General tab.
 * Rendered using the platform's form-engine SectionCard.
 */
export const MENU_DESIGNER_SECTIONS: FormSection[] = [
  {
    id: "sec_menu_identity",
    title: "Hierarchy Tree Identification",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "treeDescription",
        LABEL: "Tree Description",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 100,
        REQUIRED: true,
        WIDTH: 1000,
        ENRICHTEXT: "Human-readable descriptive label for this navigation hierarchy.",
      },
    ],
  },
  {
    id: "sec_menu_status",
    title: "Operational Lifecycle State",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "2",
        NAME: "isActive",
        LABEL: "Active Navigation State",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        WIDTH: 1000,
        ENRICHTEXT:
          "Controls whether this navigation hierarchy is live and published across user workbenches.",
      },
    ],
  },
];

/**
 * Clean immutable field updater for MenuTreeRecord
 */
export function setMenuDesignerFieldValue(
  record: MenuTreeRecord,
  fieldKey: string,
  value: unknown,
): MenuTreeRecord {
  return {
    ...record,
    [fieldKey]: fieldKey === "isActive" ? Boolean(value) : value,
  };
}
