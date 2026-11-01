import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import {
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";

export type InquiryConfigTabKey = "general" | "selection" | "table" | "preview" | "json";

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
    for (let idx = 0; idx < parseResult.error.issues.length; idx++) {
      const issue = parseResult.error.issues[idx];
      const pathStr = issue.path.join(".");
      const firstSegment = String(issue.path[0] || "");

      let tab: InquiryConfigTabKey = "general";
      let itemIndex: number | undefined;
      let subSegment: "columns" | "actions" | undefined;
      let labelPrefix = "General";

      if (firstSegment === "INQSelectField") {
        tab = "selection";
        if (typeof issue.path[1] === "number") {
          itemIndex = issue.path[1];
          const filter = formData.INQSelectField?.[itemIndex];
          const name = filter?.selectFieldDisplay || filter?.selectFieldName;
          labelPrefix = `Filter #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        }
      } else if (firstSegment === "INQDef") {
        tab = "table";
        subSegment = "columns";
        if (typeof issue.path[1] === "number") {
          itemIndex = issue.path[1];
          const col = formData.INQDef?.[itemIndex];
          const name = col?.fieldDisplay || col?.fieldName;
          labelPrefix = `Column #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        }
      } else if (firstSegment === "INQCmds") {
        tab = "table";
        subSegment = "actions";
        if (typeof issue.path[1] === "number") {
          itemIndex = issue.path[1];
          const action = formData.INQCmds?.[itemIndex];
          labelPrefix = `Action #${itemIndex + 1}${action?.cmdButton ? ` (${action.cmdButton})` : ""}`;
        }
      }

      addIssue({
        id: `zod-${idx}-${pathStr}`,
        tab,
        fieldKey: pathStr,
        message: `${labelPrefix}: ${issue.message}`,
        itemIndex,
        subSegment,
      });
    }
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
  const filters = formData.INQSelectField || [];
  const seenFilterNames = new Set<string>();

  filters.forEach((filter, idx) => {
    const fName = filter.selectFieldName?.trim();
    if (!fName) {
      addIssue({
        id: `err-sel-${idx}-name`,
        tab: "selection",
        fieldKey: `INQSelectField.${idx}.selectFieldName`,
        message: `Filter #${idx + 1}: Field Key is required`,
        itemIndex: idx,
      });
    } else {
      const lower = fName.toLowerCase();
      if (seenFilterNames.has(lower)) {
        addIssue({
          id: `err-sel-dup-${idx}`,
          tab: "selection",
          fieldKey: `INQSelectField.${idx}.selectFieldName`,
          message: `Filter #${idx + 1}: Duplicate filter field key "${fName}"`,
          itemIndex: idx,
        });
      } else {
        seenFilterNames.add(lower);
      }
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

  // 4. Domain Business Rules: Table Design Tab
  const columns = formData.INQDef || [];
  if (columns.length === 0) {
    addIssue({
      id: "err-table-no-columns",
      tab: "table",
      fieldKey: "INQDef",
      message: "Table Design: At least one column must be configured",
      subSegment: "columns",
    });
  }

  const seenColNames = new Set<string>();
  columns.forEach((col, idx) => {
    const cName = col.fieldName?.trim();
    if (!cName) {
      addIssue({
        id: `err-col-${idx}-name`,
        tab: "table",
        fieldKey: `INQDef.${idx}.fieldName`,
        message: `Column #${idx + 1}: Field Name is required`,
        itemIndex: idx,
        subSegment: "columns",
      });
    } else {
      const lower = cName.toLowerCase();
      if (seenColNames.has(lower)) {
        addIssue({
          id: `err-col-dup-${idx}`,
          tab: "table",
          fieldKey: `INQDef.${idx}.fieldName`,
          message: `Column #${idx + 1}: Duplicate column field name "${cName}"`,
          itemIndex: idx,
          subSegment: "columns",
        });
      } else {
        seenColNames.add(lower);
      }
    }

    if (!col.fieldDisplay?.trim()) {
      addIssue({
        id: `err-col-${idx}-display`,
        tab: "table",
        fieldKey: `INQDef.${idx}.fieldDisplay`,
        message: `Column #${idx + 1}: Display Header is required`,
        itemIndex: idx,
        subSegment: "columns",
      });
    }
  });

  const actions = formData.INQCmds || [];
  actions.forEach((act, idx) => {
    if (!act.cmdButton?.trim()) {
      addIssue({
        id: `err-act-${idx}-btn`,
        tab: "table",
        fieldKey: `INQCmds.${idx}.cmdButton`,
        message: `Action #${idx + 1}: Button label is required`,
        itemIndex: idx,
        subSegment: "actions",
      });
    }

    if (!act.cmdFor?.trim()) {
      addIssue({
        id: `err-act-${idx}-for`,
        tab: "table",
        fieldKey: `INQCmds.${idx}.cmdFor`,
        message: `Action #${idx + 1}: Command target is required`,
        itemIndex: idx,
        subSegment: "actions",
      });
    }
  });

  return issues;
}
