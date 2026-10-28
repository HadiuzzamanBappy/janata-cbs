import type { ZodError } from "zod";

export interface FormConfigValidationError {
  id: string;
  tab: "general" | "formRoutine" | "formDesigner" | "preview" | "audit" | "json";
  fieldKey: string;
  message: string;
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
      tab = "formRoutine";
    } else if (path[0] === "frmElements") {
      tab = "formDesigner";
    } else if (path[0] === "auditData") {
      tab = "audit";
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
 * Performs business-level validation on the FormConfig record.
 */
export function validateFormConfig(formData: { title?: string }): FormConfigValidationError[] {
  const issues: FormConfigValidationError[] = [];
  const title = typeof formData.title === "string" ? formData.title.trim() : "";
  if (!title) {
    issues.push({
      id: "err_missing_title",
      tab: "general",
      fieldKey: "title",
      message: "Form title is required",
    });
  }
  return issues;
}

