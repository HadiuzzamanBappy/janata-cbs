import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import {
  formArchetypeSchema,
  formDensitySchema,
  formFieldItemSchema,
  formSectionSchema,
  formWizardStepSchema,
} from "./form-config-schema";

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
