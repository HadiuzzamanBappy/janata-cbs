import type { z } from "zod";
import { mapZodIssuesToTabs } from "@/lib/cbs-screen";
import type { MenuCatalogRecord, MenuValidationErrorItem } from "@/lib/schemas/menu-catalog-schema";

export function mapMenuZodIssues(issues: z.ZodIssue[]): MenuValidationErrorItem[] {
  return mapZodIssuesToTabs<"general" | "audit">(issues, (path) => {
    return path[0] === "auditData" ? "audit" : "general";
  });
}

export function serializeMenuCatalogToWire(record: MenuCatalogRecord): MenuCatalogRecord {
  return record;
}
