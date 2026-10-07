import type {
  MenuCatalogRecord,
  MenuValidationErrorItem,
} from "@/lib/schemas/menu-catalog-schema";

export function mapMenuZodIssues(
  issues: import("zod").ZodIssue[],
): MenuValidationErrorItem[] {
  return issues.map((issue, idx) => {
    const fieldKey = String(issue.path[issue.path.length - 1] || "unknown");
    const tab: "general" | "audit" = issue.path[0] === "auditData" ? "audit" : "general";
    return {
      id: `${tab}-${fieldKey}-${idx}`,
      tab,
      fieldKey,
      message: issue.message,
    };
  });
}

export function serializeMenuCatalogToWire(record: MenuCatalogRecord): MenuCatalogRecord {
  return record;
}
