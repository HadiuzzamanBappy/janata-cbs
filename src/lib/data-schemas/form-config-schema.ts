import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import type { PropertyType } from "./model-config-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Form Presentation Archetypes & Widget Types                      */
/* -------------------------------------------------------------------------- */

/**
 * Universal Form Layout Archetypes:
 * - scanline: Classic compact CBS row card (Label : Input)
 * - grid: Responsive 12-column grid layout
 * - wizard: Multi-step stepper with Next/Previous
 * - master-detail: Fixed master header fields + bottom detail tabs
 * - accordion: Collapsible sections
 * - tabs: Multi-tab embedded form sheets
 */
export const formArchetypeSchema = z.enum([
  "scanline",
  "grid",
  "wizard",
  "master-detail",
  "accordion",
  "tabs",
]);
export type FormArchetype = z.infer<typeof formArchetypeSchema>;
export const FORM_ARCHETYPES = formArchetypeSchema.options;

/** Visual density presets for bank teller workstations. */
export const formDensitySchema = z.enum(["compact", "normal", "spacious"]);
export type FormDensity = z.infer<typeof formDensitySchema>;

/** Available input widgets for visual forms. */
export const formWidgetTypeSchema = z.enum([
  "text",
  "number",
  "amount",
  "date",
  "select",
  "radio",
  "radio-group",
  "checkbox-group",
  "textarea",
  "switch",
  "account-lookup",
]);
export type FormWidgetType = z.infer<typeof formWidgetTypeSchema>;
export const FORM_WIDGET_TYPES = formWidgetTypeSchema.options;

/* -------------------------------------------------------------------------- */
/* Widget ↔ Model Property Type Compatibility Dictionary                      */
/* -------------------------------------------------------------------------- */

/**
 * Single source of truth mapping physical Model Property types (Text, Number, Date)
 * to allowed visual presentation widgets.
 */
export const WIDGET_COMPATIBILITY_MAP: Record<PropertyType, FormWidgetType[]> = {
  Text: [
    "text",
    "textarea",
    "select",
    "radio",
    "radio-group",
    "switch",
    "checkbox-group",
    "account-lookup",
  ],
  Number: ["number", "amount", "select", "radio", "radio-group"],
  Date: ["date"],
};

/**
 * Human-readable labels and descriptions for all supported form widget types.
 */
export const WIDGET_LABELS: Record<FormWidgetType, { label: string; description: string }> = {
  text: { label: "Single-line Text", description: "Standard text input field" },
  number: { label: "Numeric Input", description: "Direct numeric entry with spin button" },
  amount: { label: "Amount / Currency", description: "Currency-formatted input with prefix" },
  date: { label: "Calendar Date Picker", description: "Date selection with calendar modal" },
  select: { label: "Dropdown Select", description: "Standard select dropdown menu" },
  radio: { label: "Radio List (Vertical)", description: "Vertical radio button list" },
  "radio-group": { label: "Segmented Buttons", description: "Horizontal pill/button group" },
  "checkbox-group": { label: "Multi-Checkbox Group", description: "Multiple choice checkbox tags" },
  textarea: { label: "Multi-line Text Area", description: "Expandable multiline text block" },
  switch: { label: "Boolean Toggle Switch", description: "On/Off binary toggle" },
  "account-lookup": {
    label: "CBS Account Lookup",
    description: "Account number picker with search",
  },
};

/**
 * Returns the list of widgets allowed for a given model property type.
 * If no model type is provided (unbound / custom field), all widgets are available.
 */
export function getCompatibleWidgets(modelType?: PropertyType): FormWidgetType[] {
  if (!modelType) return formWidgetTypeSchema.options as FormWidgetType[];
  return WIDGET_COMPATIBILITY_MAP[modelType] ?? ["text"];
}

/**
 * Checks whether a specific widget is valid for a given model property type.
 */
export function isWidgetCompatible(
  modelType: PropertyType | undefined,
  widget: FormWidgetType,
): boolean {
  if (!modelType) return true;
  return (WIDGET_COMPATIBILITY_MAP[modelType] ?? []).includes(widget);
}

/**
 * Returns the default (best-fit) widget for a model property type.
 */
export function getDefaultWidget(modelType: PropertyType): FormWidgetType {
  return WIDGET_COMPATIBILITY_MAP[modelType]?.[0] ?? "text";
}

/* -------------------------------------------------------------------------- */
/* Form Items (Fields, Object Groups, Repeated Sub-Tables)                    */
/* -------------------------------------------------------------------------- */

/** A single field input item placed in a form section. */
export const formFieldItemSchema = z.object({
  id: z.string(),
  fieldKey: z.string().min(1, "Field key is required"),
  label: z.string().min(1, "Label is required"),
  widget: formWidgetTypeSchema.default("text"),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  colSpan: z.number().min(1).max(12).optional(), // 12-column responsive span
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  hidden: z.boolean().optional(),
  options: z.array(z.string()).optional(), // Legacy string options (fallback)
  currencyPrefix: z.string().optional(), // For amount widgets (e.g. "BDT")
  formula: z.string().optional(), // Derived/Calculated expression
  length: z.number().optional(), // Max character/digit constraint from MODEL.CONFIG
  structure: z.enum(["S", "M"]).default("S").optional(), // S = Single value, M = Multi-value
  // Object group metadata
  groupKey: z.string().optional(), // Parent Object key (e.g. "nominee")
  groupSn: z.string().optional(), // Parent Object SN (e.g. "8")
  groupLabel: z.string().optional(), // Parent Object Label (e.g. "Nominee Details")
  groupStructure: z.enum(["S", "M"]).optional(), // Parent Object structure ("S" or "M")
  isFirstInGroup: z.boolean().optional(), // True only for the 1st field of the group
  // Binding metadata from MODEL.CONFIG — set when field is placed from palette
  modelType: z.string().optional(), // PropertyType: "Number", "Dropdown", "Date", etc.
  parameter: z.unknown().optional(), // PropertyParameter — typed as unknown for Zod safety
});
export type FormFieldItem = z.infer<typeof formFieldItemSchema>;

/**
 * Convenience type alias for the parameter field at runtime.
 * Cast `field.parameter` to this type to access itemCode/itemLabel/modelName etc.
 */
export type FormFieldParameter = {
  type: "O" | "M" | "";
  data: { id?: string; itemCode: string; itemLabel: string }[];
  modelName: string;
  displayField: string;
  condition: string;
  reference: string;
};

/**
 * Form Section Container:
 * Can be a fixed header block, a tabbed page, or a standard section.
 * Supports single card, nested object group (e.g. presentAddress: { street, city }),
 * or a repeating multi-row sub-table (e.g. nomineeList: [ { name, share } ]).
 */
export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  type: z.enum(["standard", "object-group", "array-table"]).default("standard"),
  zone: z.enum(["header", "tab", "standard"]).optional().default("standard"),
  tabGroupId: z.string().optional(), // Distinct identifier for multiple independent tab bars (e.g. "grp_account", "grp_operations")
  tabTitle: z.string().optional(),
  bindKey: z.string().optional(), // Nested target key in model (e.g. "presentAddress" or "nominees")
  columns: z.number().min(1).max(4).default(2),
  collapsible: z.boolean().default(false),
  isCollapsed: z.boolean().default(false),
  layoutStyle: z.enum(["card", "plain"]).optional(), // "card" (bordered card) or "plain" (flat borderless block)
  fields: z.array(formFieldItemSchema).default([]),
});
export type FormSection = z.infer<typeof formSectionSchema>;

/** Stepper step definition (used when archetype === 'wizard') */
export const formWizardStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  sectionIds: z.array(z.string()),
});
export type FormWizardStep = z.infer<typeof formWizardStepSchema>;

/* -------------------------------------------------------------------------- */
/* Canonical Master Form Config Record                                        */
/* -------------------------------------------------------------------------- */

export const formConfigPresentationSchema = z.object({
  archetype: formArchetypeSchema.optional(),
  density: formDensitySchema.optional(),
  steps: z.array(formWizardStepSchema).optional().default([]),
  sections: z.array(formSectionSchema).default([]),
});
export type FormConfigPresentation = z.infer<typeof formConfigPresentationSchema>;

export const formConfigRecordSchema = z.looseObject({
  presentation: formConfigPresentationSchema,
  auditData: auditDataSchema.optional(),
});

export type FormConfigRecord = z.infer<typeof formConfigRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Canonical Compiled Form Specification Contract                             */
/* -------------------------------------------------------------------------- */

/**
 * Zod schema validating the unified compiled runtime form specification.
 * Generated server-side by compileFormSpec(model, layout) and consumed
 * by the runtime FormScreen, FormRenderer, and validation engines.
 */
export const compiledFormSpecSchema = z.object({
  code: z.string().min(1, "Form spec code is required"),
  title: z.string().min(1, "Form spec title is required"),
  targetModel: z.string().min(1, "Target model is required"),
  version: z.string().optional(),
  layoutSource: z.enum(["custom", "fallback"]),
  isStale: z.boolean().default(false),
  idPrefix: z.string().optional(),
  idDef: z
    .object({
      idPrefix: z.string().default(""),
      idPattern: z.string().default(""),
      sequenceLength: z.union([z.number(), z.string()]).optional(),
      sequenceReset: z.boolean().default(false),
    })
    .optional(),
  fields: z.array(formFieldItemSchema),
  presentation: z.object({
    archetype: formArchetypeSchema.optional().default("scanline"),
    density: formDensitySchema.optional().default("compact"),
    steps: z.array(formWizardStepSchema).optional().default([]),
    sections: z.array(formSectionSchema).default([]),
  }),
  auditData: auditDataSchema.optional(),
});

export type CompiledFormSpec = z.infer<typeof compiledFormSpecSchema>;
