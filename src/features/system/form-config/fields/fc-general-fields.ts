/**
 * @fileoverview Form section specifications for FORM.CONFIG General tab.
 * Defines metadata, security clearance, and routine hooks schemas.
 *
 * @module features/system/form-config/fields/fc-general-fields
 */

import type { FormSection } from "@/lib/data-schemas";

/**
 * Standard Form Sections definition for FORM.CONFIG General tab.
 * Includes Form Identification & Security in a single card,
 * and 3 dedicated Multi-Value Object fields for Form Routines.
 */
export const FORM_CONFIG_SECTIONS: FormSection[] = [
  {
    id: "sec_fc_identity",
    title: "Form Identification & Security",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "title",
        LABEL: "Form Title",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 80,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT: "Primary title of the form layout displayed across core workbench.",
      },
      {
        SN: "2",
        NAME: "description",
        LABEL: "Description",
        TYPE: "String",
        STRUCTURE: "S",
        LENGTH: 200,
        WIDTH: "xl",
        ENRICHTEXT: "Summary notes or functional purpose of this form configuration.",
      },
      {
        SN: "3",
        NAME: "authNumber",
        LABEL: "Authorization Level",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 2,
        REQUIRED: true,
        WIDTH: "sm",
        DEFAULTVALUE: "1",
        ENRICHTEXT: "Minimum required authorization level before committing transactions.",
      },
    ],
  },
];
