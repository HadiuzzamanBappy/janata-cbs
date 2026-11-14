/**
 * @fileoverview Reactive Field Behaviors (Transforms, Cascades, Conditions, OnChange)
 * @module cbs-form-spec/field-rules
 *
 * Core Invariants:
 * - Pure, stateless evaluation of reactive form behavior rules without component state side-effects.
 * - Supports compound boolean logic ("and", "or") and granular relational operators for visibility.
 * - Evaluates declarative value transforms and cascading default updates upon field modification.
 */

import type {
  FieldCascadeRule,
  FieldTransform,
  FieldVisibilityCondition,
} from "@/lib/data-schemas/form-engine-schema";
import { getFieldValue } from "./path-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Declarative Value Transforms
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies declarative string formatting transforms to user input values.
 *
 * Supported transforms:
 * - "stripWhitespace": Removes all spaces and linebreaks.
 * - "uppercase": Converts alphabetic characters to uppercase.
 * - "lowercase": Converts alphabetic characters to lowercase.
 * - "trim": Trims leading and trailing whitespace.
 *
 * @param transform Transform identifier configured on the field.
 * @param val Raw user input value.
 * @returns Transformed value, or unchanged original value if not applicable.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Reactive Cascading Defaults
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates cascading field mutations triggered when a source field value changes.
 * Matches `val` against rule `when` triggers (supporting exact scalar or array inclusion).
 *
 * @param cascadeRules List of cascade definitions configured on the field.
 * @param val Current value of the source field.
 * @returns Key-value map of dependent field updates, or null if no rules match.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Visibility & Interactive Conditions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates dynamic conditions (VISIBLE_WHEN, DISABLED_WHEN, HIDDEN_WHEN)
 * against the current form values state.
 *
 * Supported operators:
 * - "eq" / "neq": Exact value equality / inequality.
 * - "in" / "notIn": Array inclusion / exclusion.
 * - "gt" / "lt" / "gte" / "lte": Numerical comparison.
 * - "truthy" / "falsy": Existence / non-existence check.
 * - Compound "and" / "or": Recursive nested group evaluation.
 *
 * @param condition Condition specification attached to the form element.
 * @param values Current form state values dictionary.
 * @returns Boolean indicating whether the condition evaluates to true.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Reactive OnChange Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates specialized ON_CHANGE actions (e.g. joining array items or text casing).
 *
 * @param action Action identifier (e.g. "join", "uppercase", "lowercase").
 * @param val Current field value.
 * @param delimiter Delimiter string used when joining array elements (default: "#").
 * @returns Resulting transformed value.
 */
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
  return val;
}
