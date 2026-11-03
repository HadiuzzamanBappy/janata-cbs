import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";

/**
 * Standard Form Sections definition for FORM.CONFIG General tab.
 * Centralized via the platform's form-engine and SectionCard.
 */
export const FORM_CONFIG_SECTIONS: FormSection[] = [
  {
    id: "sec_fc_identity",
    title: "Form Identification",
    type: "standard",
    layoutStyle: "card",
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
        WIDTH: 280,
        ENRICHTEXT: "Primary title of the form layout displayed across core workbench.",
      },
      {
        SN: "2",
        NAME: "description",
        LABEL: "Description",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 200,
        WIDTH: 600,
        ENRICHTEXT: "Summary notes or functional purpose of this form configuration.",
      },
    ],
  },
  {
    id: "sec_fc_auth",
    title: "Authorization & Security Settings",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "3",
        NAME: "authNumber",
        LABEL: "Authorization Level",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 2,
        REQUIRED: true,
        WIDTH: 180,
        ENRICHTEXT: "Minimum required authorization level before committing transactions.",
      },
    ],
  },
];

/**
 * Clean field updater for FormConfigRecord
 */
export function setFieldValue(
  record: FormConfigRecord,
  path: string,
  value: unknown,
): FormConfigRecord {
  let finalVal: unknown = value;
  if (path === "authNumber") {
    finalVal = value !== "" && value !== undefined && value !== null ? Number(value) : 1;
  }

  return {
    ...record,
    [path]: finalVal,
  };
}

/* ========================================================================== */
/* ROUTINE FIELD GROUPS & DEFINITIONS                                         */
/* ========================================================================== */

export type RoutineKey = "rtnValidate" | "rtnBeforeAuth" | "rtnAfterAuth";

export interface RoutineGroupDef {
  key: RoutineKey;
  title: string;
  fieldLabel: string;
  description: string;
  placeholder: string;
}

export const FORM_ROUTINE_GROUPS: RoutineGroupDef[] = [
  {
    key: "rtnValidate",
    title: "Validation Routines (rtnValidate)",
    fieldLabel: "Validation Routine",
    description: "Executed during input validation before transaction packaging and ledger staging",
    placeholder: "e.g. V.ACC.TITLE.CHECK",
  },
  {
    key: "rtnBeforeAuth",
    title: "Before-Authorization Routines (rtnBeforeAuth)",
    fieldLabel: "Before-Auth Routine",
    description:
      "Executed when supervisor triggers authorization, before committing records to core",
    placeholder: "e.g. AUTH.PRE.LIMIT.VERIFY",
  },
  {
    key: "rtnAfterAuth",
    title: "After-Authorization Routines (rtnAfterAuth)",
    fieldLabel: "After-Auth Routine",
    description:
      "Executed post-commit to generate downstream accounting vouchers, notices, or logs",
    placeholder: "e.g. AUTH.POST.NOTIFY.DISPATCH",
  },
];
