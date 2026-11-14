import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type {
  FieldCascadeRule,
  FieldTransform,
  FieldVisibilityCondition,
  FormElement,
} from "@/lib/data-schemas/form-engine-schema";
import { getFieldValue } from "./path-utils";

/* -------------------------------------------------------------------------- */
/* Field Value Transform Evaluator (TRANSFORM)                                */
/* -------------------------------------------------------------------------- */

export function applyFieldTransform(
  transform: FieldTransform | undefined | null,
  val: unknown,
): unknown {
  if (!transform || transform === "none" || typeof val !== "string") {
    return val;
  }
  switch (transform) {
    case "stripWhitespace":
      return val.replace(/\s+/g, "");
    case "uppercase":
      return val.toUpperCase();
    case "lowercase":
      return val.toLowerCase();
    case "trim":
      return val.trim();
    default:
      return val;
  }
}

/* -------------------------------------------------------------------------- */
/* Reactive Field Cascading Defaults Evaluator (CASCADE)                      */
/* -------------------------------------------------------------------------- */

export function evaluateFieldCascade(
  cascadeRules: FieldCascadeRule[] | undefined | null,
  val: unknown,
): Record<string, unknown> | null {
  if (!cascadeRules || !Array.isArray(cascadeRules) || cascadeRules.length === 0) {
    return null;
  }

  for (const rule of cascadeRules) {
    if (!rule?.set) continue;
    const whenVal = rule.when;

    if (Array.isArray(whenVal)) {
      if (whenVal.some((item) => item === val || String(item) === String(val ?? ""))) {
        return rule.set;
      }
    } else if (whenVal === val || String(whenVal ?? "") === String(val ?? "")) {
      return rule.set;
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Reactive Field Condition Evaluator (VISIBLE_WHEN / DISABLED_WHEN)          */
/* -------------------------------------------------------------------------- */

export function evaluateFieldCondition(
  condition: FieldVisibilityCondition | undefined | null,
  values: Record<string, unknown> | null | undefined,
): boolean {
  if (!condition) return true;
  const currentValues = values || {};

  // 1. Compound 'and'
  if ("and" in condition && Array.isArray(condition.and)) {
    return condition.and.every((cond) => evaluateFieldCondition(cond, currentValues));
  }

  // 2. Compound 'or'
  if ("or" in condition && Array.isArray(condition.or)) {
    return condition.or.some((cond) => evaluateFieldCondition(cond, currentValues));
  }

  // 3. Single field condition
  if ("field" in condition && typeof condition.field === "string") {
    const targetVal = getFieldValue(currentValues, condition.field);
    const op = condition.operator || "eq";
    const expected = condition.value;

    switch (op) {
      case "eq":
        return targetVal === expected || String(targetVal ?? "") === String(expected ?? "");
      case "neq":
        return targetVal !== expected && String(targetVal ?? "") !== String(expected ?? "");
      case "in": {
        if (!Array.isArray(expected)) return false;
        return expected.some(
          (item) => item === targetVal || String(item) === String(targetVal ?? ""),
        );
      }
      case "notIn": {
        if (!Array.isArray(expected)) return true;
        return !expected.some(
          (item) => item === targetVal || String(item) === String(targetVal ?? ""),
        );
      }
      case "gt":
        return Number(targetVal) > Number(expected);
      case "lt":
        return Number(targetVal) < Number(expected);
      case "gte":
        return Number(targetVal) >= Number(expected);
      case "lte":
        return Number(targetVal) <= Number(expected);
      case "truthy":
        return Boolean(targetVal);
      case "falsy":
        return !targetVal;
      default:
        return true;
    }
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/* Reactive Field OnChange Action Evaluator                                   */
/* -------------------------------------------------------------------------- */

export function evaluateOnChangeRule(
  action: string | undefined,
  val: unknown,
  delimiter: string = "#",
): unknown {
  if (action === "join") {
    return Array.isArray(val) ? val.filter(Boolean).join(delimiter) : String(val ?? "");
  }
  if (action === "uppercase") {
    return typeof val === "string" ? val.toUpperCase() : val;
  }
  if (action === "lowercase") {
    return typeof val === "string" ? val.toLowerCase() : val;
  }
  if (action === "clear") {
    return "";
  }
  return val;
}

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
    (typeof value === "string" && value.trim() === "") ||
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

  // 5. Standard Text Max Length Validation (applies exclusively to text strings)
  if (typeof value === "string" && typeof rule.length === "number" && rule.length > 0) {
    if (value.length > rule.length) {
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
