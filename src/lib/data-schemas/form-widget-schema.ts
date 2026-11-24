import { z } from "zod";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  type PropertyStructure,
  type PropertyType,
} from "./model-config-schema";

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
  const normalized = (type || CBS_PROPERTY_TYPE.STRING).trim();
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
  structure?: PropertyStructure;
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
  structure = CBS_PROPERTY_STRUCTURE.SINGLE,
  length,
  modelName,
}: WidgetEligibilityContext): FormWidgetType[] {
  const normType = (type || CBS_PROPERTY_TYPE.STRING).trim() as PropertyType;
  const baseAllowed = COMPATIBLE_WIDGETS_FOR_TYPE[normType] || [];

  // Foreign key model reference: locked exclusively to select
  if (modelName?.trim()) {
    return ["select"];
  }

  return baseAllowed.filter((w) => {
    if (w === "checkbox-group") return structure === CBS_PROPERTY_STRUCTURE.MULTI;
    if (w === "checkbox" || w === "switch" || w === "radio-group" || w === "segmented") {
      return structure === CBS_PROPERTY_STRUCTURE.SINGLE;
    }
    if (w === "textarea") {
      return length === undefined || length >= 80;
    }

    return true;
  });
}

export function isWidgetCompatibleWithType(
  type: PropertyType | string,
  widget: FormWidgetType | string,
  structure: PropertyStructure = CBS_PROPERTY_STRUCTURE.SINGLE,
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

// Every setting here is honoured by the form engine. Value ranges live in VALIDATION.min / max and
// text shaping in TRANSFORM, so nothing is configured in two places.

/** `number` and `amount`: decimal places allowed (validated) and the amount's currency badge. */
const numberWidgetConfigSchema = z.object({
  currencyCode: z.string().optional(),
  decimals: z.number().int().min(0).max(8).optional(),
});

/** `rate`: decimal places allowed (validated) and the suffix badge (default `%`). */
const rateWidgetConfigSchema = z.object({
  decimals: z.number().int().min(0).max(8).optional(),
  suffix: z.string().optional(),
});

/**
 * A day offset. Layouts saved before offsets were numbers stored them as strings ("" or "-30"),
 * so a stored string is read as its number and "" as unset.
 */
const dayOffsetSchema = z.preprocess(
  (v) => (v === "" || v === null ? undefined : typeof v === "string" ? Number(v) : v),
  z.number().int().optional(),
);

/** `date` / `datetime`: allowed range in whole days from today (negative = past). */
const dateWidgetConfigSchema = z.object({
  minDateOffset: dayOffsetSchema,
  maxDateOffset: dayOffsetSchema,
});

/**
 * `switch` / `checkbox`: badge labels, and the values written for on / off. Wire values are for
 * String columns (e.g. `Y` / `N`); unset, the field stores `true` / `false`.
 */
const booleanWidgetConfigSchema = z.object({
  activeLabel: z.string().optional(),
  inactiveLabel: z.string().optional(),
  trueValue: z.string().optional(),
  falseValue: z.string().optional(),
});
export type BooleanWidgetConfig = z.infer<typeof booleanWidgetConfigSchema>;

/* ========================================================================== */
/* 4. FORM ELEMENT WIDGET FIELDS (spread into formElementSchema)              */
/* ========================================================================== */

/** Widget selection and per-widget configuration fields of a form element. */
export const formWidgetShape = {
  WIDGET: formWidgetTypeSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
  RATE_CONFIG: rateWidgetConfigSchema.optional(),
  DATE_CONFIG: dateWidgetConfigSchema.optional(),
  BOOLEAN_CONFIG: booleanWidgetConfigSchema.optional(),
};
