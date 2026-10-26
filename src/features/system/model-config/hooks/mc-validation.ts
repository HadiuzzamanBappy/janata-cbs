import type { ZodError } from "zod";
import type { ModelProperty, ValidationErrorItem } from "@/lib/data-schemas/model-config-schema";

/**
 * Transforms raw Zod validation issues into user-navigable ValidationErrorItems
 * with tab location and field SN metadata.
 */
export function mapZodIssuesToValidationErrors(
  issues: ZodError["issues"],
  properties: ModelProperty[],
): ValidationErrorItem[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    let tab: "general" | "properties" | "audit" = "general";
    let sn: string | undefined;
    const fieldKey = String(path[path.length - 1] || "unknown");

    if ((path[0] === "PROPERTIES" || path[0] === "properties") && typeof path[1] === "number") {
      tab = "properties";
      let currentProps: ModelProperty[] | undefined = properties;
      let targetProp: ModelProperty | undefined;
      for (let i = 1; i < path.length; i++) {
        if (typeof path[i] === "number" && currentProps) {
          targetProp = currentProps[path[i] as number];
          currentProps = targetProp?.PROP;
        }
      }
      sn = targetProp?.SN;
    } else if (path[0] === "auditData" || path[0] === "AUDITDATA") {
      tab = "audit";
    }

    const labelPrefix = sn ? `Property #${sn}` : "General";
    return {
      id: `${tab}-${sn || "root"}-${fieldKey}-${idx}`,
      tab,
      sn,
      fieldKey,
      message: `${labelPrefix}: ${issue.message}`,
    };
  });
}
