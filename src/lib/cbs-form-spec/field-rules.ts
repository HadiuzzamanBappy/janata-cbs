import type { CompiledFormSpec } from "@/lib/data-schemas";

/* -------------------------------------------------------------------------- */
/* Headless Form Values Validator                                             */
/* -------------------------------------------------------------------------- */

/**
 * Pure, headless validation engine for CBS form runtime values against a CompiledFormSpec.
 * Evaluates mandatory required status, numeric/date format types, and max length/digit constraints.
 *
 * @returns Map of fieldKey -> error message. Returns empty object {} if clean.
 */
export function validateValues(
  spec: CompiledFormSpec,
  values: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentValues = values || {};

  for (const field of spec.fields) {
    const rawVal = currentValues[field.fieldKey];
    const isMissingOrEmpty =
      rawVal === undefined ||
      rawVal === null ||
      rawVal === "" ||
      (Array.isArray(rawVal) && rawVal.length === 0);

    // 1. Mandatory Required Check
    if (field.required && isMissingOrEmpty) {
      errors[field.fieldKey] = `${field.label} is required`;
      continue;
    }

    // Skip validation for empty optional fields
    if (isMissingOrEmpty) {
      continue;
    }

    const isNumeric =
      field.widget === "number" || field.widget === "amount" || field.modelType === "Number";

    const isDate = field.widget === "date" || field.modelType === "Date";

    // 2. Numeric Type & Digit Validation
    if (isNumeric) {
      const num = Number(rawVal);
      if (typeof rawVal === "string" && (Number.isNaN(num) || rawVal.trim() === "")) {
        errors[field.fieldKey] = `${field.label} must be a valid number`;
        continue;
      }
      if (typeof field.length === "number" && field.length > 0) {
        const digits = String(Math.abs(num)).replace(".", "");
        if (digits.length > field.length) {
          errors[field.fieldKey] = `${field.label} cannot exceed ${field.length} digits`;
          continue;
        }
      }
      continue;
    }

    // 3. Date Type Validation
    if (isDate) {
      if (typeof rawVal === "string" && Number.isNaN(Date.parse(rawVal))) {
        errors[field.fieldKey] = `${field.label} must be a valid date`;
        continue;
      }
      continue;
    }

    // 4. Standard Text / String Max Length Validation
    if (typeof field.length === "number" && field.length > 0) {
      if (typeof rawVal === "string" && rawVal.length > field.length) {
        errors[field.fieldKey] = `${field.label} cannot exceed ${field.length} characters`;
      }
    }
  }

  return errors;
}
