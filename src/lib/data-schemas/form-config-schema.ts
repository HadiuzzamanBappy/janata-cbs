/**
 * @fileoverview Data schemas for CBS Form Configuration (SC_FORM_CONFIG).
 * Defines the master form configuration entity, routine hooks, and GFC wire contracts.
 * Layout nodes (containers, sections) are canonically defined in form-engine-schema.
 *
 * @module lib/data-schemas/form-config-schema
 */

import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import { formElementsContainerSchema } from "./form-engine-schema";
import { modelConfigRecordSchema } from "./model-config-schema";

// Re-export layout nodes for convenience
export {
  type ContainerConfig,
  containerConfigSchema,
  type FormContainerType,
  type FormElementsContainer,
  type FormSection,
  formContainerTypeSchema,
  formElementsContainerSchema,
  formSectionSchema,
} from "./form-engine-schema";

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
/* 2. MASTER FORM CONFIG RECORD (SC_FORM_CONFIG)                              */
/* ========================================================================== */

export const formConfigRecordSchema = z.object({
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
  frmElements: formElementsContainerSchema.default({ sections: [] }),
  auditData: auditDataSchema.optional(),
});
export type FormConfigRecord = z.infer<typeof formConfigRecordSchema>;

/* ========================================================================== */
/* 3. COMBINED GFC / GNI WIRE RESPONSE CONTRACT                               */
/* ========================================================================== */

export const gfcResponseSchema = modelConfigRecordSchema.extend({
  FORMCONTROL: z.union([formConfigRecordSchema, z.record(z.string(), z.any())]).default({}),
});
export type GfcResponse = z.infer<typeof gfcResponseSchema>;
