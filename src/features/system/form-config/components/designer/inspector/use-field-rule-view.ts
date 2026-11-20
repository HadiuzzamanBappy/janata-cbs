/**
 * @fileoverview Rules-tab binding for the field inspector. Exposes the field's conditions and
 * cascades as editable rows (virtual `*_RULES` / `*_MATCH` keys), turns row edits back into
 * stored rules, and fills every field picker with the fields placed on the form.
 *
 * @module features/system/form-config/components/designer/inspector/use-field-rule-view
 */

"use client";

import * as React from "react";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormElement, FormSection } from "@/lib/data-schemas";
import {
  type CascadeRow,
  type ConditionRow,
  cascadeToRows,
  conditionToView,
  rowsToCascade,
  viewToCondition,
} from "../../../fields/fc-rule-adapters";
import {
  FIELD_CASCADE_SECTION,
  FIELD_DISABLED_SECTION,
  FIELD_ON_CHANGE_SECTION,
  FIELD_PICKER_KEYS,
  FIELD_VALIDATION_RULES_SECTION,
  FIELD_VISIBILITY_SECTION,
  RULE_VIEW_KEYS as K,
} from "../../../fields/fc-rule-fields";

const VIEW_KEYS: ReadonlySet<string> = new Set(Object.values(K));
const RULE_SECTIONS = [
  FIELD_VALIDATION_RULES_SECTION,
  FIELD_VISIBILITY_SECTION,
  FIELD_DISABLED_SECTION,
  FIELD_CASCADE_SECTION,
  FIELD_ON_CHANGE_SECTION,
];

type FieldOption = { code: string; label: string };

function withFieldOptions(field: FormElement, options: FieldOption[]): FormElement {
  return {
    ...field,
    ...(FIELD_PICKER_KEYS.has(field.NAME) ? { PARAMETER: { type: "O", data: options } } : {}),
    ...(field.PROP ? { PROP: field.PROP.map((sub) => withFieldOptions(sub, options)) } : {}),
  };
}

export function useFieldRuleView(field: FormElement, sections: FormSection[]) {
  // Every other field on the form, as picker options
  const fieldOptions = React.useMemo<FieldOption[]>(
    () =>
      sections
        .flatMap((s) => s.fields ?? [])
        .filter((f) => f.NAME && f.NAME !== field.NAME)
        .map((f) => ({ code: f.NAME, label: f.LABEL ? `${f.LABEL} (${f.NAME})` : f.NAME })),
    [sections, field.NAME],
  );

  const ruleSections = React.useMemo(
    () =>
      RULE_SECTIONS.map((section) => ({
        ...section,
        fields: section.fields.map((f) => withFieldOptions(f, fieldOptions)),
      })),
    [fieldOptions],
  );

  const visible = React.useMemo(() => conditionToView(field.VISIBLE_WHEN), [field.VISIBLE_WHEN]);
  const disabled = React.useMemo(() => conditionToView(field.DISABLED_WHEN), [field.DISABLED_WHEN]);

  const ruleValues = React.useMemo<Record<string, unknown>>(
    () => ({
      ...field,
      [K.visibleMatch]: visible.match,
      [K.visibleRules]: visible.rows,
      [K.disabledMatch]: disabled.match,
      [K.disabledRules]: disabled.rows,
      [K.cascadeRules]: cascadeToRows(field.CASCADE),
    }),
    [field, visible, disabled],
  );

  /** The stored-field patch for a Rules-tab edit, or null when the key is a plain field key. */
  const toRulePatch = React.useCallback(
    (key: string, value: unknown): Partial<FormElement> | null => {
      // Clearing the target removes the whole ON_CHANGE rule (it can't exist without one)
      if (key === "ON_CHANGE.target" && !value) return { ON_CHANGE: undefined };

      const root = key.split(".")[0];
      if (!VIEW_KEYS.has(root)) return null;
      const next = setFieldValue(ruleValues, key, value);

      if (root === K.cascadeRules) {
        return { CASCADE: rowsToCascade((next[K.cascadeRules] as CascadeRow[]) ?? []) };
      }
      const isVisible = root === K.visibleMatch || root === K.visibleRules;
      const condition = viewToCondition({
        match: (next[isVisible ? K.visibleMatch : K.disabledMatch] as "and" | "or") ?? "and",
        rows: (next[isVisible ? K.visibleRules : K.disabledRules] as ConditionRow[]) ?? [],
        nested: isVisible ? visible.nested : disabled.nested,
      });
      return isVisible ? { VISIBLE_WHEN: condition } : { DISABLED_WHEN: condition };
    },
    [ruleValues, visible.nested, disabled.nested],
  );

  return { ruleSections, ruleValues, toRulePatch };
}
