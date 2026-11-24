/**
 * @fileoverview Form section specifications for FORM.CONFIG Routine Hooks.
 * Each lifecycle routine (Validation, Pre-Auth, Post-Auth) is rendered in its own individual card,
 * matching the original object-group formula and standard horizontal field layout.
 *
 * @module features/system/form-config/fields/fc-routine-fields
 */

import type { FormSection } from "@/lib/data-schemas";

export const FORM_ROUTINE_SECTIONS: FormSection[] = [
  {
    id: "sec_fc_routine_validate",
    title: "Validation Routine",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "frmRoutine.rtnValidate",
        LABEL: "Validation Routine",
        TYPE: "Array",
        STRUCTURE: "M",
        LENGTH: 0,
        WIDTH: "full",
        PROP: [
          {
            SN: "1_1",
            NAME: "routineName",
            LABEL: "Routine Name",
            TYPE: "String",
            STRUCTURE: "S",
            LENGTH: 50,
            REQUIRED: true,
            WIDTH: "md",
            ENRICHTEXT: "Name of the server or client routine executed before form submission.",
          },
          {
            SN: "1_2",
            NAME: "routineDescription",
            LABEL: "Description",
            TYPE: "String",
            STRUCTURE: "S",
            LENGTH: 100,
            WIDTH: "xl",
            ENRICHTEXT: "Functional purpose and conditions of this validation hook.",
          },
        ],
      },
    ],
  },
  {
    id: "sec_fc_routine_before_auth",
    title: "Pre-Auth Routine",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "2",
        NAME: "frmRoutine.rtnBeforeAuth",
        LABEL: "Pre-Auth Routine",
        TYPE: "Array",
        STRUCTURE: "M",
        LENGTH: 0,
        WIDTH: "full",
        PROP: [
          {
            SN: "2_1",
            NAME: "routineName",
            LABEL: "Routine Name",
            TYPE: "String",
            STRUCTURE: "S",
            LENGTH: 50,
            REQUIRED: true,
            WIDTH: "md",
            ENRICHTEXT: "Hook executed during Maker-Checker verification prior to authorization.",
          },
          {
            SN: "2_2",
            NAME: "routineDescription",
            LABEL: "Description",
            TYPE: "String",
            STRUCTURE: "S",
            LENGTH: 100,
            WIDTH: "xl",
            ENRICHTEXT: "Validation rules enforced on the authorizer/checker.",
          },
        ],
      },
    ],
  },
  {
    id: "sec_fc_routine_after_auth",
    title: "Post-Auth Routine",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "3",
        NAME: "frmRoutine.rtnAfterAuth",
        LABEL: "Post-Auth Routine",
        TYPE: "Array",
        STRUCTURE: "M",
        LENGTH: 0,
        WIDTH: "full",
        PROP: [
          {
            SN: "3_1",
            NAME: "routineName",
            LABEL: "Routine Name",
            TYPE: "String",
            STRUCTURE: "S",
            LENGTH: 50,
            REQUIRED: true,
            WIDTH: "md",
            ENRICHTEXT:
              "Post-commit hook (e.g. accounting voucher posting, notification triggers).",
          },
          {
            SN: "3_2",
            NAME: "routineDescription",
            LABEL: "Description",
            TYPE: "String",
            STRUCTURE: "S",
            LENGTH: 100,
            WIDTH: "xl",
            ENRICHTEXT: "Downstream events dispatched following successful authorization.",
          },
        ],
      },
    ],
  },
];
