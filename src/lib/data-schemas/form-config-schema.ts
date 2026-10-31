import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import { modelConfigRecordSchema, propertyWidthSchema } from "./model-config-schema";

/* ========================================================================== */
/* 1. ROUTINE HOOKS CONTRACT                                                  */
/* ========================================================================== */

export const routineItemSchema = z.object({
  id: z.string().optional(),
  routineName: z.string().default(""),
  routineDescription: z.string().default(""),
});
export type RoutineItem = z.infer<typeof routineItemSchema>;

export const formRoutineSchema = z.object({
  rtnValidate: z.array(routineItemSchema).default([]),
  rtnBeforeAuth: z.array(routineItemSchema).default([]),
  rtnAfterAuth: z.array(routineItemSchema).default([]),
});
export type FormRoutine = z.infer<typeof formRoutineSchema>;

/* ========================================================================== */
/* 2. PARAMETER / LOOKUP & WIDGET CONFIG CONTRACT                             */
/* ========================================================================== */

export const formWidgetTypeSchema = z.enum([
  "text",
  "number",
  "amount",
  "date",
  "select",
  "radio-group",
  "switch",
  "checkbox",
]);
export type FormWidgetType = z.infer<typeof formWidgetTypeSchema>;

export const formElementParameterSchema = z.object({
  type: z.string().default("O"),
  data: z.array(z.any()).default([]).optional(),
  modelName: z.string().default("").optional(),
  codeField: z.string().default("").optional(),
  displayField: z.string().default("").optional(),
  condition: z.string().default("").optional(),
  reference: z.string().default("").optional(),
});
export type FormElementParameter = z.infer<typeof formElementParameterSchema>;
export type FormFieldParameter = FormElementParameter;

// Type-specific configuration blocks for advanced banking inputs
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
/* 3. CANONICAL FORM ELEMENT (Model-Extended with Banking Presentation Spec)  */
/* ========================================================================== */

export const formElementSchema = z.object({
  // A. Physical Core Anchor (Inherited from MODEL.CONFIG - Fixed / Read-Only in UI)
  SN: z.coerce.string().default("1"),
  NAME: z.string().min(1, "Name is required"),
  TYPE: z.string().default("Text"),
  STRUCTURE: z.string().default("S"),
  LENGTH: z.coerce.number().default(35),

  // B. Universal Presentation Overrides (Configurable on all fields - Sparse in DB)
  LABEL: z.string().min(1, "Label is required"),
  REQUIRED: z.boolean().default(false).optional(),
  DISABLED: z.boolean().default(false).optional(),
  WIDTH: z.union([propertyWidthSchema, z.number()]).default("md").optional(),
  POSITION: z.string().default("").optional(),
  ENRICHTEXT: z.string().default("").optional(),
  DEFAULTVALUE: z.string().default("").optional(),
  HELPTEXT: z.string().default("").optional(),

  // C. UI Presentation Widget & Type-Specific Configuration Blocks
  WIDGET: formWidgetTypeSchema.optional(),
  PARAMETER: formElementParameterSchema
    .default({
      type: "O",
      data: [],
      modelName: "",
      codeField: "",
      displayField: "",
      condition: "",
      reference: "",
    })
    .optional(),
  TEXT_CONFIG: textWidgetConfigSchema.optional(),
  NUMBER_CONFIG: numberWidgetConfigSchema.optional(),
  DATE_CONFIG: dateWidgetConfigSchema.optional(),
  BOOLEAN_CONFIG: booleanWidgetConfigSchema.optional(),

  // Optional fixed computed formula or runtime initial value
  FIXEDVALUE: z.string().default("").optional(),
  VALUE: z
    .union([z.string(), z.array(z.string())])
    .default("")
    .optional(),
});
export type FormElement = z.infer<typeof formElementSchema>;
export type FormFieldItem = FormElement;

/* ========================================================================== */
/* 4. FORM LAYOUT SECTIONS & STEPPERS (Visual UI Layout Containers)           */
/* ========================================================================== */

export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string().default("").optional(),
  description: z.string().optional(),
  type: z.enum(["standard", "object-group", "array-table"]).default("standard").optional(),
  zone: z.enum(["header", "tab", "standard"]).default("standard").optional(),
  tabGroupId: z.string().optional(),
  tabTitle: z.string().optional(),
  bindKey: z.string().optional(),
  columns: z.number().min(1).max(4).default(1).optional(),
  structure: z.enum(["S", "M"]).optional(),
  collapsible: z.boolean().default(false).optional(),
  isCollapsed: z.boolean().default(false).optional(),
  layoutStyle: z.enum(["card", "plain"]).optional().default("card"),
  fields: z.array(formElementSchema).default([]),
});
export type FormSection = z.infer<typeof formSectionSchema>;

export const formWizardStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  sectionIds: z.array(z.string()),
});
export type FormWizardStep = z.infer<typeof formWizardStepSchema>;

export const formElementsContainerSchema = z.object({
  steps: z.array(formWizardStepSchema).default([]),
  sections: z.array(formSectionSchema).default([]),
});
export type FormElementsContainer = z.infer<typeof formElementsContainerSchema>;

/* ========================================================================== */
/* 5. MASTER FORM CONFIG RECORD (SC_FORM_CONFIG)                              */
/* ========================================================================== */

export const formConfigRecordSchema = z.looseObject({
  title: z.string().default(""),
  description: z.string().default("").optional(),
  authNumber: z.coerce.number().default(1).optional(),
  frmRoutine: formRoutineSchema
    .default({
      rtnValidate: [],
      rtnBeforeAuth: [],
      rtnAfterAuth: [],
    })
    .optional(),
  frmElements: formElementsContainerSchema.default({ steps: [], sections: [] }),
  auditData: auditDataSchema.optional(),
});
export type FormConfigRecord = z.infer<typeof formConfigRecordSchema>;
export type CompiledFormSpec = FormConfigRecord;

/* ========================================================================== */
/* 6. COMBINED GFC / GNI WIRE RESPONSE CONTRACT                               */
/* ========================================================================== */

export const gfcResponseSchema = modelConfigRecordSchema.extend({
  FORMCONTROL: z.union([formConfigRecordSchema, z.record(z.string(), z.any())]).default({}),
});
export type GfcResponse = z.infer<typeof gfcResponseSchema>;
