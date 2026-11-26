import { z } from "zod";
import { formWidgetShape } from "./form-widget-schema";
import { baseFieldSchema } from "./model-config-schema";

/* ========================================================================== */
/* 1. PARAMETER / LOOKUP CONTRACT (Presentation Layer Input Selectors)        */
/* ========================================================================== */

const parameterOptionItemSchema = z.object({
  code: z.union([z.string(), z.number()]),
  label: z.string(),
});

/** Where a choice field's options come from: fixed list, model lookup, or an array inside a record. */
export const CBS_PARAMETER_TYPE = {
  OPTIONS: "O",
  MODEL: "M",
  ARRAY: "A",
} as const;

/** The model an array lookup (`type: "A"`) reads when it names none. */
export const DEFAULT_ARRAY_LOOKUP_MODEL = "LOOKUP";

const formFieldParameterSchema = z.object({
  type: z.enum(CBS_PARAMETER_TYPE).default(CBS_PARAMETER_TYPE.OPTIONS),
  data: z.array(parameterOptionItemSchema).default([]),
  modelName: z.string().optional(),
  recordId: z.string().optional(),
  arrayField: z.string().optional(),
  codeField: z.string().optional(),
  displayField: z.string().optional(),
  condition: z.string().optional(),
});

export type FormFieldParameter = z.infer<typeof formFieldParameterSchema>;

/** The field's own `PARAMETER`, or the model lookup a `MODELNAME` column implies. */
export function resolveFieldParameter(
  param: FormFieldParameter | undefined,
  modelName: string | undefined,
): FormFieldParameter | undefined {
  const model = modelName?.trim();
  return (
    param ?? (model ? { type: CBS_PARAMETER_TYPE.MODEL, modelName: model, data: [] } : undefined)
  );
}

/** A lookup reads its options from a model (`M`) or from an array inside one record (`A`). */
export const isLookupParameter = (
  param: FormFieldParameter | undefined,
): param is FormFieldParameter =>
  param?.type === CBS_PARAMETER_TYPE.MODEL || param?.type === CBS_PARAMETER_TYPE.ARRAY;

/** Array lookup: the options are the `arrayField` items of record `recordId`. */
export const isArrayLookup = (param: FormFieldParameter | undefined): param is FormFieldParameter =>
  param?.type === CBS_PARAMETER_TYPE.ARRAY;

/** The model a lookup reads, as configured; an array lookup naming none reads the default model. */
export const lookupModelOf = (param: FormFieldParameter | undefined): string =>
  param?.modelName?.trim() || (isArrayLookup(param) ? DEFAULT_ARRAY_LOOKUP_MODEL : "");

/** The fixed options of a field (`O`, or no parameter); none for a lookup. */
export const staticOptionsOf = (
  param: FormFieldParameter | undefined,
): FormFieldParameter["data"] =>
  !param || param.type === CBS_PARAMETER_TYPE.OPTIONS ? (param?.data ?? []) : [];

/** Whether a choice field has something to pick from: a lookup, fixed options, or a `MODELNAME`. */
export const hasFieldOptions = (
  param: FormFieldParameter | undefined,
  modelName: string | undefined,
): boolean =>
  isLookupParameter(param) || staticOptionsOf(param).length > 0 || Boolean(modelName?.trim());

/* ========================================================================== */
/* 2. REACTIVE ACTIONS & VALIDATION RULES                                     */
/* ========================================================================== */

const formOnChangeRuleSchema = z.object({
  target: z.string().min(1, "Target field key is required"),
  action: z.enum(["join", "copy", "clear", "uppercase", "lowercase"]).default("copy"),
  delimiter: z.string().optional(),
});

const fieldTransformSchema = z.enum(["uppercase", "lowercase", "trim", "stripWhitespace", "none"]);
export type FieldTransform = z.infer<typeof fieldTransformSchema>;

const fieldCascadeRuleSchema = z.object({
  when: z.unknown().refine((v) => v !== undefined, "Cascade 'when' condition is required"),
  set: z.record(z.string(), z.unknown()),
});
export type FieldCascadeRule = z.infer<typeof fieldCascadeRuleSchema>;

/** `min` / `max`: the value range for numeric fields, the length range for text fields. */
const fieldValidationRuleSchema = z.object({
  matches: z.string().optional(),
  message: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});
export type FieldValidationRule = z.infer<typeof fieldValidationRuleSchema>;

const fieldConditionOperatorSchema = z.enum([
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

const singleFieldConditionSchema = z
  .object({
    field: z.string().min(1, "Target dependency field is required"),
    operator: fieldConditionOperatorSchema.default("eq"),
    value: z.unknown().optional(),
  })
  .refine((c) => c.operator === "truthy" || c.operator === "falsy" || c.value !== undefined, {
    message: "Condition 'value' is required for this operator",
    path: ["value"],
  });
type SingleFieldCondition = z.infer<typeof singleFieldConditionSchema>;

export type FieldVisibilityCondition =
  | SingleFieldCondition
  | { and: FieldVisibilityCondition[] }
  | { or: FieldVisibilityCondition[] };

const fieldVisibilityConditionSchema: z.ZodType<FieldVisibilityCondition> = z.lazy(() =>
  z.union([
    singleFieldConditionSchema,
    z.object({ and: z.array(fieldVisibilityConditionSchema).min(1) }),
    z.object({ or: z.array(fieldVisibilityConditionSchema).min(1) }),
  ]),
);

/* ========================================================================== */
/* 3. FORM ELEMENT SCHEMA (Form Engine Presentation Element)                  */
/* ========================================================================== */

export const SEMANTIC_WIDTH_TOKENS = ["xs", "sm", "md", "lg", "xl", "xxl", "full"] as const;
const semanticWidthTokenSchema = z.enum(SEMANTIC_WIDTH_TOKENS);
export type SemanticWidthToken = z.infer<typeof semanticWidthTokenSchema>;

/** @internal Exported only for scripts/verify. */
export const propertyWidthSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    if (SEMANTIC_WIDTH_TOKENS.includes(s as SemanticWidthToken)) {
      return s;
    }
  }
  return "md";
}, semanticWidthTokenSchema.default("md"));

// Built from the column shape, not `baseFieldSchema` itself: model reads stay loose, but a
// form field keeps only the keys the designer authors, so unknown keys never reach CONFIG.FORM.
const baseFormElementSchema = z.object({
  ...baseFieldSchema.shape,
  REQUIRED: z
    .union([z.boolean(), z.null()])
    .transform((v) => (v === null ? undefined : v))
    .optional(),
  MODELNAME: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .optional(),
  LABEL: z.string().optional(),
  WIDTH: propertyWidthSchema.optional(),
  DISABLED: z.boolean().optional(),
  ENRICHTEXT: z.string().optional(),
  DEFAULTVALUE: z.string().optional(),
  FIXEDVALUE: z.string().optional(),
  PARAMETER: formFieldParameterSchema.optional(),
  VISIBLE_WHEN: fieldVisibilityConditionSchema.optional(),
  DISABLED_WHEN: fieldVisibilityConditionSchema.optional(),
  ON_CHANGE: formOnChangeRuleSchema.optional(),
  TRANSFORM: fieldTransformSchema.optional(),
  CASCADE: z.array(fieldCascadeRuleSchema).optional(),
  VALIDATION: fieldValidationRuleSchema.optional(),
  ...formWidgetShape,
});

export type FormElement = z.infer<typeof baseFormElementSchema> & {
  PROP?: FormElement[];
};

export const formElementSchema: z.ZodType<FormElement> = baseFormElementSchema.extend({
  PROP: z.lazy(() => z.array(formElementSchema)).optional(),
});

/* ========================================================================== */
/* 4. FORM LAYOUT SECTIONS & CONTAINERS (Form Engine Layout Nodes)            */
/* ========================================================================== */

/**
 * Universal Container Type:
 * - 'card': Standard elevated card box with title bar and optional collapse
 * - 'tab': Tab pane clustered inside a TabGroup header
 */
export const formContainerTypeSchema = z.enum(["card", "tab"]);
export type FormContainerType = z.infer<typeof formContainerTypeSchema>;

/** Spacing presets for a form or one container. */
export const FORM_DENSITIES = ["compact", "normal", "spacious"] as const;
export type FormDensity = (typeof FORM_DENSITIES)[number];
export const DEFAULT_FORM_DENSITY: FormDensity = "compact";

/** Label placement: label beside the input (`horizontal`) or above it (`stacked`). */
export const FORM_LAYOUTS = ["horizontal", "stacked"] as const;
export type FormLayout = (typeof FORM_LAYOUTS)[number];
export const DEFAULT_FORM_LAYOUT: FormLayout = "horizontal";

/**
 * Universal Container Visual & Behavioral Configuration:
 * Allows configuring styling, borders, density, badges, icons, and behavior per container.
 */
export const containerConfigSchema = z.object({
  /**
   * Card style preset ("ghost" = frameless). No schema default so a parsed layout
   * leaves it unset until explicitly configured.
   */
  variant: z.enum(["default", "subtle", "bordered", "elevated", "ghost"]).optional(),
  density: z.enum(FORM_DENSITIES).optional(),

  // Tab Group container styling & height modes (renderers fall back to "card" / "auto")
  tabVariant: z.enum(["card", "workbench", "pills"]).optional(),
  heightMode: z.enum(["auto", "fill", "fixed"]).optional(),
  minHeight: z
    .union([
      z.number().nonnegative(),
      z
        .string()
        .trim()
        .regex(/^\d+(\.\d+)?(px|rem|em|%|vh|vw)?$/, "Invalid CSS length"),
    ])
    .optional(),

  badge: z.string().optional(),
  badgeVariant: z.enum(["default", "secondary", "outline", "destructive"]).optional(),
});
export type ContainerConfig = z.infer<typeof containerConfigSchema>;

const formSectionSchema = z.object({
  id: z.string().min(1, "Section ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),

  // Container classification
  containerType: formContainerTypeSchema.default("card"),

  // Multi-pane grouping (tabs, steps, accordions)
  groupId: z.string().optional(),
  groupTitle: z.string().optional(),

  // Grid layout inside this section
  columns: z.number().int().min(1).max(4).optional(),
  collapsible: z.boolean().optional(),
  isCollapsed: z.boolean().optional(),

  // Container visual & behavioral configuration
  containerConfig: containerConfigSchema.optional(),

  // Fields placed in this section (scalar or object fields)
  fields: z.array(formElementSchema).default([]),
});
export type FormSection = z.infer<typeof formSectionSchema>;

export const formElementsContainerSchema = z.object({
  layout: z.enum(FORM_LAYOUTS).optional(),
  density: z.enum(FORM_DENSITIES).optional(),
  sections: z.array(formSectionSchema).default([]),
});
export type FormElementsContainer = z.infer<typeof formElementsContainerSchema>;
