import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import {
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";

export type InquiryConfigTabKey =
  | "general"
  | "selection"
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
  readonly subSegment?: "columns" | "actions";
}

/**
 * Validates the Inquiry Configuration record across all tabs (General, Selection, Table)
 * returning user-navigable error items aligned with CbsScreenScaffold and Model Config standards.
 */
export function validateInquiryConfig(formData: InquiryConfigRecord): InquiryValidationErrorItem[] {
  const issues: InquiryValidationErrorItem[] = [];
  const seenKeys = new Set<string>();

  const addIssue = (item: InquiryValidationErrorItem) => {
    const dedupeKey = `${item.tab}:${item.fieldKey}`;
    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey);
      issues.push(item);
    }
  };

  // 1. Zod Schema Validation
  const parseResult = inquiryConfigRecordSchema.safeParse(formData);
  if (!parseResult.success) {
    parseResult.error.issues.forEach((issue, idx) => {
      const pathStr = issue.path.join(".");
      const firstSegment = String(issue.path[0] || "");
      const itemIndex = typeof issue.path[1] === "number" ? issue.path[1] : undefined;

      let tab: InquiryConfigTabKey = "general";
      let labelPrefix = "General";

      if (firstSegment === "INQSelectField") {
        tab = "selection";
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

  // 2. Domain Business Rules: General Tab
  if (!formData.INQInfo?.controllerName?.trim()) {
    addIssue({
      id: "err-gen-controller",
      tab: "general",
      fieldKey: "INQInfo.controllerName",
      message: "General: Target Table / Controller is required",
    });
  }
  if (!formData.INQInfo?.description?.trim()) {
    addIssue({
      id: "err-gen-description",
      tab: "general",
      fieldKey: "INQInfo.description",
      message: "General: Description is required",
    });
  }

  // 3. Domain Business Rules: Selection Tab
  const seenFilterNames = new Set<string>();
  (formData.INQSelectField || []).forEach((filter, idx) => {
    const fName = filter.selectFieldName?.trim();
    if (!fName) {
      addIssue({
        id: `err-sel-${idx}-name`,
        tab: "selection",
        fieldKey: `INQSelectField.${idx}.selectFieldName`,
        message: `Filter #${idx + 1}: Field Key is required`,
        itemIndex: idx,
      });
    } else if (seenFilterNames.has(fName.toLowerCase())) {
      addIssue({
        id: `err-sel-dup-${idx}`,
        tab: "selection",
        fieldKey: `INQSelectField.${idx}.selectFieldName`,
        message: `Filter #${idx + 1}: Duplicate filter field key "${fName}"`,
        itemIndex: idx,
      });
    } else {
      seenFilterNames.add(fName.toLowerCase());
    }

    if (!filter.selectFieldDisplay?.trim()) {
      addIssue({
        id: `err-sel-${idx}-display`,
        tab: "selection",
        fieldKey: `INQSelectField.${idx}.selectFieldDisplay`,
        message: `Filter #${idx + 1}: Display Label is required`,
        itemIndex: idx,
      });
    }
  });

  // 4. Domain Business Rules: Columns & Actions Tab
  const columns = formData.INQDef || [];
  if (columns.length === 0) {
    addIssue({
      id: "err-table-no-columns",
      tab: "columns",
      fieldKey: "INQDef",
      message: "Columns: At least one column must be configured",
    });
  }

  const seenColNames = new Set<string>();
  columns.forEach((col, idx) => {
    const cName = col.fieldName?.trim();
    if (!cName) {
      addIssue({
        id: `err-col-${idx}-name`,
        tab: "columns",
        fieldKey: `INQDef.${idx}.fieldName`,
        message: `Column #${idx + 1}: Field Name is required`,
        itemIndex: idx,
      });
    } else if (seenColNames.has(cName.toLowerCase())) {
      addIssue({
        id: `err-col-dup-${idx}`,
        tab: "columns",
        fieldKey: `INQDef.${idx}.fieldName`,
        message: `Column #${idx + 1}: Duplicate column field name "${cName}"`,
        itemIndex: idx,
      });
    } else {
      seenColNames.add(cName.toLowerCase());
    }

    if (!col.fieldDisplay?.trim()) {
      addIssue({
        id: `err-col-${idx}-display`,
        tab: "columns",
        fieldKey: `INQDef.${idx}.fieldDisplay`,
        message: `Column #${idx + 1}: Display Header is required`,
        itemIndex: idx,
      });
    }
  });

  (formData.INQCmds || []).forEach((act, idx) => {
    if (!act.cmdButton?.trim()) {
      addIssue({
        id: `err-act-${idx}-btn`,
        tab: "actions",
        fieldKey: `INQCmds.${idx}.cmdButton`,
        message: `Action #${idx + 1}: Button label is required`,
        itemIndex: idx,
      });
    }
    if (!act.cmdFor?.trim()) {
      addIssue({
        id: `err-act-${idx}-for`,
        tab: "actions",
        fieldKey: `INQCmds.${idx}.cmdFor`,
        message: `Action #${idx + 1}: Command target is required`,
        itemIndex: idx,
      });
    }
  });

  return issues;
}
