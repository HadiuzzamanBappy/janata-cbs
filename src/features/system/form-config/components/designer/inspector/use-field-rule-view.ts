/**
 * @fileoverview Rules-tab binding for the field inspector. Exposes the field's conditions and
 * cascades as editable rows (virtual `*_RULES` / `*_MATCH` keys), turns row edits back into
 * stored rules, provides on-demand rule activation/deletion, and fills every field picker with
 * the fields placed on the form.
 *
 * @module features/system/form-config/components/designer/inspector/use-field-rule-view
 */

"use client";

import * as React from "react";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { CBS_PARAMETER_TYPE, type FormElement, type FormSection } from "@/lib/data-schemas";
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

export type RuleKind = "validation" | "visibility" | "disabled" | "cascade" | "on_change";

export interface RuleDefinitionMeta {
  kind: RuleKind;
  id: string;
  title: string;
  description: string;
  section: FormSection;
}

export const RULE_DEFINITIONS: Record<RuleKind, Omit<RuleDefinitionMeta, "kind">> = {
  validation: {
    id: "sec_field_validation_rules",
    title: "Validation & Transform",
    description: "Pattern regex, character length bounds, and text casing.",
    section: FIELD_VALIDATION_RULES_SECTION,
  },
  visibility: {
    id: "sec_field_visibility",
    title: "Visible When",
    description: "Conditionally show or hide this field based on other field values.",
    section: FIELD_VISIBILITY_SECTION,
  },
  disabled: {
    id: "sec_field_disabled",
    title: "Disabled When",
    description: "Conditionally lock this field as read-only based on other values.",
    section: FIELD_DISABLED_SECTION,
  },
  cascade: {
    id: "sec_field_cascade",
    title: "Cascade (Set Other Fields)",
    description: "Automatically set other field values when this field matches a value.",
    section: FIELD_CASCADE_SECTION,
  },
  on_change: {
    id: "sec_field_on_change",
    title: "On Change (Update Another Field)",
    description: "Sync, copy, or join values to another field whenever this field changes.",
    section: FIELD_ON_CHANGE_SECTION,
  },
};

const VIEW_KEYS: ReadonlySet<string> = new Set(Object.values(K));

type FieldOption = { code: string; label: string };

function withFieldOptions(field: FormElement, options: FieldOption[]): FormElement {
  return {
    ...field,
    ...(FIELD_PICKER_KEYS.has(field.NAME)
      ? { PARAMETER: { type: CBS_PARAMETER_TYPE.OPTIONS, data: options } }
      : {}),
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

  const visible = React.useMemo(() => conditionToView(field.VISIBLE_WHEN), [field.VISIBLE_WHEN]);
  const disabled = React.useMemo(() => conditionToView(field.DISABLED_WHEN), [field.DISABLED_WHEN]);

  // Determine active rule kinds currently configured on the field
  const activeRules = React.useMemo<Set<RuleKind>>(() => {
    const active = new Set<RuleKind>();

    if (field.TRANSFORM !== undefined || field.VALIDATION !== undefined) {
      active.add("validation");
    }

    if (visible.rows.length > 0 || field.VISIBLE_WHEN) {
      active.add("visibility");
    }

    if (disabled.rows.length > 0 || field.DISABLED_WHEN) {
      active.add("disabled");
    }

    if (Array.isArray(field.CASCADE) && field.CASCADE.length > 0) {
      active.add("cascade");
    }

    if (field.ON_CHANGE?.target) {
      active.add("on_change");
    }

    return active;
  }, [field.TRANSFORM, field.VALIDATION, field.CASCADE, field.ON_CHANGE, visible, disabled]);

  // Available rules that can be added
  const availableRules = React.useMemo<RuleDefinitionMeta[]>(() => {
    return (Object.keys(RULE_DEFINITIONS) as RuleKind[])
      .filter((kind) => !activeRules.has(kind))
      .map((kind) => ({
        kind,
        ...RULE_DEFINITIONS[kind],
      }));
  }, [activeRules]);

  // Build sections only for active rules (or explicitly enabled)
  const activeRuleSections = React.useMemo(() => {
    return (Object.keys(RULE_DEFINITIONS) as RuleKind[])
      .filter((kind) => activeRules.has(kind))
      .map((kind) => {
        const meta = RULE_DEFINITIONS[kind];
        return {
          kind,
          section: {
            ...meta.section,
            // Ensure section card opens expanded when explicitly active
            isCollapsed: false,
            fields: meta.section.fields.map((f) => withFieldOptions(f, fieldOptions)),
          },
        };
      });
  }, [activeRules, fieldOptions]);

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

  /** Stored-field patch for a Rules-tab edit, or null when the key is a plain field key. */
  const toRulePatch = React.useCallback(
    (key: string, value: unknown): Partial<FormElement> | null => {
      // Clearing the target removes the whole ON_CHANGE rule
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

  /** Returns patch to add a new rule with clean initial state */
  const getAddRulePatch = React.useCallback(
    (kind: RuleKind): Partial<FormElement> => {
      switch (kind) {
        case "validation":
          return {
            TRANSFORM: "none",
            VALIDATION: {},
          };
        case "visibility":
          return {
            VISIBLE_WHEN: {
              field: fieldOptions[0]?.code || "",
              operator: "eq",
              value: "",
            },
          };
        case "disabled":
          return {
            DISABLED_WHEN: {
              field: fieldOptions[0]?.code || "",
              operator: "eq",
              value: "",
            },
          };
        case "cascade":
          return {
            CASCADE: [
              {
                when: "",
                set: { [fieldOptions[0]?.code || ""]: "" },
              },
            ],
          };
        case "on_change":
          return {
            ON_CHANGE: {
              target: fieldOptions[0]?.code || "",
              action: "copy",
            },
          };
      }
    },
    [fieldOptions],
  );

  /** Returns patch to delete a rule completely from the field */
  const getRemoveRulePatch = React.useCallback((kind: RuleKind): Partial<FormElement> => {
    switch (kind) {
      case "validation":
        return {
          TRANSFORM: undefined,
          VALIDATION: undefined,
        };
      case "visibility":
        return {
          VISIBLE_WHEN: undefined,
        };
      case "disabled":
        return {
          DISABLED_WHEN: undefined,
        };
      case "cascade":
        return {
          CASCADE: undefined,
        };
      case "on_change":
        return {
          ON_CHANGE: undefined,
        };
    }
  }, []);

  return {
    activeRules,
    availableRules,
    activeRuleSections,
    ruleValues,
    toRulePatch,
    getAddRulePatch,
    getRemoveRulePatch,
  };
}
