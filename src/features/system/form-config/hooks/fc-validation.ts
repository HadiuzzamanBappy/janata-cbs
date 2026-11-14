/**
 * @fileoverview Validation error mapping and business rules for FORM.CONFIG.
 * Translates Zod schema validation errors and routine checks to tab-aware
 * screen validation items.
 *
 * @module features/system/form-config/hooks/fc-validation
 */

import type { ZodError } from "zod";
import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import { type FormConfigRecord, formConfigRecordSchema } from "@/lib/data-schemas";

export type FormConfigTabKey = "general" | "formDesigner" | "preview" | "json";

export interface FormConfigValidationError extends CbsScreenValidationError<FormConfigTabKey> {
  readonly id: string;
  readonly tab: FormConfigTabKey;
  readonly fieldKey: string;
  readonly message: string;
}

/**
 * Transforms Zod validation issues or manual validation checks into
 * user-navigable FormConfigValidationError items with tab targets.
 */
export function mapZodIssuesToFcValidationErrors(
  issues: ZodError["issues"],
): FormConfigValidationError[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    let tab: FormConfigValidationError["tab"] = "general";
    const fieldKey = String(path[path.length - 1] || "unknown");

    if (path[0] === "frmRoutine") {
      tab = "general";
    } else if (path[0] === "frmElements") {
      tab = "formDesigner";
    } else if (path[0] === "auditData") {
      tab = "general";
    }

    return {
      id: `${tab}-${fieldKey}-${idx}`,
      tab,
      fieldKey,
      message: issue.message,
    };
  });
}

/**
 * Performs business-level and schema validation on the FormConfig record.
 */
export function validateFormConfig(formData: FormConfigRecord): FormConfigValidationError[] {
  const issues: FormConfigValidationError[] = [];

  // 1. Zod schema validation
  const parsed = formConfigRecordSchema.safeParse(formData);
  if (!parsed.success) {
    issues.push(...mapZodIssuesToFcValidationErrors(parsed.error.issues));
  }

  // 2. Business-level domain checks
  const title = typeof formData.title === "string" ? formData.title.trim() : "";
  if (!title && !issues.some((i) => i.fieldKey === "title")) {
    issues.push({
      id: "err_missing_title",
      tab: "general",
      fieldKey: "title",
      message: "Form title is required",
    });
  }

  // Validate that any configured routines have a Routine Name
  const routineGroups = [
    { key: "rtnValidate" as const, label: "Validation Routine" },
    { key: "rtnBeforeAuth" as const, label: "Before-Auth Routine" },
    { key: "rtnAfterAuth" as const, label: "After-Auth Routine" },
  ];

  for (const group of routineGroups) {
    const list = formData.frmRoutine?.[group.key] || [];
    list.forEach((item, idx) => {
      const name = (item.routineName || "").trim();
      if (!name) {
        issues.push({
          id: `err_routine_${group.key}_${idx}_name`,
          tab: "general",
          fieldKey: `frmRoutine.${group.key}.${idx}.routineName`,
          message: `${group.label} #${idx + 1}: Routine Name is required`,
        });
      }
    });
  }

  return issues;
}
