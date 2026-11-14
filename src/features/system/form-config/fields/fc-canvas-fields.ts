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
      ENRICHTEXT: "Default column grid arrangement for root canvas blocks.",
    },
    {
      SN: "2",
      NAME: "density",
      LABEL: "Canvas Density",
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
      ENRICHTEXT: "Visual spacing and density across form sections.",
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
      SN: "3",
      NAME: "collapsible",
      LABEL: "Collapsible Card",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      BOOLEAN_CONFIG: {
        widgetStyle: "switch",
        trueValue: "true",
        falseValue: "false",
        activeLabel: "Yes",
        inactiveLabel: "No",
      },
      ENRICHTEXT: "Allows operators to collapse and expand this section.",
    },
    {
      SN: "4",
      NAME: "containerConfig.variant",
      LABEL: "Visual Variant",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "default",
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
    },
    {
      SN: "5",
      NAME: "containerConfig.density",
      LABEL: "Density",
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
      SN: "7",
      NAME: "containerConfig.badgeVariant",
      LABEL: "Badge Color Style",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 15,
      WIDGET: "segmented",
      WIDTH: "full",
      DEFAULTVALUE: "default",
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
    {
      SN: "8",
      NAME: "containerConfig.bordered",
      LABEL: "Explicit Outer Border",
      TYPE: "Boolean",
      STRUCTURE: "S",
      LENGTH: 1,
      WIDGET: "switch",
      WIDTH: "full",
      DEFAULTVALUE: "false",
      ENRICHTEXT: "Enforces continuous boundary border regardless of card variant.",
    },
  ],
};
