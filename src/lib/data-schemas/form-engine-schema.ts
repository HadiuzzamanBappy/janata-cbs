import { z } from "zod";

/* ========================================================================== */
/* 1. PHYSICAL DATABASE COLUMN TYPES (Base Model Types)                       */
/* ========================================================================== */

export const propertyTypeSchema = z.enum([
  "Text",
  "Number",
  "Date",
  "Boolean",
  "Object",
  "Dropdown",
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
  "date",
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
  Number: ["number", "amount", "select", "radio-group", "segmented"],
  Date: ["date"],
  Boolean: ["switch", "checkbox", "radio-group", "segmented"],
  Dropdown: ["select", "radio-group", "segmented", "checkbox-group"],
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
    case "Date":
      return "date";
    case "Boolean":
      return "checkbox";
    case "Dropdown":
      return "select";
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

export const formFieldParameterSchema = z.looseObject({
  type: z.string().default("O"),
  data: z.array(z.any()).default([]).optional(),
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
  NAME: z.string().min(1, "Field name is required"),
  LABEL: z.string().min(1, "Field label is required"),
  TYPE: propertyTypeSchema.default("Text"),
  STRUCTURE: z.enum(["S", "M"]).default("S"),
  LENGTH: z.coerce.number().default(50),
  REQUIRED: z.boolean().default(false).optional(),
  WIDTH: z.coerce.number().int().positive().default(280).optional(),
  PARAMETER: formFieldParameterSchema.optional(),
  DATASOURCE: z.array(z.unknown()).optional(),
});

export type PropertyWidth = number;

/* ========================================================================== */
/* 8. FORM ELEMENT SCHEMA (Form Engine Presentation Element)                  */
/* ========================================================================== */

export const formElementSchema = baseFieldSchema.extend({
  // Presentation Controls
  DISABLED: z.boolean().default(false).optional(),
  POSITION: z.string().default("").optional(),
  ENRICHTEXT: z.string().default("").optional(),
  DEFAULTVALUE: z.string().default("").optional(),
  HELPTEXT: z.string().default("").optional(),
  FIXEDVALUE: z.string().default("").optional(),
  VALUE: z
    .union([z.string(), z.array(z.string())])
    .default("")
    .optional(),

  // UI Widget Selection & Widget-Specific Configs
  WIDGET: formWidgetTypeSchema.optional(),
  TEXT_CONFIG: textWidgetConfigSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
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
