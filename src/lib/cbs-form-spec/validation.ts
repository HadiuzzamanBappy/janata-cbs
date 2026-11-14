/**
 * @fileoverview Headless Form Validation Engine (Atomic & Recursive Multi-Field)
 * @module cbs-form-spec/validation
 *
 * Core Invariants:
 * - Pure headless validation evaluating mandatory required fields, physical lengths, and formats.
 * - Recursively traverses nested object hierarchies (`PROP`) producing dot-notated error maps.
 * - 1:1 Schema fidelity with FieldValidationRule (matches, min, max, message, pattern).
 */

import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FieldValidationRule, FormElement } from "@/lib/data-schemas/form-engine-schema";
import { getFieldValue } from "./path-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Single Field Validation
// ─────────────────────────────────────────────────────────────────────────────
export interface SingleFieldValidationContext {
  required?: boolean;
  length?: number | string;
  label?: string;
  type?: string;
  validation?: FieldValidationRule;
}

/**
 * Validates a single form field value against its physical and presentation rules.
 *
 * @param ctx Field validation metadata (required, length, label, type, custom validation rule).
 * @param value Raw field value to test.
 * @returns Error message string if invalid, or null if valid.
 */
export function validateSingleField(
  ctx: SingleFieldValidationContext,
  value: unknown,
): string | null {
  const isMissingOrEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) &&
      (value.length === 0 ||
        value.every((v) => v === undefined || v === null || String(v).trim() === "")));

  const label = ctx.label || "Field";

  // 1. Mandatory Required Check
  if (ctx.required && isMissingOrEmpty) return `${label} is required`;
  if (
    ctx.required &&
    Array.isArray(value) &&
    value.some((v) => v === undefined || v === null || String(v).trim() === "")
  ) {
    return `Each ${label} item is required`;
  }

  // Skip further validation on empty optional fields
  if (isMissingOrEmpty) return null;

  const fieldType = (ctx.type || "").toLowerCase();
  const isNumeric = fieldType === "number" || fieldType === "amount" || fieldType === "rate";
  const isDate = fieldType === "date" || fieldType === "datetime";
  const isTime = fieldType === "time";

  // 2. Numeric Type & Range Validation
  if (isNumeric) {
    const num = Number(value);
    if (typeof value === "string" && (Number.isNaN(num) || value.trim() === "")) {
      return `${label} must be a valid number`;
    }
    if (typeof ctx.length === "number" && ctx.length > 0) {
      const digits = String(Math.abs(num)).replace(".", "");
      if (digits.length > ctx.length) return `${label} cannot exceed ${ctx.length} digits`;
    }
    if (ctx.validation?.min !== undefined && num < ctx.validation.min) {
      return ctx.validation.message || `${label} must be at least ${ctx.validation.min}`;
    }
    if (ctx.validation?.max !== undefined && num > ctx.validation.max) {
      return ctx.validation.message || `${label} cannot exceed ${ctx.validation.max}`;
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

  // 4. Time Type Validation (HH:mm or HH:mm:ss)
  if (isTime) {
    if (
      typeof value === "string" &&
      !/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(value.trim())
    ) {
      return `${label} must be a valid time (HH:mm)`;
    }
    return null;
  }

  // 5. Pattern / Regex Check (pattern or matches)
  const pattern = ctx.validation?.pattern || ctx.validation?.matches;
  if (pattern && typeof value === "string") {
    try {
      if (!new RegExp(pattern).test(value))
        return ctx.validation?.message || `${label} format is invalid`;
    } catch {
      // Ignore invalid regex in user metadata
    }
  }

  // 6. Text Length Validation (Min, Max, Physical Length)
  if (typeof value === "string") {
    if (ctx.validation?.min !== undefined && value.length < ctx.validation.min) {
      return ctx.validation.message || `${label} must be at least ${ctx.validation.min} characters`;
    }
    if (ctx.validation?.max !== undefined && value.length > ctx.validation.max) {
      return ctx.validation.message || `${label} cannot exceed ${ctx.validation.max} characters`;
    }
    if (typeof ctx.length === "number" && ctx.length > 0 && value.length > ctx.length) {
      return `${label} cannot exceed ${ctx.length} characters`;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Field & Recursive Object Field Validation
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Validates a list of form elements against current draft values, recursively
 * traversing nested sub-properties (`PROP`) for object and array-of-object structures.
 *
 * @param fields Array of FormElement specifications.
 * @param values Current draft form values record.
 * @param parentPrefix Dot-path prefix for nested sub-properties.
 * @returns Map of field path to error message strings (empty if all valid).
 */
export function validateFormFields(
  fields: FormElement[],
  values: Record<string, unknown> | null | undefined,
  parentPrefix: string = "",
): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentValues = values || {};

  for (const field of fields) {
    const fieldKey = parentPrefix ? `${parentPrefix}.${field.NAME}` : field.NAME;
    if (!fieldKey) continue;

    const val = getFieldValue(currentValues, fieldKey);
    const err = validateSingleField(
      {
        required: field.REQUIRED,
        length: field.LENGTH,
        label: field.LABEL || field.NAME,
        type: field.TYPE,
        validation: field.VALIDATION,
      },
      val,
    );
    if (err) errors[fieldKey] = err;

    // Recursive validation for nested sub-properties (e.g. object field or table sets)
    if (Array.isArray(field.PROP) && field.PROP.length > 0) {
      if (Array.isArray(val)) {
        val.forEach((_, idx) => {
          Object.assign(
            errors,
            validateFormFields(field.PROP as FormElement[], currentValues, `${fieldKey}.${idx}`),
          );
        });
      } else {
        Object.assign(errors, validateFormFields(field.PROP, currentValues, fieldKey));
      }
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spec & Sections Validator (Public Entry Point)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Validates all fields across an entire FormConfigRecord or array of FormSections.
 *
 * @param specOrSections Full form specification or array of form sections.
 * @param values Draft form state record to validate.
 * @returns Map of dot-notated field paths to error messages (`{}` when valid).
 */
export function validateValues(
  specOrSections: FormConfigRecord | { sections: FormSection[] } | FormSection[],
  values: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const sections: FormSection[] = Array.isArray(specOrSections)
    ? specOrSections
    : "frmElements" in specOrSections && specOrSections.frmElements?.sections
      ? specOrSections.frmElements.sections
      : "sections" in specOrSections && Array.isArray(specOrSections.sections)
        ? specOrSections.sections
        : [];

  const allFields = sections.flatMap((s) => s.fields || []);
  return validateFormFields(allFields, values);
}
