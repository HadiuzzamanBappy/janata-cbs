import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

/* -------------------------------------------------------------------------- */
/* Headless Form Values Validator                                             */
/* -------------------------------------------------------------------------- */

/**
 * Pure, headless validation engine for CBS form runtime values against a FormConfigRecord.
 * Evaluates mandatory required status, numeric/date format types, and max length/digit constraints.
 *
 * @returns Map of field NAME -> error message. Returns empty object {} if clean.
 */
export function validateValues(
  spec: FormConfigRecord,
  values: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentValues = values || {};

  const allFields = (spec.frmElements?.sections || []).flatMap((s) => s.fields || []);

  for (const field of allFields) {
    const fieldKey = field.NAME;
    if (!fieldKey) continue;

    const rawVal = currentValues[fieldKey];
    const isMissingOrEmpty =
      rawVal === undefined ||
      rawVal === null ||
      rawVal === "" ||
      (Array.isArray(rawVal) &&
        (rawVal.length === 0 ||
          rawVal.every((v) => v === undefined || v === null || String(v).trim() === "")));

    // 1. Mandatory Required Check
    if (field.REQUIRED && isMissingOrEmpty) {
      errors[fieldKey] = `${field.LABEL || fieldKey} is required`;
      continue;
    }

    if (
      field.REQUIRED &&
      Array.isArray(rawVal) &&
      rawVal.some((v) => v === undefined || v === null || String(v).trim() === "")
    ) {
      errors[fieldKey] = `Each ${field.LABEL || fieldKey} item is required`;
      continue;
    }

    // Skip further validation for empty optional fields
    if (isMissingOrEmpty) {
      continue;
    }

    const fieldType = (field.TYPE || "").toLowerCase();
    const isNumeric =
      fieldType === "number" ||
      fieldType === "amount" ||
      fieldType === "integer" ||
      fieldType === "decimal";

    const isDate = fieldType === "date" || fieldType === "datetime";

    // 2. Numeric Type & Digit Validation
    if (isNumeric) {
      const num = Number(rawVal);
      if (typeof rawVal === "string" && (Number.isNaN(num) || rawVal.trim() === "")) {
        errors[fieldKey] = `${field.LABEL || fieldKey} must be a valid number`;
        continue;
      }
      if (typeof field.LENGTH === "number" && field.LENGTH > 0) {
        const digits = String(Math.abs(num)).replace(".", "");
        if (digits.length > field.LENGTH) {
          errors[fieldKey] = `${field.LABEL || fieldKey} cannot exceed ${field.LENGTH} digits`;
          continue;
        }
      }
      continue;
    }

    // 3. Date Type Validation
    if (isDate) {
      if (typeof rawVal === "string" && Number.isNaN(Date.parse(rawVal))) {
        errors[fieldKey] = `${field.LABEL || fieldKey} must be a valid date`;
        continue;
      }
      continue;
    }

    // 4. Standard Text / String Max Length Validation
    if (typeof field.LENGTH === "number" && field.LENGTH > 0) {
      if (typeof rawVal === "string" && rawVal.length > field.LENGTH) {
        errors[fieldKey] = `${field.LABEL || fieldKey} cannot exceed ${field.LENGTH} characters`;
      }
    }
  }

  return errors;
}
