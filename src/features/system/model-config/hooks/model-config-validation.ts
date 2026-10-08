import type {
  ModelProperty,
  ValidationErrorItem,
} from "@/lib/schemas/model-config-schema";

/**
 * Transforms raw Zod validation issues into user-navigable ValidationErrorItems
 * with tab location and field SN metadata.
 */
export function mapZodIssuesToValidationErrors(
  issues: import("zod").ZodIssue[],
  properties: ModelProperty[],
): ValidationErrorItem[] {
  return issues.map((issue, idx) => {
    const path = issue.path;
    let tab: "general" | "fields" | "audit" = "general";
    let sn: string | undefined;
    const fieldKey = String(path[path.length - 1] || "unknown");

    if (path[0] === "properties" && typeof path[1] === "number") {
      tab = "fields";
      const propIndex = path[1];
      const targetProp = properties[propIndex];
      sn = targetProp?.sn;
    } else if (path[0] === "auditData") {
      tab = "audit";
    }

    const labelPrefix = sn ? `Field #${sn}` : "General";
    return {
      id: `${tab}-${sn || "root"}-${fieldKey}-${idx}`,
      tab,
      sn,
      fieldKey,
      message: `${labelPrefix}: ${issue.message}`,
    };
  });
}
