import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-parsers";
import {
  type InquiryConfigRecord,
  inquiryConfigSaveSchema,
  type ModelConfigRecord,
} from "@/lib/data-schemas";

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

/** Row keys every inquiry row carries, whatever its model. */
const ROW_META_FIELDS: ReadonlySet<string> = new Set(["recordid", "id", "auditdata"]);

/**
 * Validates an INQUIRY.CONFIG draft against the save rules (`inquiryConfigSaveSchema`, the same
 * check `/api/proxy` runs on save). With the target model, it also flags filters and columns the
 * model doesn't have.
 */
export function validateInquiryConfig(
  draft: InquiryConfigRecord,
  model?: ModelConfigRecord | null,
): InquiryValidationErrorItem[] {
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

  // 2. Target model: every filter and column must be a model property
  if (model) {
    const modelNames = new Set(model.PROPERTIES.map((p) => p.NAME.toLowerCase()));
    const isKnown = (name: string) => {
      const root = name.trim().split(".")[0].toLowerCase();
      return !root || modelNames.has(root) || ROW_META_FIELDS.has(root);
    };
    formData.INQSelectField.forEach((filter, idx) => {
      if (isKnown(filter.selectFieldName)) return;
      addIssue({
        id: `model-sel-${idx}`,
        tab: "filters",
        fieldKey: `INQSelectField.${idx}.selectFieldName`,
        message: `Filter #${idx + 1}: "${filter.selectFieldName}" is not in model ${model.TABLENAME}`,
        itemIndex: idx,
      });
    });
    formData.INQDef.forEach((col, idx) => {
      if (isKnown(col.fieldName)) return;
      addIssue({
        id: `model-col-${idx}`,
        tab: "columns",
        fieldKey: `INQDef.${idx}.fieldName`,
        message: `Column #${idx + 1}: "${col.fieldName}" is not in model ${model.TABLENAME}`,
        itemIndex: idx,
      });
    });
  }

  return issues;
}
