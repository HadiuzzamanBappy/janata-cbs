/**
 * @fileoverview Validation error mapping and business rules for MODEL.CONFIG.
 * Translates Zod schema validation errors and domain checks to tab-aware
 * screen validation items with exact property SN and field targets.
 *
 * @module features/system/model-config/hooks/mc-validation
 */

import type { ZodError } from "zod";
import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import {
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigRecordSchema,
} from "@/lib/data-schemas";

export type ModelConfigTabKey = "general" | "properties";

export interface ModelValidationErrorItem extends CbsScreenValidationError<ModelConfigTabKey> {
  readonly sn?: string;
}

/**
 * Transforms raw Zod validation issues into user-navigable ModelValidationErrorItems
 * with tab location, fieldKey, and property SN metadata (including nested sub-properties).
 */
export function mapZodIssuesToValidationErrors(
  issues: ZodError["issues"],
  properties: ModelProperty[],
): ModelValidationErrorItem[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    let tab: ModelConfigTabKey = "general";
    let sn: string | undefined;
    let fieldKey = String(path[path.length - 1] || "unknown");

    if (path[0] === "PROPERTIES" && typeof path[1] === "number") {
      tab = "properties";
      const targetProp = properties[path[1] as number];

      // Support nested sub-properties inside JsonArray (e.g. PROPERTIES.0.PROP.1.NAME)
      if (path[2] === "PROP" && typeof path[3] === "number") {
        const subProp = targetProp?.PROP?.[path[3] as number];
        sn = subProp?.SN;
        fieldKey = String(path[4] || "NAME");
      } else {
        sn = targetProp?.SN;
        if (path[2] !== undefined) {
          fieldKey = String(path[2]);
        }
      }
    } else if (path[0] === "auditData") {
      tab = "general";
    }

    const labelPrefix = sn ? `Property #${sn}` : "General";
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
 * Validates the entire ModelConfigRecord against canonical Zod schema and CBS domain rules.
 */
export function validateModelConfig(formData: ModelConfigRecord): ModelValidationErrorItem[] {
  const issues: ModelValidationErrorItem[] = [];

  // 1. Zod schema validation
  const validation = modelConfigRecordSchema.safeParse(formData);
  if (!validation.success) {
    issues.push(
      ...mapZodIssuesToValidationErrors(validation.error.issues, formData.PROPERTIES || []),
    );
  }

  // 2. Domain checks: At least one property required
  const props = formData.PROPERTIES || [];
  if (props.length === 0) {
    issues.push({
      id: "err_no_properties",
      tab: "properties",
      fieldKey: "PROPERTIES",
      message: "Properties: At least one column/property must be configured in the data dictionary",
    });
  }

  return issues;
}
