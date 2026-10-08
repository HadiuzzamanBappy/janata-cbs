"use client";

import type { z } from "zod";
import type { UserGroupValidationError } from "@/lib/schemas/user-group-schema";

export function mapUserGroupZodIssues(
  issues: z.ZodIssue[],
): UserGroupValidationError[] {
  return issues.map((issue) => {
    const fieldKey = issue.path.join(".") || "form";
    const pathHead = issue.path[0];

    let tab: UserGroupValidationError["tab"] = "general";
    if (pathHead === "menuIds" || pathHead === "roleIds") {
      tab = "matrix";
    }

    return {
      id: `${fieldKey}-${issue.code}-${Math.random().toString(36).substring(2, 6)}`,
      fieldKey,
      message: issue.message,
      tab,
    };
  });
}
