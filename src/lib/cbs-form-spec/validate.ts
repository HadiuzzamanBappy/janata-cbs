import {
  type FormConfigRecord,
  type FormWidgetType,
  isWidgetCompatible,
  type ModelConfigRecord,
} from "@/lib/data-schemas";

/* -------------------------------------------------------------------------- */
/* Layout Validation Issue Contracts                                          */
/* -------------------------------------------------------------------------- */

export type FormLayoutIssueCode =
  | "MISSING_PROPERTY"
  | "ARCHIVED_PROPERTY"
  | "INCOMPATIBLE_WIDGET"
  | "STALE_MODEL_VERSION";

export interface FormLayoutIssue {
  severity: "error" | "warning";
  code: FormLayoutIssueCode;
  fieldKey?: string;
  sectionId?: string;
  message: string;
}

/**
 * Validates a FormConfigRecord layout against its bound ModelConfigRecord definition.
 * Checks for:
 * 1. Target model name / version alignment.
 * 2. References to properties that do not exist in the model.
 * 3. References to properties that have been ARCHIVED in the model.
 * 4. Incompatible visual widgets assigned to typed model properties.
 */
export function validateLayoutAgainstModel(
  model: ModelConfigRecord,
  layout: FormConfigRecord,
): FormLayoutIssue[] {
  const issues: FormLayoutIssue[] = [];
  const modelCode = (model.tableName || model.recordId || "").toUpperCase();
  const targetCode = String(layout.targetModel || "").toUpperCase();

  // 1. Model Target & Version Check
  if (targetCode !== modelCode) {
    issues.push({
      severity: "error",
      code: "STALE_MODEL_VERSION",
      message: `Layout target model "${layout.targetModel}" does not match model code "${modelCode}"`,
    });
  }

  // Build property lookup index
  const propertyMap = new Map((model.properties || []).map((p) => [p.name.toLowerCase(), p]));

  const sections = layout.presentation?.sections || [];

  for (const section of sections) {
    for (const field of section.fields || []) {
      const propKey = field.fieldKey.toLowerCase();
      const modelProp = propertyMap.get(propKey);

      // 2. Missing property check
      if (!modelProp) {
        issues.push({
          severity: "error",
          code: "MISSING_PROPERTY",
          fieldKey: field.fieldKey,
          sectionId: section.id,
          message: `Field "${field.fieldKey}" references property "${field.fieldKey}" which does not exist in model "${modelCode}"`,
        });
        continue;
      }

      // 3. Archived property check
      if (modelProp.status === "ARCHIVED") {
        issues.push({
          severity: "warning",
          code: "ARCHIVED_PROPERTY",
          fieldKey: field.fieldKey,
          sectionId: section.id,
          message: `Field "${field.fieldKey}" references ARCHIVED property "${modelProp.name}" and will be omitted at runtime`,
        });
        continue;
      }

      // 4. Widget compatibility check
      const widget = field.widget as FormWidgetType;
      if (!isWidgetCompatible(modelProp.type, widget)) {
        issues.push({
          severity: "error",
          code: "INCOMPATIBLE_WIDGET",
          fieldKey: field.fieldKey,
          sectionId: section.id,
          message: `Widget "${widget}" is incompatible with model property "${modelProp.name}" of type "${modelProp.type}"`,
        });
      }
    }
  }

  return issues;
}
