import { z } from "zod";
import { auditDataSchema } from "./common-schema";

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

export const formConfigRecordSchema = z.object({
  recordId: z.string().min(1, "Form Code is required"),
  title: z.string().min(1, "Form Title is required"),
  targetModel: z.string().min(1, "Target Model is required"),
  version: z.string().default("1.0.0"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  presentation: z.object({
    archetype: formArchetypeSchema.optional(),
    density: formDensitySchema.optional(),
    steps: z.array(formWizardStepSchema).optional().default([]),
    sections: z.array(formSectionSchema).default([]),
  }),
  auditData: auditDataSchema.optional(),
});

export type FormConfigRecord = z.infer<typeof formConfigRecordSchema>;
