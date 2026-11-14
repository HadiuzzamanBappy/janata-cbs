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
  "time",
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
  String: ["text", "textarea", "select", "radio-group", "segmented", "checkbox", "checkbox-group"],
  Number: ["number", "amount", "rate", "select", "radio-group", "segmented"],
  Boolean: ["switch", "checkbox", "radio-group", "segmented"],
  Date: ["date", "datetime", "text"],
  DateTime: ["datetime", "date", "text"],
  Time: ["time", "text"],
  Json: [],
} as const;

export function getDefaultWidgetForType(type: PropertyType | string): FormWidgetType {
  const normalized = (type || "String").trim();
  switch (normalized) {
    case "Number":
      return "number";
    case "Date":
      return "date";
    case "DateTime":
      return "datetime";
    case "Boolean":
      return "checkbox";
    case "Time":
      return "time";
    case "Json":
      return "text";
    default:
      return "text";
  }
}

export function isWidgetCompatibleWithType(
  type: PropertyType | string,
  widget: FormWidgetType | string,
): boolean {
  const normType = (type || "String").trim() as PropertyType;
  const normWidget = (widget || "text").trim().toLowerCase() as FormWidgetType;
  const allowed = COMPATIBLE_WIDGETS_FOR_TYPE[normType];
  return !allowed || allowed.length === 0 || allowed.includes(normWidget);
}

/* ========================================================================== */
/* 3. PARAMETER / LOOKUP CONTRACT (Presentation Layer Input Selectors)        */
/* ========================================================================== */

export const parameterOptionItemSchema = z.object({
  code: z.union([z.string(), z.number()]),
  label: z.string(),
});

export type ParameterOptionItem = z.infer<typeof parameterOptionItemSchema>;

export const formFieldParameterSchema = z.looseObject({
  type: z.enum(["O", "M", "L"]).default("O"),
  data: z.array(parameterOptionItemSchema).default([]),
  modelName: z.string().default("").optional(),
  codeField: z.union([z.string(), z.number()]).default("").optional(),
  displayField: z.string().default("").optional(),
  condition: z.string().default("").optional(),
  reference: z.string().default("").optional(),
});

export type FormFieldParameter = z.infer<typeof formFieldParameterSchema>;

/* ========================================================================== */
/* 3. REACTIVE ACTIONS & VALIDATION RULES                                     */
/* ========================================================================== */

export const formOnChangeRuleSchema = z.looseObject({
  target: z.string().min(1, "Target field key is required"),
  action: z.enum(["join", "copy", "clear", "uppercase", "lowercase", "custom"]).default("copy"),
  delimiter: z.string().default("#").optional(),
});
export type FormOnChangeRule = z.infer<typeof formOnChangeRuleSchema>;

export const fieldTransformSchema = z.enum([
  "uppercase",
  "lowercase",
  "trim",
  "stripWhitespace",
  "none",
]);
export type FieldTransform = z.infer<typeof fieldTransformSchema>;

export const fieldCascadeRuleSchema = z.looseObject({
  when: z.any(),
  set: z.record(z.string(), z.any()),
});
export type FieldCascadeRule = z.infer<typeof fieldCascadeRuleSchema>;

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
  PARAMETER: formFieldParameterSchema.optional(),
  VISIBLE_WHEN: fieldVisibilityConditionSchema.optional(),
  HIDDEN_WHEN: fieldVisibilityConditionSchema.optional(),
  DISABLED_WHEN: fieldVisibilityConditionSchema.optional(),
  WIDGET: formWidgetTypeSchema.optional(),
  TEXT_CONFIG: textWidgetConfigSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
  RATE_CONFIG: rateWidgetConfigSchema.optional(),
  DATE_CONFIG: dateWidgetConfigSchema.optional(),
  BOOLEAN_CONFIG: booleanWidgetConfigSchema.optional(),
  ON_CHANGE: formOnChangeRuleSchema.optional(),
  TRANSFORM: fieldTransformSchema.optional(),
  CASCADE: z.array(fieldCascadeRuleSchema).optional(),
  VALIDATION: fieldValidationRuleSchema.optional(),
});

export type FormElement = z.infer<typeof formElementSchema> & {
  PROP?: FormElement[];
};

export const recursiveFormElementSchema: z.ZodType<FormElement> = formElementSchema.extend({
  PROP: z.lazy(() => z.array(recursiveFormElementSchema)).optional(),
});

/* ========================================================================== */
/* 6. FORM LAYOUT SECTIONS & CONTAINERS (Form Engine Layout Nodes)            */
/* ========================================================================== */

/**
 * Universal Container Type:
 * - 'card': Standard elevated card box with title bar and optional collapse
 * - 'tab': Tab pane clustered inside a TabGroup header
 */
export const formContainerTypeSchema = z.enum(["card", "tab"]);
export type FormContainerType = z.infer<typeof formContainerTypeSchema>;

/**
 * Universal Container Visual & Behavioral Configuration:
 * Allows configuring styling, borders, density, badges, icons, and behavior per container.
 */
export const containerConfigSchema = z.object({
  variant: z.enum(["default", "subtle", "bordered", "elevated", "ghost"]).optional(),
  density: z.enum(["compact", "normal", "spacious"]).optional(),
  badge: z.string().optional(),
  badgeVariant: z.enum(["default", "secondary", "outline", "destructive"]).optional(),
  icon: z.string().optional(),
  bordered: z.boolean().optional(),
  accentColor: z.string().optional(),
  customClass: z.string().optional(),
});
export type ContainerConfig = z.infer<typeof containerConfigSchema>;

export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string().default("").optional(),
  description: z.string().optional(),

  // Container classification
  containerType: formContainerTypeSchema.default("card"),

  // Multi-pane grouping (tabs, steps, accordions)
  groupId: z.string().optional(),
  groupTitle: z.string().optional(),

  // Grid layout inside this section
  columns: z.number().min(1).max(4).default(1).optional(),
  collapsible: z.boolean().default(false).optional(),
  isCollapsed: z.boolean().default(false).optional(),

  // Container visual & behavioral configuration
  containerConfig: containerConfigSchema.optional(),

  // Fields placed in this section (scalar or object fields)
  fields: z.array(formElementSchema).default([]),
});
export type FormSection = z.infer<typeof formSectionSchema>;

export const formElementsContainerSchema = z.object({
  columns: z.number().min(1).max(4).default(1).optional(),
  density: z.enum(["compact", "normal", "spacious"]).default("compact").optional(),
  sections: z.array(formSectionSchema).default([]),
});
export type FormElementsContainer = z.infer<typeof formElementsContainerSchema>;
