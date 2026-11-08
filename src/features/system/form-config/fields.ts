import type { FormSection } from "@/lib/data-schemas/form-config-schema";

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
        TYPE: "Text",
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
        TYPE: "Text",
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
  {
    id: "sec_fc_routines",
    title: "Form Routines",
    containerType: "card",
    columns: 1,
    fields: [
      {
        SN: "4",
        NAME: "frmRoutine.rtnValidate",
        LABEL: "Validation Routine",
        TYPE: "Object",
        STRUCTURE: "M",
        LENGTH: 0,
        WIDTH: "full",
        PROP: [
          {
            SN: "4_1",
            NAME: "routineName",
            LABEL: "Routine Hook",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 60,
            REQUIRED: true,
            WIDTH: "md",
            ENRICHTEXT:
              "Backend routine executed during input validation before transaction packaging.",
          },
          {
            SN: "4_2",
            NAME: "routineDescription",
            LABEL: "Description",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 120,
            WIDTH: "xl",
            ENRICHTEXT: "Functional purpose and ledger staging rules of this validation hook.",
          },
        ],
      },
      {
        SN: "5",
        NAME: "frmRoutine.rtnBeforeAuth",
        LABEL: "Before-Auth Routine",
        TYPE: "Object",
        STRUCTURE: "M",
        LENGTH: 0,
        WIDTH: "full",
        PROP: [
          {
            SN: "5_1",
            NAME: "routineName",
            LABEL: "Routine Hook",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 60,
            REQUIRED: true,
            WIDTH: "md",
            ENRICHTEXT:
              "Executed when supervisor triggers authorization, before committing records to core.",
          },
          {
            SN: "5_2",
            NAME: "routineDescription",
            LABEL: "Description",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 120,
            WIDTH: "xl",
            ENRICHTEXT: "Pre-authorization limit verification or credit check hook details.",
          },
        ],
      },
      {
        SN: "6",
        NAME: "frmRoutine.rtnAfterAuth",
        LABEL: "After-Auth Routine",
        TYPE: "Object",
        STRUCTURE: "M",
        LENGTH: 0,
        WIDTH: "full",
        PROP: [
          {
            SN: "6_1",
            NAME: "routineName",
            LABEL: "Routine Hook",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 60,
            REQUIRED: true,
            WIDTH: "md",
            ENRICHTEXT:
              "Executed post-commit to generate downstream accounting vouchers, notices, or logs.",
          },
          {
            SN: "6_2",
            NAME: "routineDescription",
            LABEL: "Description",
            TYPE: "Text",
            STRUCTURE: "S",
            LENGTH: 120,
            WIDTH: "xl",
            ENRICHTEXT:
              "Downstream event dispatcher or post-authorization balance reconciliation routine.",
          },
        ],
      },
    ],
  },
];
