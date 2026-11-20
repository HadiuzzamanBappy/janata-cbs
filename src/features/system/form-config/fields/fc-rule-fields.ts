/**
 * @fileoverview Rules-tab specs for FORM.CONFIG: validation and transform, conditional
 * visibility and disabled state, cascades and ON_CHANGE automation. Each section maps 1:1 to
 * a rule the form engine applies (`@/lib/cbs-form-spec`: validation, field-rules).
 *
 * Conditions and cascades are edited as rows under virtual keys (`*_RULES`, `*_MATCH`);
 * `fc-rule-adapters.ts` converts them to and from the stored shape. Field pickers (keys in
 * `FIELD_PICKER_KEYS`) get the form's fields as options from the inspector.
 *
 * @module features/system/form-config/fields/fc-rule-fields
 */

import type { FormElement, FormSection } from "@/lib/data-schemas";

/** Virtual inspector keys; never stored on the field. */
export const RULE_VIEW_KEYS = {
  visibleMatch: "VISIBLE_WHEN_MATCH",
  visibleRules: "VISIBLE_WHEN_RULES",
  disabledMatch: "DISABLED_WHEN_MATCH",
  disabledRules: "DISABLED_WHEN_RULES",
  cascadeRules: "CASCADE_RULES",
} as const;

/** Inputs that pick another field on the form (filled with options by the inspector). */
export const FIELD_PICKER_KEYS: ReadonlySet<string> = new Set([
  "field",
  "target",
  "ON_CHANGE.target",
]);

const OPERATOR_OPTIONS = [
  { code: "eq", label: "equals" },
  { code: "neq", label: "not equals" },
  { code: "in", label: "is one of (a,b,c)" },
  { code: "notIn", label: "is not one of (a,b,c)" },
  { code: "gt", label: ">" },
  { code: "gte", label: ">=" },
  { code: "lt", label: "<" },
  { code: "lte", label: "<=" },
  { code: "truthy", label: "has a value" },
  { code: "falsy", label: "is empty" },
];

function stringInput(
  sn: string,
  name: string,
  label: string,
  enrich: string,
  extra: Partial<FormElement> = {},
): FormElement {
  return {
    SN: sn,
    NAME: name,
    LABEL: label,
    TYPE: "String",
    STRUCTURE: "S",
    LENGTH: 80,
    WIDTH: "full",
    ENRICHTEXT: enrich,
    ...extra,
  };
}

function rulesCard(id: string, title: string, fields: FormElement[]): FormSection {
  return {
    id,
    title,
    containerType: "card",
    containerConfig: { variant: "subtle", showHeader: true, bordered: true },
    collapsible: true,
    isCollapsed: true,
    columns: 1,
    fields,
  };
}

const fieldPicker = (sn: string, name: string, label: string, enrich: string): FormElement =>
  stringInput(sn, name, label, enrich, { WIDGET: "select", LENGTH: 50 });

/** Match mode plus condition rows, for VISIBLE_WHEN or DISABLED_WHEN. */
function conditionFields(matchKey: string, rulesKey: string, effect: string): FormElement[] {
  return [
    stringInput("1", matchKey, "Match", `"All" needs every row true; "Any" needs one.`, {
      WIDGET: "segmented",
      LENGTH: 3,
      PARAMETER: {
        type: "O",
        data: [
          { code: "and", label: "All" },
          { code: "or", label: "Any" },
        ],
      },
    }),
    {
      SN: "2",
      NAME: rulesKey,
      LABEL: "Conditions",
      TYPE: "Array",
      STRUCTURE: "M",
      LENGTH: 0,
      WIDTH: "full",
      ENRICHTEXT: `${effect} No rows = always.`,
      PROP: [
        fieldPicker("2_1", "field", "Field", "Field on this form to test."),
        stringInput("2_2", "operator", "Operator", "Comparison.", {
          WIDGET: "select",
          LENGTH: 10,
          PARAMETER: { type: "O", data: OPERATOR_OPTIONS },
        }),
        stringInput("2_3", "value", "Value", "Value to compare (comma-separated for lists).", {
          LENGTH: 100,
        }),
      ],
    },
  ];
}

export const FIELD_VALIDATION_RULES_SECTION = rulesCard(
  "sec_field_validation_rules",
  "Validation & Transform",
  [
    stringInput(
      "1",
      "TRANSFORM",
      "Input Transform",
      "Applied as the operator types; Trim on leaving the field.",
      {
        WIDGET: "segmented",
        LENGTH: 20,
        PARAMETER: {
          type: "O",
          data: [
            { code: "none", label: "None" },
            { code: "uppercase", label: "UPPER" },
            { code: "lowercase", label: "lower" },
            { code: "trim", label: "Trim" },
            { code: "stripWhitespace", label: "No Spaces" },
          ],
        },
      },
    ),
    stringInput("2", "VALIDATION.matches", "Pattern (Regex)", "e.g. ^[A-Z]{3}$ or ^\\d{10}$."),
    ...(["min", "max"] as const).map(
      (bound, idx): FormElement => ({
        SN: String(3 + idx),
        NAME: `VALIDATION.${bound}`,
        LABEL: bound === "min" ? "Minimum Length" : "Maximum Length",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 5,
        WIDTH: "sm",
        ENRICHTEXT: "Characters (text fields). Number ranges are set in the widget settings.",
        VISIBLE_WHEN: { field: "TYPE", operator: "eq", value: "String" },
      }),
    ),
    stringInput(
      "5",
      "VALIDATION.message",
      "Error Message",
      "Shown instead of the default message when the pattern or a limit fails.",
    ),
  ],
);

export const FIELD_VISIBILITY_SECTION = rulesCard(
  "sec_field_visibility",
  "Visible When",
  conditionFields(
    RULE_VIEW_KEYS.visibleMatch,
    RULE_VIEW_KEYS.visibleRules,
    "The field shows only while these hold; a hidden field is not validated.",
  ),
);

export const FIELD_DISABLED_SECTION = rulesCard(
  "sec_field_disabled",
  "Disabled When",
  conditionFields(
    RULE_VIEW_KEYS.disabledMatch,
    RULE_VIEW_KEYS.disabledRules,
    "The field is read-only while these hold.",
  ),
);

export const FIELD_CASCADE_SECTION = rulesCard("sec_field_cascade", "Cascade (Set Other Fields)", [
  {
    SN: "1",
    NAME: RULE_VIEW_KEYS.cascadeRules,
    LABEL: "Cascade Rows",
    TYPE: "Array",
    STRUCTURE: "M",
    LENGTH: 0,
    WIDTH: "full",
    ENRICHTEXT: "When this field takes a value, set another field. Every matching row applies.",
    PROP: [
      stringInput("1_1", "when", "When Value Is", "Comma-separated for several values.", {
        LENGTH: 100,
      }),
      fieldPicker("1_2", "target", "Set Field", "Field on this form to set."),
      stringInput("1_3", "value", "To Value", "Value written to that field.", { LENGTH: 100 }),
    ],
  },
]);

export const FIELD_ON_CHANGE_SECTION = rulesCard(
  "sec_field_on_change",
  "On Change (Update Another Field)",
  [
    fieldPicker(
      "1",
      "ON_CHANGE.target",
      "Target Field",
      "Field updated whenever this one changes.",
    ),
    stringInput(
      "2",
      "ON_CHANGE.action",
      "Action",
      "Copy (default), Clear, Join a list, or copy in UPPER / lower case.",
      {
        WIDGET: "segmented",
        LENGTH: 10,
        PARAMETER: {
          type: "O",
          data: [
            { code: "copy", label: "Copy" },
            { code: "clear", label: "Clear" },
            { code: "join", label: "Join" },
            { code: "uppercase", label: "UPPER" },
            { code: "lowercase", label: "lower" },
          ],
        },
      },
    ),
    stringInput("3", "ON_CHANGE.delimiter", "Join Delimiter", "Separator for Join (default #).", {
      LENGTH: 5,
      WIDTH: "xs",
      VISIBLE_WHEN: { field: "ON_CHANGE.action", operator: "eq", value: "join" },
    }),
  ],
);
