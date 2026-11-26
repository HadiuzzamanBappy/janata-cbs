/**
 * @fileoverview Data schemas for CBS Form Configuration (SC_FORM_CONFIG).
 * Defines the master form configuration entity, routine hooks, and GFC wire contracts.
 * Layout nodes (containers, sections) are canonically defined in form-engine-schema.
 *
 * @module lib/data-schemas/form-config-schema
 */

import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import {
  CBS_PARAMETER_TYPE,
  type FieldVisibilityCondition,
  type FormElement,
  formElementsContainerSchema,
} from "./form-engine-schema";
import { CHOICE_WIDGETS } from "./form-widget-schema";
import { modelConfigRecordSchema } from "./model-config-schema";

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

/* ========================================================================== */
/* 4. SAVE RULES (SFC): what may be written to CONFIG.FORM                    */
/* ========================================================================== */

const ROUTINE_GROUPS = [
  { key: "rtnValidate", label: "Validation Routine" },
  { key: "rtnBeforeAuth", label: "Before-Auth Routine" },
  { key: "rtnAfterAuth", label: "After-Auth Routine" },
] as const;

/** Condition targets are form fields (first path segment) or the record's audit block. */
const AUDIT_PATH_PREFIX = "auditData.";

function conditionTargets(condition: FieldVisibilityCondition): string[] {
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

    // Cards may be untitled (standalone fields, ghost cards); a tab needs a label for its strip
    if (section.containerType === "tab" && !section.title?.trim()) {
      issue([...secPath, "title"], "Tab Title is required");
    }
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

      checkFieldRules(field, fieldPath, display, issue, isKnownTarget);
      checkInnerFields(field, fieldPath, display, issue, isKnownTarget);
    });
  });
});

type IssueFn = (path: (string | number)[], message: string) => void;

/**
 * Inner fields of an object group (`PROP`): the group keeps at least one, names are unique
 * within it, and each inner field meets the same rules as a top-level field.
 */
function checkInnerFields(
  group: FormElement,
  groupPath: (string | number)[],
  groupDisplay: string,
  issue: IssueFn,
  isKnownTarget: (target: string) => boolean,
): void {
  const inner = group.PROP;
  if (!inner) return;
  if (inner.length === 0) {
    issue([...groupPath, "PROP"], `Object group "${groupDisplay}" needs at least one field`);
    return;
  }
  const seen = new Set<string>();
  inner.forEach((child, idx) => {
    const childPath = [...groupPath, "PROP", idx];
    const name = child.NAME.trim();
    const display = `${groupDisplay}.${name || `#${idx + 1}`}`;
    const lower = name.toLowerCase();
    if (lower && seen.has(lower)) {
      issue([...childPath, "NAME"], `Duplicate field "${name}" in object group "${groupDisplay}"`);
    }
    seen.add(lower);
    checkFieldRules(child, childPath, display, issue, isKnownTarget);
    checkInnerFields(child, childPath, display, issue, isKnownTarget);
  });
}

/** Save rules of one field (top-level or inner): label, rule targets, options and ranges. */
function checkFieldRules(
  field: FormElement,
  fieldPath: (string | number)[],
  display: string,
  issue: IssueFn,
  isKnownTarget: (target: string) => boolean,
): void {
  if (!field.LABEL?.trim()) issue([...fieldPath, "LABEL"], `Field "${display}" Label is required`);

  for (const key of ["VISIBLE_WHEN", "DISABLED_WHEN"] as const) {
    const condition = field[key];
    if (!condition) continue;
    for (const target of conditionTargets(condition)) {
      if (!isKnownTarget(target)) {
        issue(
          "field" in condition ? [...fieldPath, key, "field"] : [...fieldPath, key],
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

  (field.CASCADE ?? []).forEach((rule, rIdx) => {
    for (const target of Object.keys(rule.set ?? {})) {
      if (!isKnownTarget(target)) {
        issue(
          [...fieldPath, "CASCADE", rIdx, "set"],
          `Field "${display}" CASCADE sets unknown field "${target}"`,
        );
      }
    }
  });

  const dateRange = field.DATE_CONFIG;
  if (
    dateRange?.minDateOffset !== undefined &&
    dateRange.maxDateOffset !== undefined &&
    dateRange.minDateOffset > dateRange.maxDateOffset
  ) {
    issue(
      [...fieldPath, "DATE_CONFIG", "minDateOffset"],
      `Field "${display}" earliest date offset is after its latest date offset`,
    );
  }

  const options =
    field.PARAMETER?.type === CBS_PARAMETER_TYPE.OPTIONS || !field.PARAMETER
      ? (field.PARAMETER?.data ?? [])
      : null;
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
  if (rule?.matches && !isValidRegex(rule.matches)) {
    issue(
      [...fieldPath, "VALIDATION", "matches"],
      `Field "${display}" pattern is not a valid regular expression`,
    );
  }
}
