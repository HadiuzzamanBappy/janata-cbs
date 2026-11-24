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

const formFieldParameterSchema = z.looseObject({
  type: z.enum(["O", "M", "A"]).default("O"),
  data: z.array(parameterOptionItemSchema).default([]),
  modelName: z.string().default("").optional(),
  recordId: z.string().default("").optional(),
  arrayField: z.string().default("").optional(),
  codeField: z.union([z.string(), z.number()]).default("").optional(),
  displayField: z.string().default("").optional(),
  condition: z.string().default("").optional(),
});

export type FormFieldParameter = z.infer<typeof formFieldParameterSchema>;

/* ========================================================================== */
/* 2. REACTIVE ACTIONS & VALIDATION RULES                                     */
/* ========================================================================== */

const formOnChangeRuleSchema = z.looseObject({
  target: z.string().min(1, "Target field key is required"),
  action: z.enum(["join", "copy", "clear", "uppercase", "lowercase"]).default("copy"),
  delimiter: z.string().default("#").optional(),
});

const fieldTransformSchema = z.enum(["uppercase", "lowercase", "trim", "stripWhitespace", "none"]);
export type FieldTransform = z.infer<typeof fieldTransformSchema>;

const fieldCascadeRuleSchema = z.looseObject({
  when: z.any(),
  set: z.record(z.string(), z.any()),
});
export type FieldCascadeRule = z.infer<typeof fieldCascadeRuleSchema>;

/** `min` / `max`: the value range for numeric fields, the length range for text fields. */
const fieldValidationRuleSchema = z.looseObject({
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

const singleFieldConditionSchema = z.looseObject({
  field: z.string().min(1, "Target dependency field is required"),
  operator: fieldConditionOperatorSchema.default("eq"),
  value: z.any().optional(),
});
type SingleFieldCondition = z.infer<typeof singleFieldConditionSchema>;

export type FieldVisibilityCondition =
  | SingleFieldCondition
  | { and: FieldVisibilityCondition[] }
  | { or: FieldVisibilityCondition[] };

const fieldVisibilityConditionSchema: z.ZodType<FieldVisibilityCondition> = z.lazy(() =>
  z.union([
    singleFieldConditionSchema,
    z.looseObject({ and: z.array(fieldVisibilityConditionSchema).min(1) }),
    z.looseObject({ or: z.array(fieldVisibilityConditionSchema).min(1) }),
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
export type PropertyWidth = SemanticWidthToken;

export const baseFormElementSchema = baseFieldSchema.extend({
  REQUIRED: z.boolean().optional(),
  MODELNAME: z.string().optional(),
  LABEL: z.string().default("").optional(),
  WIDTH: propertyWidthSchema.default("md").optional(),
  DISABLED: z.boolean().default(false).optional(),
  POSITION: z.string().default("").optional(),
  ENRICHTEXT: z.string().default("").optional(),
  DEFAULTVALUE: z.string().default("").optional(),
  FIXEDVALUE: z.string().default("").optional(),
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

/**
 * Universal Container Visual & Behavioral Configuration:
 * Allows configuring styling, borders, density, badges, icons, and behavior per container.
 */
export const containerConfigSchema = z.object({
  /**
   * Style preset; explicit showHeader / bordered / background override it. "ghost" = frameless.
   * None of these have a schema default: a parsed layout must leave them unset so the variant
   * preset applies and a tab group can find the one tab that carries its settings.
   */
  variant: z.enum(["default", "subtle", "bordered", "elevated", "ghost"]).optional(),
  density: z.enum(["compact", "normal", "spacious"]).optional(),
  showHeader: z.boolean().optional(),
  bordered: z.boolean().optional(),
  background: z.enum(["regular", "subtle", "none"]).optional(),

  // Tab Group container styling & height modes (renderers fall back to "card" / "auto")
  tabVariant: z.enum(["card", "workbench", "pills"]).optional(),
  heightMode: z.enum(["auto", "fill", "fixed"]).optional(),
  minHeight: z.union([z.number(), z.string()]).optional(),

  badge: z.string().optional(),
  badgeVariant: z.enum(["default", "secondary", "outline", "destructive"]).optional(),
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
  layout: z.enum(["horizontal", "stacked"]).default("horizontal").optional(),
  density: z.enum(["compact", "normal", "spacious"]).default("compact").optional(),
  sections: z.array(formSectionSchema).default([]),
});
export type FormElementsContainer = z.infer<typeof formElementsContainerSchema>;
