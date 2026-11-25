import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-parsers";
import { type InquiryConfigRecord, inquiryConfigSaveSchema } from "@/lib/data-schemas";

export type InquiryConfigTabKey =
  | "general"
  | "filters"
  | "columns"
  | "actions"
  | "preview"
  | "json";

export interface InquiryValidationErrorItem extends CbsScreenValidationError<InquiryConfigTabKey> {
  readonly id: string;
  readonly tab: InquiryConfigTabKey;
  readonly fieldKey: string;
  readonly message: string;
  readonly itemIndex?: number;
}

/**
 * Validates an INQUIRY.CONFIG draft against the save rules (`inquiryConfigSaveSchema`, the same
 * check `/api/proxy` runs on save). Columns and filters may come from the target model or be
 * custom/computed fields.
 */
export function validateInquiryConfig(draft: InquiryConfigRecord): InquiryValidationErrorItem[] {
  const formData = sanitizeInquiryConfigRecord(draft);
  const issues: InquiryValidationErrorItem[] = [];
  const addIssue = (item: InquiryValidationErrorItem) => issues.push(item);

  // 1. Save rules
  const parseResult = inquiryConfigSaveSchema.safeParse(formData);
  if (!parseResult.success) {
    parseResult.error.issues.forEach((issue, idx) => {
      const pathStr = issue.path.join(".");
      const firstSegment = String(issue.path[0] || "");
      const itemIndex = typeof issue.path[1] === "number" ? issue.path[1] : undefined;

      let tab: InquiryConfigTabKey = "general";
      let labelPrefix = "General";

      if (firstSegment === "INQSelectField") {
        tab = "filters";
        if (itemIndex !== undefined) {
          const filter = formData.INQSelectField?.[itemIndex];
          const name = filter?.selectFieldDisplay || filter?.selectFieldName;
          labelPrefix = `Filter #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        }
      } else if (firstSegment === "INQDef") {
        tab = "columns";
        if (itemIndex !== undefined) {
          const col = formData.INQDef?.[itemIndex];
          const name = col?.fieldDisplay || col?.fieldName;
          labelPrefix = `Column #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        }
      } else if (firstSegment === "INQCmds") {
        tab = "actions";
        if (itemIndex !== undefined) {
          const act = formData.INQCmds?.[itemIndex];
          labelPrefix = `Action #${itemIndex + 1}${act?.cmdButton ? ` (${act.cmdButton})` : ""}`;
        }
      }

      addIssue({
        id: `zod-${idx}-${pathStr}`,
        tab,
        fieldKey: pathStr,
        message: `${labelPrefix}: ${issue.message}`,
        itemIndex,
      });
    });
  }

  return issues;
}
