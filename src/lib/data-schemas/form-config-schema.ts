import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import { formElementSchema } from "./form-engine-schema";
import { modelConfigRecordSchema } from "./model-config-schema";

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
/* 2. FORM LAYOUT SECTIONS & STEPPERS (Visual UI Layout Containers)           */
/* ========================================================================== */

export const formSectionSchema = z.looseObject({
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

export const formElementsContainerSchema = z.looseObject({
  steps: z.array(formWizardStepSchema).default([]).optional(),
  sections: z.array(formSectionSchema).default([]),
});
export type FormElementsContainer = z.infer<typeof formElementsContainerSchema>;

/* ========================================================================== */
/* 3. MASTER FORM CONFIG RECORD (SC_FORM_CONFIG)                              */
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

/* ========================================================================== */
/* 4. COMBINED GFC / GNI WIRE RESPONSE CONTRACT                               */
/* ========================================================================== */

export const gfcResponseSchema = modelConfigRecordSchema.extend({
  FORMCONTROL: z.union([formConfigRecordSchema, z.record(z.string(), z.any())]).default({}),
});
export type GfcResponse = z.infer<typeof gfcResponseSchema>;
