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
/* 2. FORM LAYOUT SECTIONS & CONTAINERS (Visual UI Layout Nodes)               */
/* ========================================================================== */

/**
 * Universal Container Type:
 * - 'card': Standard elevated card box with title bar and optional collapse
 * - 'plain': Borderless, title-less root canvas container
 * - 'tab': Tab pane clustered inside a TabGroup header
 * - 'step': Wizard step pane clustered inside a Stepper header
 * - 'accordion': Collapsible panel clustered inside an Accordion group
 */
export const formContainerTypeSchema = z.enum(["card", "plain", "tab", "step", "accordion"]);
export type FormContainerType = z.infer<typeof formContainerTypeSchema>;

/**
 * Universal Container Visual & Behavioral Configuration:
 * Allows configuring styling, borders, density, badges, icons, and behavior per container.
 */
export const containerConfigSchema = z.object({
  variant: z.enum(["default", "subtle", "bordered", "elevated", "ghost"]).optional(),
  density: z.enum(["compact", "normal", "spacious"]).optional(),
  badge: z.string().optional(),
  badgeVariant: z.enum(["default", "secondary", "outline", "destructive"]).optional(),
  icon: z.string().optional(),
  bordered: z.boolean().optional(),
  accentColor: z.string().optional(),
  customClass: z.string().optional(),
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
  sections: z.array(formSectionSchema).default([]),
});
export type FormElementsContainer = z.infer<typeof formElementsContainerSchema>;

/* ========================================================================== */
/* 3. MASTER FORM CONFIG RECORD (SC_FORM_CONFIG)                              */
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
/* 4. COMBINED GFC / GNI WIRE RESPONSE CONTRACT                               */
/* ========================================================================== */

export const gfcResponseSchema = modelConfigRecordSchema.extend({
  FORMCONTROL: z.union([formConfigRecordSchema, z.record(z.string(), z.any())]).default({}),
});
export type GfcResponse = z.infer<typeof gfcResponseSchema>;
