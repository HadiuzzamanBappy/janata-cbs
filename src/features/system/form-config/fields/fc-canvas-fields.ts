/**
 * @fileoverview Canvas & Container form specifications for FORM.CONFIG.
 * Defines presentation schemas for Root Canvas Layout and Container Cards (tab groups: fc-tab-fields).
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
      PARAMETER: {
        type: "O",
        data: [
          { code: "compact", label: "Compact" },
          { code: "normal", label: "Normal" },
          { code: "spacious", label: "Spacious" },
        ],
      },
      ENRICHTEXT: "Default row spacing and container padding across all form sections.",
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
          { code: "auto", label: "Auto" },
          { code: "compact", label: "Compact" },
          { code: "normal", label: "Normal" },
          { code: "spacious", label: "Spacious" },
        ],
      },
      ENRICHTEXT: "Padding inside this card. Empty follows the form's density.",
    },
    {
      SN: "5",
      NAME: "containerConfig.variant",
      LABEL: "Card Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      PARAMETER: {
        type: "O",
        data: [
          { code: "default", label: "Default" },
          { code: "subtle", label: "Subtle" },
          { code: "bordered", label: "Bordered" },
          { code: "elevated", label: "Elevated" },
          { code: "ghost", label: "Ghost" },
        ],
      },
      ENRICHTEXT: "Visual preset for this card section.",
    },
    {
      SN: "6",
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
