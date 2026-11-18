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

const routineItemSchema = z.object({
  id: z.string().optional(),
  routineName: z.string().default(""),
  routineDescription: z.string().default(""),
});

const formRoutineSchema = z.object({
  rtnValidate: z.array(routineItemSchema).default([]),
  rtnBeforeAuth: z.array(routineItemSchema).default([]),
  rtnAfterAuth: z.array(routineItemSchema).default([]),
});

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

/* ========================================================================== */
/* 4. SAVE RULES (SFC): what may be written to CONFIG.FORM                    */
/* ========================================================================== */

type FormField = FormConfigRecord["frmElements"]["sections"][number]["fields"][number];
type FieldCondition = NonNullable<FormField["VISIBLE_WHEN"]>;

const ROUTINE_GROUPS = [
  { key: "rtnValidate", label: "Validation Routine" },
  { key: "rtnBeforeAuth", label: "Before-Auth Routine" },
  { key: "rtnAfterAuth", label: "After-Auth Routine" },
] as const;

/** Widgets that pick from a list, so they need options unless a model lookup (MODELNAME) feeds them. */
const CHOICE_WIDGETS: ReadonlySet<string> = new Set([
  "select",
  "radio-group",
  "segmented",
  "checkbox-group",
]);

/** Condition targets are form fields (first path segment) or the record's audit block. */
const AUDIT_PATH_PREFIX = "auditData.";

function conditionTargets(condition: FieldCondition): string[] {
  if ("and" in condition && Array.isArray(condition.and))
    return condition.and.flatMap(conditionTargets);
  if ("or" in condition && Array.isArray(condition.or))
    return condition.or.flatMap(conditionTargets);
  return "field" in condition && typeof condition.field === "string" ? [condition.field] : [];
}

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * The record schema plus the designer's save rules. Reads (GFC) stay on `formConfigRecordSchema`,
 * so a stored layout that predates a rule still loads. Used by the FORM.CONFIG designer before
 * saving and by `/api/proxy` on every SFC.
 */
export const formConfigSaveSchema = formConfigRecordSchema.superRefine((form, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });

  if (!form.title.trim()) issue(["title"], "Form title is required");

  for (const { key, label } of ROUTINE_GROUPS) {
    (form.frmRoutine?.[key] ?? []).forEach((routine, idx) => {
      if (!routine.routineName.trim()) {
        issue(
          ["frmRoutine", key, idx, "routineName"],
          `${label} #${idx + 1}: Routine Name is required`,
        );
      }
    });
  }

  const sections = form.frmElements.sections;
  if (sections.length === 0) {
    issue(["frmElements", "sections"], "At least one section must be configured");
    return;
  }

  const fieldNames = new Set(
    sections.flatMap((s) => s.fields.map((f) => f.NAME.trim().toLowerCase())),
  );
  const isKnownTarget = (target: string) =>
    target.startsWith(AUDIT_PATH_PREFIX) || fieldNames.has(target.split(".")[0].toLowerCase());

  const seenSectionIds = new Set<string>();
  const seenFieldNames = new Map<string, string>(); // lowercase name -> section display

  sections.forEach((section, sIdx) => {
    const secPath = ["frmElements", "sections", sIdx];
    const secDisplay = section.title?.trim() || `Section #${sIdx + 1}`;

    if (!section.title?.trim()) issue([...secPath, "title"], "Section Title is required");
    if (seenSectionIds.has(section.id)) {
      issue([...secPath, "id"], `Section ID "${section.id}" is used by another section`);
    }
    seenSectionIds.add(section.id);
    if (section.fields.length === 0)
      issue([...secPath, "fields"], "At least one field is required");

    section.fields.forEach((field, fIdx) => {
      const fieldPath = [...secPath, "fields", fIdx];
      const name = field.NAME.trim();
      const display = name || `#${fIdx + 1}`;
      const lowerName = name.toLowerCase();

      if (lowerName && seenFieldNames.has(lowerName)) {
        issue(
          [...fieldPath, "NAME"],
          `Duplicate field name "${name}" (already used in ${seenFieldNames.get(lowerName)})`,
        );
      } else if (lowerName) {
        seenFieldNames.set(lowerName, secDisplay);
      }

      if (!field.LABEL?.trim())
        issue([...fieldPath, "LABEL"], `Field "${display}" Label is required`);

      for (const key of ["VISIBLE_WHEN", "HIDDEN_WHEN", "DISABLED_WHEN"] as const) {
        const condition = field[key];
        if (!condition) continue;
        for (const target of conditionTargets(condition)) {
          if (!isKnownTarget(target)) {
            issue(
              [...fieldPath, key, "field"],
              `Field "${display}" ${key} points at unknown field "${target}"`,
            );
          }
        }
      }

      const onChangeTarget = field.ON_CHANGE?.target;
      if (onChangeTarget && !isKnownTarget(onChangeTarget)) {
        issue(
          [...fieldPath, "ON_CHANGE", "target"],
          `Field "${display}" ON_CHANGE points at unknown field "${onChangeTarget}"`,
        );
      }

      const options =
        field.PARAMETER?.type === "O" || !field.PARAMETER ? (field.PARAMETER?.data ?? []) : null;
      if (
        CHOICE_WIDGETS.has(field.WIDGET ?? "") &&
        field.TYPE !== "Boolean" &&
        !field.MODELNAME?.trim() &&
        options !== null &&
        options.length === 0
      ) {
        issue(
          [...fieldPath, "PARAMETER"],
          `Field "${display}" uses ${field.WIDGET} but has no options`,
        );
      }

      const rule = field.VALIDATION;
      if (rule?.min !== undefined && rule.max !== undefined && rule.min > rule.max) {
        issue(
          [...fieldPath, "VALIDATION", "min"],
          `Field "${display}" minimum (${rule.min}) is greater than its maximum (${rule.max})`,
        );
      }
      for (const key of ["pattern", "matches"] as const) {
        const pattern = rule?.[key];
        if (pattern && !isValidRegex(pattern)) {
          issue(
            [...fieldPath, "VALIDATION", key],
            `Field "${display}" ${key} is not a valid regular expression`,
          );
        }
      }
    });
  });
});
