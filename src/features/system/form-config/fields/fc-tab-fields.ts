/**
 * @fileoverview Tab group form specifications for FORM.CONFIG.
 * Defines the inspector sections for a whole tab group and for a single tab in it.
 *
 * @module features/system/form-config/fields/fc-tab-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/**
 * Standard Form Section for Tab Group Container Properties (Parent Container).
 */
export const TAB_GROUP_PROPERTIES_SECTION: FormSection = {
  id: "sec_tab_group_props",
  title: "Tab Group Container",
  containerType: "card",
  containerConfig: { variant: "subtle" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "containerConfig.tabVariant",
      LABEL: "TabBar Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "card", label: "Card" },
          { code: "workbench", label: "Workbench" },
          { code: "pills", label: "Pills" },
        ],
      },
      ENRICHTEXT:
        "Visual tab strip appearance: Card container, Workbench (flat CBS TabBar), or Pills.",
    },
    {
      SN: "2",
      NAME: "containerConfig.heightMode",
      LABEL: "Height Mode",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "auto", label: "Auto" },
          { code: "fill", label: "Fill Screen" },
          { code: "fixed", label: "Min Height" },
        ],
      },
      ENRICHTEXT:
        "Auto fits fields naturally; Fill Screen stretches to viewport with internal scrolling.",
    },
    {
      SN: "3",
      NAME: "containerConfig.minHeight",
      LABEL: "Min Height (px)",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 4,
      WIDGET: "number",
      WIDTH: "full",
      VISIBLE_WHEN: {
        field: "containerConfig.heightMode",
        operator: "eq",
        value: "fixed",
      },
      ENRICHTEXT: "Minimum container height in pixels.",
    },
  ],
};

/**
 * Standard Form Section for Active Tab Item Properties (Selected Tab Pane).
 */
export const TAB_ITEM_PROPERTIES_SECTION: FormSection = {
  id: "sec_tab_item_props",
  title: "Active Tab Settings",
  containerType: "card",
  containerConfig: { variant: "subtle" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "title",
      LABEL: "Tab Label",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 40,
      WIDTH: "full",
      ENRICHTEXT: "Tab title displayed in the TabBar navigation strip.",
    },
    {
      SN: "2",
      NAME: "description",
      LABEL: "Tab Description",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 120,
      WIDTH: "full",
      ENRICHTEXT: "Optional sub-heading displayed for this tab pane.",
    },
    {
      SN: "3",
      NAME: "columns",
      LABEL: "Grid Columns Layout",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "1", label: "1 Col" },
          { code: "2", label: "2 Col" },
          { code: "3", label: "3 Col" },
          { code: "4", label: "4 Col" },
        ],
      },
      ENRICHTEXT: "Number of responsive grid columns inside this tab pane.",
    },
    {
      SN: "4",
      NAME: "containerConfig.badge",
      LABEL: "Tab Badge",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 20,
      WIDTH: "full",
      ENRICHTEXT: "Optional badge counter or pill displayed on the tab header (e.g. 3, NEW).",
    },
    {
      SN: "5",
      NAME: "containerConfig.badgeVariant",
      LABEL: "Badge Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "default", label: "Default" },
          { code: "secondary", label: "Secondary" },
          { code: "outline", label: "Outline" },
          { code: "destructive", label: "Destructive" },
        ],
      },
    },
  ],
};
