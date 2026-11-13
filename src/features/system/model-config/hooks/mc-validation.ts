import type { ZodError } from "zod";
import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export type ModelConfigTabKey = "general" | "properties";

export interface ModelValidationErrorItem extends CbsScreenValidationError<ModelConfigTabKey> {
  readonly sn?: string;
}

/**
 * Transforms raw Zod validation issues into user-navigable ModelValidationErrorItems
 * with tab location and field SN metadata.
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
      sn = targetProp?.SN;
      if (path[2] === "PARAMETER") {
        fieldKey = path[3] !== undefined ? `PARAMETER.${String(path[3])}` : "PARAMETER";
      } else if (path[2] !== undefined) {
        fieldKey = String(path[2]);
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
