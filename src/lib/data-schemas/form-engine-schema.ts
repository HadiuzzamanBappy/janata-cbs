import { z } from "zod";

/* ========================================================================== */
/* 1. PHYSICAL DATABASE COLUMN TYPES (Base Model Types)                       */
/* ========================================================================== */

export const propertyTypeSchema = z.enum([
  "Text",
  "Number",
  "Amount",
  "Rate",
  "Date",
  "DateTime",
  "Boolean",
  "Object",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const PROPERTY_TYPES = propertyTypeSchema.options;

/* ========================================================================== */
/* 2. PRESENTATION UI WIDGET TYPES                                            */
/* ========================================================================== */

export const formWidgetTypeSchema = z.enum([
  "text",
  "textarea",
  "number",
  "amount",
  "rate",
  "date",
  "datetime",
  "select",
  "radio-group",
  "switch",
  "checkbox",
  "checkbox-group",
  "segmented",
]);
export type FormWidgetType = z.infer<typeof formWidgetTypeSchema>;
export const FORM_WIDGET_TYPES = formWidgetTypeSchema.options;

/* ========================================================================== */
/* 3. TYPE-TO-WIDGET COMPATIBILITY CONSTRAINT MATRIX                          */
/* ========================================================================== */

/**
 * Authoritative constraint matrix: Dictates which UI widgets can be chosen
 * in Form Config given a physical PropertyType defined in Model Config.
 */
export const COMPATIBLE_WIDGETS_FOR_TYPE: Record<PropertyType, readonly FormWidgetType[]> = {
  Text: ["text", "textarea", "select", "radio-group", "segmented", "checkbox", "checkbox-group"],
  Number: ["number", "amount", "rate", "select", "radio-group", "segmented"],
  Amount: ["amount", "number", "text"],
  Rate: ["rate", "number", "text"],
  Date: ["date", "datetime", "text"],
  DateTime: ["datetime", "date", "text"],
  Boolean: ["switch", "checkbox", "radio-group", "segmented"],
  Object: [],
} as const;

/**
 * Returns the default fallback UI widget for a given physical PropertyType.
 */
export function getDefaultWidgetForType(type: PropertyType | string): FormWidgetType {
  const normalized = (type || "Text").trim();
  switch (normalized) {
    case "Number":
      return "number";
    case "Amount":
      return "amount";
    case "Rate":
      return "rate";
    case "Date":
      return "date";
    case "DateTime":
      return "datetime";
    case "Boolean":
      return "checkbox";
    default:
      return "text";
  }
}

/**
 * Validates whether an explicit UI widget override is logically compatible
 * with the underlying physical database property type.
 */
export function isWidgetCompatibleWithType(
  type: PropertyType | string,
  widget: FormWidgetType | string,
): boolean {
  const normType = (type || "Text").trim() as PropertyType;
  const normWidget = (widget || "text").trim().toLowerCase() as FormWidgetType;

  const allowed = COMPATIBLE_WIDGETS_FOR_TYPE[normType];
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(normWidget);
}

/* ========================================================================== */
/* 4. PARAMETER / LOOKUP CONTRACT                                             */
/* ========================================================================== */

/**
 * Standard fixed option item contract for dropdowns and radios (type: "O").
 * The canonical CBS format is { itemCode, itemLabel }.
 * Also supports { code, label } for code-defined form presets.
 */
export const parameterOptionItemSchema = z.union([
  z.object({
    itemCode: z.string().min(1, "itemCode is required"),
    itemLabel: z.string().min(1, "itemLabel is required"),
  }),
  z.object({
    code: z.string().min(1, "code is required"),
    label: z.string().min(1, "label is required"),
  }),
]);
export type ParameterOptionItem =
  | { itemCode: string; itemLabel: string; code?: string; label?: string }
  | { code: string; label: string; itemCode?: string; itemLabel?: string };

export const formFieldParameterSchema = z.looseObject({
  type: z.string().default("O"),
  data: z.array(parameterOptionItemSchema).default([]).optional(),
  modelName: z.string().default("").optional(),
  codeField: z.string().default("").optional(),
  displayField: z.string().default("").optional(),
  condition: z.string().default("").optional(),
  reference: z.string().default("").optional(),
});
export type FormFieldParameter = z.infer<typeof formFieldParameterSchema>;

/* ========================================================================== */
/* 5. REACTIVE ACTIONS & VALIDATION RULES                                     */
/* ========================================================================== */

export const formOnChangeRuleSchema = z.looseObject({
  target: z.string().min(1, "Target field key is required"),
  action: z.enum(["join", "copy", "clear", "uppercase", "lowercase", "custom"]).default("copy"),
  delimiter: z.string().default("#").optional(),
});
export type FormOnChangeRule = z.infer<typeof formOnChangeRuleSchema>;

export const fieldValidationRuleSchema = z.looseObject({
  matches: z.string().optional(),
  message: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
});
export type FieldValidationRule = z.infer<typeof fieldValidationRuleSchema>;

export const fieldConditionOperatorSchema = z.enum([
  "eq",
  "neq",
  "in",
  "notIn",
  "gt",
  "lt",
  "gte",
  "lte",
  "truthy",
  "falsy",
]);
export type FieldConditionOperator = z.infer<typeof fieldConditionOperatorSchema>;

export const singleFieldConditionSchema = z.looseObject({
  field: z.string().min(1, "Target dependency field is required"),
  operator: fieldConditionOperatorSchema.default("eq"),
  value: z.any().optional(),
});
export type SingleFieldCondition = z.infer<typeof singleFieldConditionSchema>;

/**
 * Composite Visibility / Disabled Condition Tree.
 * Supports:
 *  1. Single field evaluation: { field: "accountType", operator: "eq", value: "SAVINGS" }
 *  2. Composite AND evaluation: { and: [...] }
 *  3. Composite OR evaluation:  { or: [...] }
 */
export type FieldVisibilityCondition =
  | SingleFieldCondition
  | { and: FieldVisibilityCondition[] }
  | { or: FieldVisibilityCondition[] };

export const fieldVisibilityConditionSchema: z.ZodType<FieldVisibilityCondition> = z.lazy(() =>
  z.union([
    singleFieldConditionSchema,
    z.looseObject({
      and: z.array(fieldVisibilityConditionSchema).min(1),
    }),
    z.looseObject({
      or: z.array(fieldVisibilityConditionSchema).min(1),
    }),
  ]),
);

/* ========================================================================== */
/* 6. WIDGET-SPECIFIC CONFIGURATION SCHEMAS                                   */
/* ========================================================================== */

export const textWidgetConfigSchema = z.object({
  textTransform: z.enum(["uppercase", "lowercase", "none"]).default("uppercase"),
  maskPattern: z.string().default(""),
  autoTrim: z.boolean().default(true),
});
export type TextWidgetConfig = z.infer<typeof textWidgetConfigSchema>;

export const numberWidgetConfigSchema = z.object({
  isCurrency: z.boolean().default(false),
  currencyCode: z.string().default(""),
  decimals: z.number().default(2),
  allowNegative: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
});
export type NumberWidgetConfig = z.infer<typeof numberWidgetConfigSchema>;

export const rateWidgetConfigSchema = z.object({
  decimals: z.number().default(4),
  allowNegative: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  suffix: z.string().default("%"),
});
export type RateWidgetConfig = z.infer<typeof rateWidgetConfigSchema>;

export const dateWidgetConfigSchema = z.object({
  datePattern: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "DD-MMM-YYYY"]).default("YYYY-MM-DD"),
  minDateOffset: z.string().default(""),
  maxDateOffset: z.string().default(""),
  disableHolidays: z.boolean().default(false),
});
export type DateWidgetConfig = z.infer<typeof dateWidgetConfigSchema>;

export const booleanWidgetConfigSchema = z.object({
  widgetStyle: z.enum(["switch", "checkbox"]).default("switch"),
  trueValue: z.string().default("Y"),
  falseValue: z.string().default("N"),
  activeLabel: z.string().default("Enabled"),
  inactiveLabel: z.string().default("Disabled"),
});
export type BooleanWidgetConfig = z.infer<typeof booleanWidgetConfigSchema>;

/* ========================================================================== */
/* 7. BASE PHYSICAL FIELD SCHEMA (MODEL.CONFIG Column Definition)             */
/* ========================================================================== */

export const baseFieldSchema = z.looseObject({
  SN: z.coerce.string().default(""),
  NAME: z
    .string()
    .trim()
    .min(1, "Field name is required")
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      "Field name must begin with a letter or underscore and contain only alphanumeric characters or underscores",
    ),
  LABEL: z.string().trim().min(1, "Field label is required"),
  TYPE: propertyTypeSchema.default("Text"),
  STRUCTURE: z.enum(["S", "M"]).default("S"),
  LENGTH: z.coerce.number().default(50),
  REQUIRED: z.boolean().default(false).optional(),
  PARAMETER: formFieldParameterSchema.optional(),
});

export const semanticWidthTokenSchema = z.enum(["xs", "sm", "md", "lg", "xl", "xxl", "full"]);
export type SemanticWidthToken = z.infer<typeof semanticWidthTokenSchema>;

/**
 * Modern semantic width schema.
 * Pure semantic tokens ("xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "full").
 * If any numeric width arrives (from legacy models or DB numbers),
 * it is safely normalized/ignored to default "md".
 */
export const propertyWidthSchema = z.union([semanticWidthTokenSchema, z.number()]);
export type PropertyWidth = z.infer<typeof propertyWidthSchema>;

/* ========================================================================== */
/* 8. FORM ELEMENT SCHEMA (Form Engine Presentation Element)                  */
/* ========================================================================== */

export const formElementSchema = baseFieldSchema.extend({
  // Presentation Controls
  WIDTH: propertyWidthSchema.default("md").optional(),
  DISABLED: z.boolean().default(false).optional(),
  POSITION: z.string().default("").optional(),
  ENRICHTEXT: z.string().default("").optional(),
  DEFAULTVALUE: z.string().default("").optional(),
  FIXEDVALUE: z.string().default("").optional(),

  // Declarative UI Conditions (Dynamic form engine capabilities)
  VISIBLE_WHEN: fieldVisibilityConditionSchema.optional(),
  DISABLED_WHEN: fieldVisibilityConditionSchema.optional(),

  // UI Widget Selection & Widget-Specific Configs
  WIDGET: formWidgetTypeSchema.optional(),
  TEXT_CONFIG: textWidgetConfigSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
  RATE_CONFIG: rateWidgetConfigSchema.optional(),
  DATE_CONFIG: dateWidgetConfigSchema.optional(),
  BOOLEAN_CONFIG: booleanWidgetConfigSchema.optional(),

  // Reactive Field Synchronization & Rules
  ON_CHANGE: formOnChangeRuleSchema.optional(),

  // Cross-Field Validation Rules
  VALIDATION: fieldValidationRuleSchema.optional(),
});

export type FormElement = z.infer<typeof formElementSchema> & {
  PROP?: FormElement[];
  children?: FormElement[];
};

export const recursiveFormElementSchema: z.ZodType<FormElement> = formElementSchema.extend({
  PROP: z.lazy(() => z.array(recursiveFormElementSchema)).optional(),
  children: z.lazy(() => z.array(recursiveFormElementSchema)).optional(),
});
