import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { getFieldValue } from "./path-utils";

/* -------------------------------------------------------------------------- */
/* Single Field Validation Primitive                                          */
/* -------------------------------------------------------------------------- */

export interface FieldValidationRule {
  required?: boolean;
  length?: number | string;
  pattern?: string;
  label?: string;
  type?: string;
}

export function validateSingleField(rule: FieldValidationRule, value: unknown): string | null {
  const isMissingOrEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) &&
      (value.length === 0 ||
        value.every((v) => v === undefined || v === null || String(v).trim() === "")));

  const label = rule.label || "Field";

  // 1. Mandatory Required Check
  if (rule.required && isMissingOrEmpty) {
    return `${label} is required`;
  }

  if (
    rule.required &&
    Array.isArray(value) &&
    value.some((v) => v === undefined || v === null || String(v).trim() === "")
  ) {
    return `Each ${label} item is required`;
  }

  // Skip further validation on empty optional fields
  if (isMissingOrEmpty) {
    return null;
  }

  const fieldType = (rule.type || "").toLowerCase();
  const isNumeric =
    fieldType === "number" ||
    fieldType === "amount" ||
    fieldType === "rate" ||
    fieldType === "integer" ||
    fieldType === "decimal";
  const isDate = fieldType === "date" || fieldType === "datetime";

  // 2. Numeric Type & Digit Validation
  if (isNumeric) {
    const num = Number(value);
    if (typeof value === "string" && (Number.isNaN(num) || value.trim() === "")) {
      return `${label} must be a valid number`;
    }
    if (typeof rule.length === "number" && rule.length > 0) {
      const digits = String(Math.abs(num)).replace(".", "");
      if (digits.length > rule.length) {
        return `${label} cannot exceed ${rule.length} digits`;
      }
    }
    return null;
  }

  // 3. Date Type Validation
  if (isDate) {
    if (typeof value === "string" && Number.isNaN(Date.parse(value))) {
      return `${label} must be a valid date`;
    }
    return null;
  }

  // 4. Pattern / Regex Check
  if (rule.pattern && typeof value === "string") {
    try {
      const reg = new RegExp(rule.pattern);
      if (!reg.test(value)) {
        return `${label} format is invalid`;
      }
    } catch {
      // Ignore invalid regex in user metadata
    }
  }

  // 5. Standard Text Max Length Validation
  if (typeof rule.length === "number" && rule.length > 0) {
    const str = String(value);
    if (str.length > rule.length) {
      return `${label} cannot exceed ${rule.length} characters`;
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Multi-Field Array Validation                                               */
/* -------------------------------------------------------------------------- */

export function validateFormFields(
  fields: FormElement[],
  values: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentValues = values || {};

  for (const field of fields) {
    const fieldKey = field.NAME;
    if (!fieldKey) continue;

    // Use getFieldValue to accurately retrieve nested paths (e.g. "PARAMETER.modelName", "IDDEF.IDPREFIX")
    const val = getFieldValue(currentValues, fieldKey);

    const err = validateSingleField(
      {
        required: field.REQUIRED,
        length: field.LENGTH,
        label: field.LABEL || fieldKey,
        type: field.TYPE,
        pattern: field.VALIDATION?.pattern,
      },
      val,
    );

    if (err) {
      errors[fieldKey] = err;
    }
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Full Spec or Sections Validation                                           */
/* -------------------------------------------------------------------------- */

export function validateValues(
  specOrSections: FormConfigRecord | { sections: FormSection[] } | FormSection[],
  values: Record<string, unknown> | null | undefined,
): Record<string, string> {
  let sections: FormSection[] = [];
  if (Array.isArray(specOrSections)) {
    sections = specOrSections;
  } else if ("frmElements" in specOrSections && specOrSections.frmElements?.sections) {
    sections = specOrSections.frmElements.sections;
  } else if ("sections" in specOrSections && Array.isArray(specOrSections.sections)) {
    sections = specOrSections.sections;
  }

  const allFields = sections.flatMap((s) => s.fields || []);
  return validateFormFields(allFields, values);
}
