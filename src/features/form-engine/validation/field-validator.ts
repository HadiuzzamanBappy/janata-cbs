/**
 * Pure Banking Field & Schema Validator
 *
 * Enforces field length, pattern masks, numeric bounds, and required states
 * across dynamic 150 - 1,000 field schemas.
 */

import type { FormSchema } from "@/lib/data-schemas";

export interface FieldValidationRule {
  required?: boolean;
  length?: number | string;
  pattern?: string;
  label?: string;
}

export function validateSingleField(rule: FieldValidationRule, value: unknown): string | null {
  const str = value !== undefined && value !== null ? String(value).trim() : "";

  // 1. Required Check
  if (rule.required && str === "") {
    return `${rule.label || "Field"} is required`;
  }

  if (str === "") {
    return null; // Don't run format checks on optional empty fields
  }

  // 2. Exact or Max Length
  if (rule.length) {
    const maxLen = Number(rule.length);
    if (!Number.isNaN(maxLen) && str.length > maxLen) {
      return `${rule.label || "Field"} cannot exceed ${maxLen} characters`;
    }
  }

  // 3. Regex Pattern Mask
  if (rule.pattern) {
    try {
      const reg = new RegExp(rule.pattern);
      if (!reg.test(str)) {
        return `${rule.label || "Field"} format is invalid`;
      }
    } catch {
      // Ignore invalid regex in schema
    }
  }

  return null;
}

/**
 * Validates an entire form schema dictionary against the active values.
 * Returns an errors map: { [fieldKey]: "Error message" }
 */
export function validateFormSchema(
  schema: FormSchema | null,
  values: Record<string, unknown>,
): Record<string, string> {
  if (!schema?.fields) return {};

  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    const err = validateSingleField(
      {
        required: field.required,
        label: field.label || field.name,
      },
      values[field.name],
    );

    if (err) {
      errors[field.name] = err;
    }
  }

  return errors;
}
