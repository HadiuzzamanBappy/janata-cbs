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
/* 2. PARAMETER / LOOKUP CONTRACT                                             */
/* ========================================================================== */

export const formElementParameterSchema = z.object({
  type: z.string().default("O"),
  data: z.array(z.any()).default([]),
  modelName: z.string().default(""),
  displayField: z.string().default(""),
  condition: z.string().default(""),
  reference: z.string().default(""),
});
export type FormElementParameter = z.infer<typeof formElementParameterSchema>;
export type FormFieldParameter = FormElementParameter;

/* ========================================================================== */
/* 3. CANONICAL FORM ELEMENT (The 18 Exact CBS Wire Properties)                */
/* ========================================================================== */

export const formElementSchema = z.object({
  id: z.string().optional(), // Internal canvas identifier
  SN: z.coerce.string().default("1"),
  NAME: z.string().min(1, "Name is required"),
  LABEL: z.string().min(1, "Label is required"),
  TYPE: z.string().default("Text"),
  LENGTH: z.coerce.number().default(35),
  STRUCTURE: z.string().default("S"),
  REQUIRED: z.boolean().default(false),
  DISABLED: z.boolean().default(false),
  WIDTH: z.union([propertyWidthSchema, z.number()]).default("md"),
  POSITION: z.string().default(""),
  PARAMETER: formElementParameterSchema.default({
    type: "O",
    data: [],
    modelName: "",
    displayField: "",
    condition: "",
    reference: "",
  }),
  ENRICHTEXT: z.string().default(""),
  VALUE: z.union([z.string(), z.array(z.string())]).default(""),
  FIXEDVALUE: z.string().default(""),
  ISOPEN: z.boolean().default(false),
  ISLOADING: z.boolean().default(false),
  PROP: z.array(z.any()).default([]),
  DATASOURCE: z.array(z.any()).default([]),
  DEFAULTVALUE: z.string().default(""),
});
export type FormElement = z.infer<typeof formElementSchema>;
export type FormFieldItem = FormElement;

/* ========================================================================== */
/* 4. FORM LAYOUT SECTIONS & STEPPERS (Visual UI Layout Containers)           */
/* ========================================================================== */

export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  description: z.string().optional(),
  type: z.enum(["standard", "object-group", "array-table"]).default("standard"),
  zone: z.enum(["header", "tab", "standard"]).default("standard"),
  tabGroupId: z.string().optional(),
  tabTitle: z.string().optional(),
  bindKey: z.string().optional(),
  columns: z.number().min(1).max(4).default(1),
  structure: z.enum(["S", "M"]).optional(),
  collapsible: z.boolean().default(false),
  isCollapsed: z.boolean().default(false),
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
  description: z.string().default(""),
  authNumber: z.coerce.number().default(1),
  frmRoutine: formRoutineSchema.default({
    rtnValidate: [],
    rtnBeforeAuth: [],
    rtnAfterAuth: [],
  }),
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
