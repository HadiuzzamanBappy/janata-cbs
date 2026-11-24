/**
 * @fileoverview Validation error mapping and business rules for FORM.CONFIG.
 * Translates Zod schema validation errors and domain checks to tab-aware
 * screen validation items with exact section and field targets.
 *
 * @module features/system/form-config/hooks/fc-validation
 */

import type { ZodError } from "zod";
import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import {
  type FormConfigRecord,
  formConfigSaveSchema,
  type ModelConfigRecord,
} from "@/lib/data-schemas";

export type FormConfigTabKey = "general" | "formDesigner" | "routines" | "preview" | "json";

export interface FormConfigValidationError extends CbsScreenValidationError<FormConfigTabKey> {
  readonly id: string;
  readonly tab: FormConfigTabKey;
  readonly fieldKey: string;
  readonly message: string;
  readonly sectionId?: string;
  readonly fieldId?: string;
}

/** Field identity used by the canvas and inspector to find their errors. */
const fieldIdOf = (field: { SN?: string; NAME?: string }, idx: number): string =>
  String(field.SN || field.NAME || `f_${idx}`);

/**
 * Maps save-schema issues to designer targets. A path inside
 * `frmElements.sections[s].fields[f]` points at that section and field, and `fieldKey` is the
 * field property (`LABEL`, `VALIDATION.min`) the inspector highlights.
 */
function mapZodIssuesToFcValidationErrors(
  issues: ZodError["issues"],
  formData: FormConfigRecord,
): FormConfigValidationError[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    if (path[0] !== "frmElements" || path[1] !== "sections") {
      const isRoutine = path[0] === "frmRoutine";
      return {
        id: `${isRoutine ? "routines" : "general"}-${path.join(".")}-${idx}`,
        tab: isRoutine ? "routines" : "general",
        fieldKey: path.join("."),
        message: isRoutine ? issue.message : `General: ${issue.message}`,
      };
    }

    const sIdx = typeof path[2] === "number" ? path[2] : -1;
    const section = formData.frmElements?.sections?.[sIdx];
    const secDisplay =
      section?.title?.trim() || (sIdx >= 0 ? `Section #${sIdx + 1}` : "Form Designer");
    const fIdx = path[3] === "fields" && typeof path[4] === "number" ? path[4] : -1;
    let field = fIdx >= 0 ? section?.fields?.[fIdx] : undefined;
    // Descend into object groups: `...fields.2.PROP.1.LABEL` targets inner field 1
    let keyStart = 5;
    while (field && path[keyStart] === "PROP" && typeof path[keyStart + 1] === "number") {
      field = field.PROP?.[path[keyStart + 1] as number];
      keyStart += 2;
    }

    return {
      id: `formDesigner-${path.join(".")}-${idx}`,
      tab: "formDesigner",
      fieldKey: field
        ? path.slice(keyStart).join(".") || "NAME"
        : path.slice(3).join(".") || "sections",
      sectionId: section?.id,
      fieldId: field ? fieldIdOf(field, fIdx) : undefined,
      message: `${secDisplay}: ${issue.message}`,
    };
  });
}

/**
 * Validates a FORM.CONFIG draft against the save rules (`formConfigSaveSchema`, the same check
 * `/api/proxy` runs on SFC). With the target model, it also flags fields the model no longer has.
 */
export function validateFormConfig(
  formData: FormConfigRecord,
  model?: ModelConfigRecord | null,
): FormConfigValidationError[] {
  const parsed = formConfigSaveSchema.safeParse(formData);
  const issues = parsed.success
    ? []
    : mapZodIssuesToFcValidationErrors(parsed.error.issues, formData);
  if (!model) return issues;

  const modelNames = new Set(model.PROPERTIES.map((p) => p.NAME.toLowerCase()));
  (formData.frmElements?.sections ?? []).forEach((section, sIdx) => {
    (section.fields ?? []).forEach((field, fIdx) => {
      const name = (field.NAME || "").trim();
      if (!name || modelNames.has(name.toLowerCase())) return;
      issues.push({
        id: `formDesigner-model-${section.id}-${fIdx}`,
        tab: "formDesigner",
        fieldKey: "NAME",
        sectionId: section.id,
        fieldId: fieldIdOf(field, fIdx),
        message: `${section.title?.trim() || `Section #${sIdx + 1}`}: Field "${name}" is not in model ${model.TABLENAME}`,
      });
    });
  });
  return issues;
}
