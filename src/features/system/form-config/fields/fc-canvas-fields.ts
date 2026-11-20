/**
 * @fileoverview Canvas & Container form specifications for FORM.CONFIG.
 * Defines presentation schemas for Root Canvas Layout and Container Cards/Tab Groups.
 *
 * @module features/system/form-config/fields/fc-canvas-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/**
 * Standard Form Section definition for Root Canvas Layout Properties.
 * Contains canvas-level layout and density settings.
 */
export const ROOT_FORM_PROPERTIES_SECTION: FormSection = {
  id: "sec_root_canvas_props",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "layout",
      LABEL: "Form Layout Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "horizontal",
      PARAMETER: {
        type: "O",
        data: [
          { code: "horizontal", label: "Horizontal" },
          { code: "stacked", label: "Stacked" },
        ],
      },
      ENRICHTEXT:
        "Governs teller scanline density: Horizontal (Label : Input) vs Stacked (Label above Input).",
    },
    {
      SN: "2",
      NAME: "density",
      LABEL: "Default Form Density",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "compact",
      PARAMETER: {
        type: "O",
        data: [
          { code: "compact", label: "Compact" },
          { code: "normal", label: "Normal" },
          { code: "spacious", label: "Spacious" },
        ],
      },
      ENRICHTEXT: "Default row spacing and input height across all form containers.",
    },
  ],
};

/**
 * Standard Form Section for Container Properties (Cards and Tab Groups).
 */
export const CONTAINER_PROPERTIES_SECTION: FormSection = {
  id: "sec_container_props",
  containerType: "card",
  containerConfig: { variant: "ghost" },
  columns: 1,
  fields: [
    {
      SN: "1",
      NAME: "title",
      LABEL: "Container Title",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 60,
      WIDTH: "full",
      ENRICHTEXT:
        "Header title displayed above this container. Leave empty for default headerless card.",
    },
    {
      SN: "2",
      NAME: "description",
      LABEL: "Container Description",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 120,
      WIDTH: "full",
      ENRICHTEXT: "Optional sub-heading or explanatory text displayed next to the container title.",
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
      DEFAULTVALUE: "1",
      PARAMETER: {
        type: "O",
        data: [
          { code: "1", label: "1 Col" },
          { code: "2", label: "2 Col" },
          { code: "3", label: "3 Col" },
          { code: "4", label: "4 Col" },
        ],
      },
      ENRICHTEXT: "Number of equal responsive columns inside this section.",
    },
    {
      SN: "4",
      NAME: "collapsible",
      LABEL: "Collapsible Card",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        activeLabel: "Yes",
        inactiveLabel: "No",
      },
      ENRICHTEXT: "Allows operators to collapse and expand this section.",
    },
    {
      SN: "4b",
      NAME: "isCollapsed",
      LABEL: "Start Collapsed",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      BOOLEAN_CONFIG: { activeLabel: "Yes", inactiveLabel: "No" },
      ENRICHTEXT: "The card opens collapsed; the operator expands it when needed.",
      VISIBLE_WHEN: { field: "collapsible", operator: "truthy" },
    },
    {
      SN: "4c",
      NAME: "containerConfig.variant",
      LABEL: "Card Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "select",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "default", label: "Default" },
          { code: "subtle", label: "Subtle (tinted)" },
          { code: "bordered", label: "Bordered" },
          { code: "elevated", label: "Elevated (shadow)" },
          { code: "ghost", label: "Ghost (frameless)" },
        ],
      },
      ENRICHTEXT: "Preset for header, border and background. The three settings below override it.",
    },
    {
      SN: "4d",
      NAME: "containerConfig.density",
      LABEL: "Card Density",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "compact", label: "Compact" },
          { code: "normal", label: "Normal" },
          { code: "spacious", label: "Spacious" },
        ],
      },
      ENRICHTEXT: "Padding inside this card. Empty follows the form's density.",
    },
    {
      SN: "5",
      NAME: "containerConfig.showHeader",
      LABEL: "Show Header",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      BOOLEAN_CONFIG: {
        activeLabel: "Yes",
        inactiveLabel: "No",
      },
      ENRICHTEXT: "Display header toolbar with title and badges. Unset follows the card style.",
    },
    {
      SN: "6",
      NAME: "containerConfig.bordered",
      LABEL: "Card Border",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      BOOLEAN_CONFIG: {
        activeLabel: "Yes",
        inactiveLabel: "No",
      },
      ENRICHTEXT: "Display a border around the card. Unset follows the card style.",
    },
    {
      SN: "7",
      NAME: "containerConfig.background",
      LABEL: "Card Background",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 10,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "regular", label: "Regular" },
          { code: "subtle", label: "Subtle" },
          { code: "none", label: "None" },
        ],
      },
      ENRICHTEXT:
        "Card fill: regular surface, subtle tint, or none (transparent). Unset follows the card style.",
    },
    {
      SN: "8",
      NAME: "containerConfig.badge",
      LABEL: "Header Badge",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 30,
      WIDTH: "full",
      ENRICHTEXT: "Optional status badge rendered in container header (e.g. MANDATORY, NEW).",
    },
    {
      SN: "9",
      NAME: "containerConfig.badgeVariant",
      LABEL: "Badge Color Style",
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
      DEFAULTVALUE: "350",
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
      DEFAULTVALUE: "1",
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

export const TAB_PROPERTIES_SECTIONS: FormSection[] = [
  TAB_GROUP_PROPERTIES_SECTION,
  TAB_ITEM_PROPERTIES_SECTION,
];
