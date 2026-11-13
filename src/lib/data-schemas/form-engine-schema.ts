import { z } from "zod";
import { baseFieldSchema, type PropertyType } from "./model-config-schema";

/* ========================================================================== */
/* 1. PRESENTATION UI WIDGET TYPES                                            */
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
/* 2. TYPE-TO-WIDGET COMPATIBILITY CONSTRAINT MATRIX                          */
/* ========================================================================== */

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

export function isWidgetCompatibleWithType(
  type: PropertyType | string,
  widget: FormWidgetType | string,
): boolean {
  const normType = (type || "Text").trim() as PropertyType;
  const normWidget = (widget || "text").trim().toLowerCase() as FormWidgetType;
  const allowed = COMPATIBLE_WIDGETS_FOR_TYPE[normType];
  return !allowed || allowed.length === 0 || allowed.includes(normWidget);
}

/* ========================================================================== */
/* 3. REACTIVE ACTIONS & VALIDATION RULES                                     */
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

export type FieldVisibilityCondition =
  | SingleFieldCondition
  | { and: FieldVisibilityCondition[] }
  | { or: FieldVisibilityCondition[] };

export const fieldVisibilityConditionSchema: z.ZodType<FieldVisibilityCondition> = z.lazy(() =>
  z.union([
    singleFieldConditionSchema,
    z.looseObject({ and: z.array(fieldVisibilityConditionSchema).min(1) }),
    z.looseObject({ or: z.array(fieldVisibilityConditionSchema).min(1) }),
  ]),
);

/* ========================================================================== */
/* 4. WIDGET-SPECIFIC CONFIGURATION SCHEMAS                                   */
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
/* 5. FORM ELEMENT SCHEMA (Form Engine Presentation Element)                  */
/* ========================================================================== */

export const SEMANTIC_WIDTH_TOKENS = ["xs", "sm", "md", "lg", "xl", "xxl", "full"] as const;
export const semanticWidthTokenSchema = z.enum(SEMANTIC_WIDTH_TOKENS);
export type SemanticWidthToken = z.infer<typeof semanticWidthTokenSchema>;

export const propertyWidthSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    if (SEMANTIC_WIDTH_TOKENS.includes(s as SemanticWidthToken)) {
      return s;
    }
  }
  return "md";
}, semanticWidthTokenSchema.default("md"));
export type PropertyWidth = SemanticWidthToken;

export const formElementSchema = baseFieldSchema.extend({
  LABEL: z.string().default("").optional(),
  WIDTH: propertyWidthSchema.default("md").optional(),
  DISABLED: z.boolean().default(false).optional(),
  POSITION: z.string().default("").optional(),
  ENRICHTEXT: z.string().default("").optional(),
  DEFAULTVALUE: z.string().default("").optional(),
  FIXEDVALUE: z.string().default("").optional(),
  VISIBLE_WHEN: fieldVisibilityConditionSchema.optional(),
  DISABLED_WHEN: fieldVisibilityConditionSchema.optional(),
  WIDGET: formWidgetTypeSchema.optional(),
  TEXT_CONFIG: textWidgetConfigSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
  RATE_CONFIG: rateWidgetConfigSchema.optional(),
  DATE_CONFIG: dateWidgetConfigSchema.optional(),
  BOOLEAN_CONFIG: booleanWidgetConfigSchema.optional(),
  ON_CHANGE: formOnChangeRuleSchema.optional(),
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
