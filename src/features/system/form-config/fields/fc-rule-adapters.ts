/**
 * @fileoverview Converts stored field rules to the inspector's editable rows and back.
 * - Conditions (VISIBLE_WHEN / DISABLED_WHEN): one level of rows joined by all (`and`) or any
 *   (`or`). One row is stored as a plain condition. Deeper groups written outside the designer
 *   are kept untouched alongside the rows.
 * - CASCADE: one row per (when value, target field, value).
 *
 * @module features/system/form-config/fields/fc-rule-adapters
 */

import type { FieldCascadeRule, FieldVisibilityCondition } from "@/lib/data-schemas";

type ConditionMatch = "and" | "or";

export interface ConditionRow {
  field?: string;
  operator?: string;
  value?: unknown;
}

export interface ConditionView {
  match: ConditionMatch;
  rows: ConditionRow[];
  /** Nested groups the designer can't edit; written back as they were. */
  nested: FieldVisibilityCondition[];
}

export interface CascadeRow {
  when?: string;
  target?: string;
  value?: unknown;
}

/** A single condition, including a just-added row that has no field picked yet. */
const isRow = (c: FieldVisibilityCondition): c is FieldVisibilityCondition & ConditionRow =>
  !("and" in c) && !("or" in c);

export function conditionToView(condition?: FieldVisibilityCondition): ConditionView {
  if (!condition) return { match: "and", rows: [], nested: [] };
  if (isRow(condition)) return { match: "and", rows: [condition], nested: [] };

  const match: ConditionMatch = "or" in condition ? "or" : "and";
  const group = "or" in condition ? condition.or : "and" in condition ? condition.and : [];
  const items: FieldVisibilityCondition[] = Array.isArray(group) ? group : [];
  return { match, rows: items.filter(isRow), nested: items.filter((c) => !isRow(c)) };
}

export function viewToCondition(view: ConditionView): FieldVisibilityCondition | undefined {
  const items = [...view.rows, ...view.nested] as FieldVisibilityCondition[];
  if (items.length === 0) return undefined;
  if (items.length === 1 && view.nested.length === 0 && view.match === "and") return items[0];
  return view.match === "or" ? { or: items } : { and: items };
}

const whenToText = (when: unknown): string =>
  Array.isArray(when) ? when.map(String).join(",") : String(when ?? "");

export function cascadeToRows(rules?: FieldCascadeRule[]): CascadeRow[] {
  return (rules ?? []).flatMap((rule) => {
    const entries = Object.entries(rule.set ?? {});
    const when = whenToText(rule.when);
    return entries.length > 0
      ? entries.map(([target, value]) => ({ when, target, value }))
      : [{ when }];
  });
}

/** One stored rule per row; the engine applies every rule whose `when` matches. */
export function rowsToCascade(rows: CascadeRow[]): FieldCascadeRule[] | undefined {
  if (rows.length === 0) return undefined;
  return rows.map((row) => {
    const when = String(row.when ?? "").trim();
    const values = when
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return {
      when: values.length > 1 ? values : when,
      set: row.target ? { [row.target]: row.value ?? "" } : {},
    };
  });
}
