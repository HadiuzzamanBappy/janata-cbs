"use client";

import type { z } from "zod";
import { mapZodIssuesToTabs } from "@/lib/cbs-screen";
import type { UserGroupValidationError } from "@/lib/schemas/user-group-schema";

export function mapUserGroupZodIssues(issues: z.ZodIssue[]): UserGroupValidationError[] {
  return mapZodIssuesToTabs<"general" | "matrix" | "audit">(issues, (path) => {
    const head = path[0];
    if (head === "menuIds" || head === "roleIds") return "matrix";
    if (head === "auditData") return "audit";
    return "general";
  });
}
