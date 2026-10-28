import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export type MetaFieldGroup = "IDENTITY" | "AUTHORIZATION";

export interface MetaFieldDef {
  path: string;
  label: string;
  group: MetaFieldGroup;
  type: "text" | "number" | "boolean" | "select";
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  width?: "full" | "half" | "compact";
  options?: Array<{ value: string; label: string }>;
  helperText?: string;
}

export const META_FIELD_GROUPS: Array<{
  id: MetaFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Form Identification",
  },
  {
    id: "AUTHORIZATION",
    title: "Authorization & Security Settings",
  },
];

export const FORM_META_FIELDS: MetaFieldDef[] = [
  {
    path: "title",
    label: "Form Title",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Retail Account Opening Form",
    required: true,
    width: "full",
    helperText: "Primary title of the form layout",
  },
  {
    path: "description",
    label: "Description",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Modular canvas demonstration with root variables, card containers...",
    width: "full",
    helperText: "Summary notes or functional purpose of this form configuration",
  },
  {
    path: "authNumber",
    label: "Authorization Level",
    group: "AUTHORIZATION",
    type: "number",
    placeholder: "1",
    required: true,
    width: "compact",
    helperText: "Minimum required authorization level before committing",
  },
];

export function getFieldValue(record: FormConfigRecord, path: string): unknown {
  return (record as Record<string, unknown>)[path];
}

export function setFieldValue(
  record: FormConfigRecord,
  path: string,
  value: unknown,
): FormConfigRecord {
  return {
    ...record,
    [path]: value,
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
