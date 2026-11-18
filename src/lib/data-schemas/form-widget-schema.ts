import { z } from "zod";
import { CBS_PROPERTY_TYPE, type PropertyType } from "./model-config-schema";

/* ========================================================================== */
/* 1. PRESENTATION UI WIDGET TYPES                                            */
/* ========================================================================== */

const formWidgetTypeSchema = z.enum([
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
  Array: [],
} as const;

export function getDefaultWidgetForType(type: PropertyType | string): FormWidgetType {
  const normalized = (type || "String").trim();
  switch (normalized) {
    case CBS_PROPERTY_TYPE.NUMBER:
      return "number";
    case CBS_PROPERTY_TYPE.DATE:
      return "date";
    case CBS_PROPERTY_TYPE.DATETIME:
      return "datetime";
    case CBS_PROPERTY_TYPE.BOOLEAN:
      return "checkbox";
    case CBS_PROPERTY_TYPE.TIME:
      return "time";
    case CBS_PROPERTY_TYPE.ARRAY:
      return "text";
    default:
      return "text";
  }
}

export interface WidgetEligibilityContext {
  type: PropertyType | string;
  structure?: "S" | "M";
  length?: number;
  modelName?: string;
}

/**
 * Resolves compatible presentation widgets based on physical TYPE, STRUCTURE, LENGTH, and MODELNAME.
 *
 * Rules:
 * 1. Model foreign key: strictly locked to 'select'.
 * 2. checkbox-group: strictly requires Multi-Value ('M').
 * 3. Single toggles (checkbox, switch, radio-group, segmented): strictly require Single ('S').
 * 4. textarea: requires long text storage capacity (LENGTH >= 80).
 */
export function getCompatibleWidgets({
  type,
  structure = "S",
  length,
  modelName,
}: WidgetEligibilityContext): FormWidgetType[] {
  const normType = (type || "String").trim() as PropertyType;
  const baseAllowed = COMPATIBLE_WIDGETS_FOR_TYPE[normType] || [];

  // Foreign key model reference: locked exclusively to select
  if (modelName?.trim()) {
    return ["select"];
  }

  return baseAllowed.filter((w) => {
    // 1. checkbox-group strictly requires Multi-Value ('M')
    if (w === "checkbox-group") return structure === "M";

    // 2. Single-choice toggles strictly require Single ('S')
    if (w === "checkbox" || w === "switch" || w === "radio-group" || w === "segmented") {
      return structure === "S";
    }

    // 3. Textarea requires long text capacity (LENGTH >= 80)
    if (w === "textarea") {
      return length === undefined || length >= 80;
    }

    return true;
  });
}

export function isWidgetCompatibleWithType(
  type: PropertyType | string,
  widget: FormWidgetType | string,
  structure: "S" | "M" = "S",
  options?: { length?: number; modelName?: string },
): boolean {
  const normWidget = (widget || "text").trim().toLowerCase() as FormWidgetType;
  const allowed = getCompatibleWidgets({
    type,
    structure,
    length: options?.length,
    modelName: options?.modelName,
  });
  return allowed.includes(normWidget);
}

/* ========================================================================== */
/* 3. WIDGET-SPECIFIC CONFIGURATION SCHEMAS                                   */
/* ========================================================================== */

const textWidgetConfigSchema = z.object({
  textTransform: z.enum(["uppercase", "lowercase", "none"]).default("uppercase"),
  maskPattern: z.string().default(""),
  autoTrim: z.boolean().default(true),
});
export type TextWidgetConfig = z.infer<typeof textWidgetConfigSchema>;

const numberWidgetConfigSchema = z.object({
  isCurrency: z.boolean().default(false),
  currencyCode: z.string().default(""),
  decimals: z.number().default(2),
  allowNegative: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
});

const rateWidgetConfigSchema = z.object({
  decimals: z.number().default(4),
  allowNegative: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  suffix: z.string().default("%"),
});

const dateWidgetConfigSchema = z.object({
  datePattern: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "DD-MMM-YYYY"]).default("YYYY-MM-DD"),
  minDateOffset: z.string().default(""),
  maxDateOffset: z.string().default(""),
  disableHolidays: z.boolean().default(false),
});

const booleanWidgetConfigSchema = z.object({
  widgetStyle: z.enum(["switch", "checkbox"]).default("switch"),
  trueValue: z.string().default("Y"),
  falseValue: z.string().default("N"),
  activeLabel: z.string().default("Enabled"),
  inactiveLabel: z.string().default("Disabled"),
});

/* ========================================================================== */
/* 4. FORM ELEMENT WIDGET FIELDS (spread into formElementSchema)              */
/* ========================================================================== */

/** Widget selection and per-widget configuration fields of a form element. */
export const formWidgetShape = {
  WIDGET: formWidgetTypeSchema.optional(),
  TEXT_CONFIG: textWidgetConfigSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
  RATE_CONFIG: rateWidgetConfigSchema.optional(),
  DATE_CONFIG: dateWidgetConfigSchema.optional(),
  BOOLEAN_CONFIG: booleanWidgetConfigSchema.optional(),
};
