/**
 * @fileoverview Validation error mapping and business rules for FORM.CONFIG.
 * Translates Zod schema validation errors and domain checks to tab-aware
 * screen validation items with exact section and field targets.
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
  readonly sectionId?: string;
  readonly fieldId?: string;
}

/**
 * Transforms Zod validation issues into user-navigable FormConfigValidationError items.
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
      fieldKey: path.join("."),
      message: issue.message,
    };
  });
}

/**
 * Performs business-level and schema validation on the FormConfig record across all tabs.
 */
export function validateFormConfig(formData: FormConfigRecord): FormConfigValidationError[] {
  const issues: FormConfigValidationError[] = [];
  const seenIds = new Set<string>();

  const addIssue = (item: FormConfigValidationError) => {
    const dedupeKey = item.id;
    if (!seenIds.has(dedupeKey)) {
      seenIds.add(dedupeKey);
      issues.push(item);
    }
  };

  // 1. Zod schema validation
  const parsed = formConfigRecordSchema.safeParse(formData);
  if (!parsed.success) {
    const zodIssues = mapZodIssuesToFcValidationErrors(parsed.error.issues);
    zodIssues.forEach(addIssue);
  }

  // 2. Business-level domain checks: General Tab
  const title = typeof formData.title === "string" ? formData.title.trim() : "";
  if (!title) {
    addIssue({
      id: "err_missing_title",
      tab: "general",
      fieldKey: "title",
      message: "General: Form title is required",
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
        addIssue({
          id: `err_routine_${group.key}_${idx}_name`,
          tab: "general",
          fieldKey: `frmRoutine.${group.key}.${idx}.routineName`,
          message: `${group.label} #${idx + 1}: Routine Name is required`,
        });
      }
    });
  }

  // 3. Business-level domain checks: Form Designer Tab
  const sections = formData.frmElements?.sections || [];
  if (sections.length === 0) {
    addIssue({
      id: "err_no_sections",
      tab: "formDesigner",
      fieldKey: "frmElements.sections",
      message: "Form Designer: At least one section must be configured",
    });
    return issues;
  }

  const seenFieldNames = new Map<string, string>(); // lowercase name -> section title

  sections.forEach((section, sIdx) => {
    const secTitle = (section.title || "").trim();
    const secDisplay = secTitle || `Section #${sIdx + 1}`;

    if (!secTitle) {
      addIssue({
        id: `err_sec_${section.id || sIdx}_title`,
        tab: "formDesigner",
        fieldKey: "title",
        sectionId: section.id,
        message: `Section #${sIdx + 1}: Section Title is required`,
      });
    }

    const fields = section.fields || [];
    if (fields.length === 0) {
      addIssue({
        id: `err_sec_${section.id || sIdx}_empty`,
        tab: "formDesigner",
        fieldKey: "fields",
        sectionId: section.id,
        message: `${secDisplay}: At least one field is required`,
      });
    }

    fields.forEach((field, fIdx) => {
      const fName = (field.NAME || "").trim();
      const fieldIdentifier = String(field.SN || fName || `f_${fIdx}`);

      if (!fName) {
        addIssue({
          id: `err_field_${section.id}_${fieldIdentifier}_name`,
          tab: "formDesigner",
          fieldKey: "NAME",
          sectionId: section.id,
          fieldId: fieldIdentifier,
          message: `${secDisplay}: Field #${fIdx + 1} Name (NAME) is required`,
        });
      } else {
        const lowerName = fName.toLowerCase();
        if (seenFieldNames.has(lowerName)) {
          const prevSec = seenFieldNames.get(lowerName);
          addIssue({
            id: `err_field_dup_${lowerName}`,
            tab: "formDesigner",
            fieldKey: "NAME",
            sectionId: section.id,
            fieldId: fieldIdentifier,
            message: `${secDisplay}: Duplicate field name "${fName}" (already used in ${prevSec})`,
          });
        } else {
          seenFieldNames.set(lowerName, secDisplay);
        }
      }

      const fLabel = (field.LABEL || "").trim();
      if (!fLabel) {
        addIssue({
          id: `err_field_${section.id}_${fieldIdentifier}_label`,
          tab: "formDesigner",
          fieldKey: "LABEL",
          sectionId: section.id,
          fieldId: fieldIdentifier,
          message: `${secDisplay}: Field "${fName || `#${fIdx + 1}`}" Label is required`,
        });
      }
    });
  });

  return issues;
}
