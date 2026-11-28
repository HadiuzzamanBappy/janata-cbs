/**
 * @fileoverview Validation error mapping and business rules for MODEL.CONFIG.
 * Translates Zod schema validation errors and domain checks to tab-aware
 * screen validation items with exact property SN and field targets.
 *
 * @module features/system/model-config/hooks/mc-validation
 */

import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import {
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigSaveSchema,
  savedModelIssues,
} from "@/lib/data-schemas";

export type ModelConfigTabKey = "general" | "properties";

export interface ModelValidationErrorItem extends CbsScreenValidationError<ModelConfigTabKey> {
  readonly sn?: string;
}

/** A save-rule issue: a Zod issue, or a `SavedModelIssue`. */
interface RuleIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/**
 * Transforms rule issues into user-navigable ModelValidationErrorItems
 * with tab location, fieldKey, and property SN metadata (including nested sub-properties).
 */
function mapIssuesToValidationErrors(
  issues: readonly RuleIssue[],
  properties: ModelProperty[],
): ModelValidationErrorItem[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    let tab: ModelConfigTabKey = "general";
    let sn: string | undefined;
    // General-tab keys are the full form path (IDDEF.SEQUENCELENGTH), so the field highlights
    let fieldKey = path.map(String).join(".") || "unknown";

    if (path[0] === "PROPERTIES") {
      tab = "properties";
      const targetProp = typeof path[1] === "number" ? properties[path[1]] : undefined;

      // Support nested sub-properties inside Array (e.g. PROPERTIES.0.PROP.1.NAME)
      if (path[2] === "PROP" && typeof path[3] === "number") {
        sn = targetProp?.PROP?.[path[3]]?.SN;
        fieldKey = String(path[4] || "NAME");
      } else {
        sn = targetProp?.SN;
        if (path[2] !== undefined) {
          fieldKey = String(path[2]);
        }
      }
    }

    const labelPrefix = sn ? `Property #${sn}` : tab === "properties" ? "Properties" : "General";
    return {
      id: `${tab}-${sn || "root"}-${fieldKey}-${idx}`,
      tab,
      sn,
      nodeId: sn,
      fieldKey,
      message: `${labelPrefix}: ${issue.message}`,
    };
  });
}

/**
 * Validates a MODEL.CONFIG draft against the save rules (`modelConfigSaveSchema`) and, for a
 * model already stored, the saved-model rules (`savedModelIssues`) against the record the screen
 * loaded. `/api/proxy` runs both on every PUT to MODEL.CONFIG.
 */
export function validateModelConfig(
  formData: ModelConfigRecord,
  savedRecord: ModelConfigRecord | undefined,
): ModelValidationErrorItem[] {
  const validation = modelConfigSaveSchema.safeParse(formData);
  return mapIssuesToValidationErrors(
    [
      ...(validation.success ? [] : validation.error.issues),
      ...(savedRecord ? savedModelIssues(formData, savedRecord) : []),
    ],
    formData.PROPERTIES || [],
  );
}
