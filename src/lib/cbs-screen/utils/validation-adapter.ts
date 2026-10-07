import type { z } from "zod";
import type { CbsScreenValidationError } from "../types";

/**
 * Generalized mapper from ZodIssue list to CBS tabbed error list
 */
export function mapZodIssuesToTabs<TTab extends string = string>(
  issues: z.ZodIssue[],
  tabResolver: (path: (string | number)[], issue: z.ZodIssue) => TTab,
): CbsScreenValidationError<TTab>[] {
  return issues.map((issue, idx) => {
    const stringOrNumberPath = issue.path.map((p) => (typeof p === "symbol" ? p.toString() : p));
    const tab = tabResolver(stringOrNumberPath, issue);
    const fieldKey = stringOrNumberPath.join(".") || "Record";
    return {
      id: `err_${idx}_${fieldKey}`,
      tab,
      fieldKey,
      message: issue.message,
    };
  });
}
