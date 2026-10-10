"use client";

import type { z } from "zod";
import { mapZodIssuesToTabs } from "@/lib/cbs-screen";
import type { MenuDesignerValidationError } from "@/lib/data-schemas/menu-designer-schema";

export function mapMenuDesignerZodIssues(issues: z.ZodIssue[]): MenuDesignerValidationError[] {
  return mapZodIssuesToTabs<"general" | "canvas" | "audit">(issues, (path) => {
    const head = path[0];
    if (head === "menuTree") return "canvas";
    if (head === "auditData") return "audit";
    return "general";
  });
}
