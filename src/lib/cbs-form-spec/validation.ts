/**
 * @fileoverview Headless Form Validation Engine (Atomic & Recursive Multi-Field)
 * @module cbs-form-spec/validation
 *
 * Core Invariants:
 * - Pure headless validation evaluating mandatory required fields, physical lengths, and formats.
 * - Recursively traverses nested object hierarchies (`PROP`) producing dot-notated error maps.
 * - 1:1 Schema fidelity with FieldValidationRule (matches, min, max, message) and the widget
 *   settings that constrain a value (number / rate decimals, date offsets).
 */

import { isIsoDate, isIsoDateTime, offsetIsoDate } from "@/lib/core-utils";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  type FieldValidationRule,
  type FormConfigRecord,
  type FormElement,
  type FormSection,
  type PropertyType,
} from "@/lib/data-schemas";
import { evaluateFieldCondition } from "./field-rules";
import { getFieldValue } from "./path-utils";

/** Plain decimal only: no exponent, hex, Infinity or thousands separators. */
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;
const isScalar = (v: unknown): boolean => v === null || typeof v !== "object";

/** Decimal places a numeric field allows: `RATE_CONFIG` for a rate, else `NUMBER_CONFIG`. */
export function resolveFieldDecimals(field: FormElement): number | undefined {
  return field.WIDGET === "rate" ? field.RATE_CONFIG?.decimals : field.NUMBER_CONFIG?.decimals;
}

/** Allowed ISO date range from `DATE_CONFIG` offsets (whole days from today in bank time). */
export function resolveFieldDateRange(field: FormElement): { min?: string; max?: string } {
  const range = field.DATE_CONFIG;
  return {
    min: range?.minDateOffset !== undefined ? offsetIsoDate(range.minDateOffset) : undefined,
    max: range?.maxDateOffset !== undefined ? offsetIsoDate(range.maxDateOffset) : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Field Validation
// ─────────────────────────────────────────────────────────────────────────────
export interface SingleFieldValidationContext {
  required?: boolean;
  length?: number | string;
  label?: string;
  type?: PropertyType;
  validation?: FieldValidationRule;
  /** Maximum decimal places of a numeric value. */
  decimals?: number;
  /** Allowed ISO date range (inclusive) of a date or date-time value. */
  dateRange?: { min?: string; max?: string };
}

/**
 * Validates a single form field value against its physical and presentation rules.
 *
 * @param ctx Field validation metadata (required, length, label, type, custom validation rule).
 * @param value Raw field value to test.
 * @returns Error message string if invalid, or null if valid.
 * @internal Exported only for scripts/verify.
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

  // Multi-value (M) scalar field: every filled item meets the single-value rules
  if (Array.isArray(value)) {
    if (ctx.type === CBS_PROPERTY_TYPE.ARRAY || !value.every(isScalar)) return null;
    for (const item of value) {
      const itemError = validateSingleField({ ...ctx, required: false }, item);
      if (itemError) return itemError;
    }
    return null;
  }

  const isNumeric = ctx.type === CBS_PROPERTY_TYPE.NUMBER;
  const isDate = ctx.type === CBS_PROPERTY_TYPE.DATE;
  const isDateTime = ctx.type === CBS_PROPERTY_TYPE.DATETIME;
  const isTime = ctx.type === CBS_PROPERTY_TYPE.TIME;

  // 2. Numeric Type & Range Validation
  if (isNumeric) {
    const num = Number(typeof value === "string" ? value.trim() : value);
    const isPlain =
      typeof value === "string" ? PLAIN_NUMBER.test(value.trim()) : Number.isFinite(num);
    if (!isPlain) {
      return `${label} must be a valid number`;
    }
    if (typeof ctx.length === "number" && ctx.length > 0) {
      const digits = String(Math.abs(num)).replace(".", "");
      if (digits.length > ctx.length) return `${label} cannot exceed ${ctx.length} digits`;
    }
    if (ctx.decimals !== undefined) {
      const fraction = String(value).trim().split(".")[1] ?? "";
      if (fraction.length > ctx.decimals) {
        return ctx.decimals === 0
          ? `${label} must be a whole number`
          : `${label} allows at most ${ctx.decimals} decimal places`;
      }
    }
    if (ctx.validation?.min !== undefined && num < ctx.validation.min) {
      return ctx.validation.message || `${label} must be at least ${ctx.validation.min}`;
    }
    if (ctx.validation?.max !== undefined && num > ctx.validation.max) {
      return ctx.validation.message || `${label} cannot exceed ${ctx.validation.max}`;
    }
    return null;
  }

  // 3. Date / DateTime Validation: ISO only (YYYY-MM-DD; date-time with an offset), real days
  if (isDate || isDateTime) {
    const valid = isDate ? isIsoDate : isIsoDateTime;
    if (typeof value === "string" && !valid(value.trim())) {
      return `${label} must be a valid ${isDate ? "date" : "date and time"}`;
    }
    // ISO dates compare as strings; a date-time is checked by its calendar day
    const day = String(value).trim().slice(0, 10);
    if (ctx.dateRange?.min && day < ctx.dateRange.min) {
      return `${label} cannot be before ${ctx.dateRange.min}`;
    }
    if (ctx.dateRange?.max && day > ctx.dateRange.max) {
      return `${label} cannot be after ${ctx.dateRange.max}`;
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

  // The core pads fixed-width text with trailing spaces; they never count against the rules
  const text = typeof value === "string" ? value.trimEnd() : null;

  // 5. Pattern / Regex Check
  const pattern = ctx.validation?.matches;
  if (pattern && text !== null) {
    try {
      if (!new RegExp(pattern).test(text))
        return ctx.validation?.message || `${label} format is invalid`;
    } catch {
      // Ignore invalid regex in user metadata
    }
  }

  // 6. Text Length Validation (Min, Max, Physical Length)
  if (text !== null) {
    if (ctx.validation?.min !== undefined && text.length < ctx.validation.min) {
      return ctx.validation.message || `${label} must be at least ${ctx.validation.min} characters`;
    }
    if (ctx.validation?.max !== undefined && text.length > ctx.validation.max) {
      return ctx.validation.message || `${label} cannot exceed ${ctx.validation.max} characters`;
    }
    if (typeof ctx.length === "number" && ctx.length > 0 && text.length > ctx.length) {
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

    // A field the screen hides (same conditions as FieldGrid) can't be filled, so it isn't checked
    if (field.VISIBLE_WHEN && !evaluateFieldCondition(field.VISIBLE_WHEN, currentValues)) continue;

    const val = getFieldValue(currentValues, fieldKey);
    const err = validateSingleField(
      {
        required: field.REQUIRED,
        length: field.LENGTH,
        label: field.LABEL || field.NAME,
        type: field.TYPE,
        validation: field.VALIDATION,
        decimals: resolveFieldDecimals(field),
        dateRange: resolveFieldDateRange(field),
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
      } else if (field.STRUCTURE !== CBS_PROPERTY_STRUCTURE.MULTI) {
        // A single object group always has its inner fields; a repeating set with no rows has none
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
 * Validates all fields of a compiled form (the record, or its sections).
 *
 * @param specOrSections Full form specification or array of form sections.
 * @param values Draft form state record to validate.
 * @returns Map of dot-notated field paths to error messages (`{}` when valid).
 */
export function validateValues(
  specOrSections: FormConfigRecord | FormSection[],
  values: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const sections = Array.isArray(specOrSections)
    ? specOrSections
    : (specOrSections.frmElements?.sections ?? []);

  const allFields = sections.flatMap((s) => s.fields || []);
  return validateFormFields(allFields, values);
}
