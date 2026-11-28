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
  modelConfigSaveSchema,
} from "@/lib/data-schemas";
import type { CommittedPropertyLookup } from "./use-mc-property-ops";

export type ModelConfigTabKey = "general" | "properties";

export interface ModelValidationErrorItem extends CbsScreenValidationError<ModelConfigTabKey> {
  readonly sn?: string;
}

/**
 * Transforms raw Zod validation issues into user-navigable ModelValidationErrorItems
 * with tab location, fieldKey, and property SN metadata (including nested sub-properties).
 */
function mapZodIssuesToValidationErrors(
  issues: ZodError["issues"],
  properties: ModelProperty[],
): ModelValidationErrorItem[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    let tab: ModelConfigTabKey = "general";
    let sn: string | undefined;
    // General-tab keys are the full form path (IDDEF.SEQUENCELENGTH), so the field highlights
    let fieldKey = path.join(".") || "unknown";

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
 * Rules for a column already saved to the database, which existing rows depend on: its LENGTH
 * may only grow (a shorter one truncates stored values) and it can't become required (stored
 * rows may hold nulls).
 */
function committedColumnErrors(
  properties: readonly ModelProperty[],
  committedProperty: CommittedPropertyLookup,
): ModelValidationErrorItem[] {
  const errors: ModelValidationErrorItem[] = [];
  const check = (prop: ModelProperty) => {
    const saved = committedProperty(prop.SN);
    if (!saved) return;
    const add = (fieldKey: string, message: string) =>
      errors.push({
        id: `properties-${prop.SN}-${fieldKey}-committed`,
        tab: "properties",
        sn: prop.SN,
        nodeId: prop.SN,
        fieldKey,
        message: `Property #${prop.SN}: ${message}`,
      });
    if (Number(prop.LENGTH) < Number(saved.LENGTH)) {
      add("LENGTH", `Length can't be shorter than the saved ${saved.LENGTH}`);
    }
    if (prop.REQUIRED && !saved.REQUIRED) {
      add("REQUIRED", "A saved optional column can't become required");
    }
  };
  for (const prop of properties) {
    check(prop);
    for (const sub of prop.PROP ?? []) check(sub);
  }
  return errors;
}

/**
 * Validates a MODEL.CONFIG draft against the save rules (`modelConfigSaveSchema`, the same check
 * `/api/proxy` runs on every PUT to MODEL.CONFIG), plus the rules for already-saved columns,
 * which need the saved copy and so run only here.
 */
export function validateModelConfig(
  formData: ModelConfigRecord,
  committedProperty: CommittedPropertyLookup,
): ModelValidationErrorItem[] {
  const properties = formData.PROPERTIES || [];
  const validation = modelConfigSaveSchema.safeParse(formData);
  return [
    ...(validation.success
      ? []
      : mapZodIssuesToValidationErrors(validation.error.issues, properties)),
    ...committedColumnErrors(properties, committedProperty),
  ];
}
