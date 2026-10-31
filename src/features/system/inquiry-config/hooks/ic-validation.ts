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

  // 1. ZOD SCHEMA VALIDATION
  const parseResult = inquiryConfigRecordSchema.safeParse(formData);
  if (!parseResult.success) {
    for (let idx = 0; idx < parseResult.error.issues.length; idx++) {
      const issue = parseResult.error.issues[idx];
      const path = issue.path;
      const pathStr = path.join(".");
      const firstSegment = String(path[0] || "");

      let tab: InquiryConfigTabKey = "general";
      let itemIndex: number | undefined;
      let subSegment: "columns" | "actions" | undefined;
      let labelPrefix = "General";

      if (firstSegment === "INQSelectField") {
        tab = "selection";
        if (typeof path[1] === "number") {
          itemIndex = path[1];
          const filter = formData.INQSelectField?.[itemIndex];
          const name = filter?.selectFieldDisplay || filter?.selectFieldName;
          labelPrefix = `Filter #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        } else {
          labelPrefix = "Selection Criteria";
        }
      } else if (firstSegment === "INQDef") {
        tab = "table";
        subSegment = "columns";
        if (typeof path[1] === "number") {
          itemIndex = path[1];
          const col = formData.INQDef?.[itemIndex];
          const name = col?.fieldDisplay || col?.fieldName;
          labelPrefix = `Column #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        } else {
          labelPrefix = "Columns";
        }
      } else if (firstSegment === "INQCmds") {
        tab = "table";
        subSegment = "actions";
        if (typeof path[1] === "number") {
          itemIndex = path[1];
          const action = formData.INQCmds?.[itemIndex];
          const name = action?.cmdButton;
          labelPrefix = `Action #${itemIndex + 1}${name ? ` (${name})` : ""}`;
        } else {
          labelPrefix = "Actions";
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

  // 2. DOMAIN BUSINESS RULES: GENERAL TAB
  const controller = (formData.INQInfo?.controllerName || "").trim();
  if (!controller) {
    addIssue({
      id: "err-gen-controller",
      tab: "general",
      fieldKey: "INQInfo.controllerName",
      message: "General: Target Table / Controller is required",
    });
  }

  const description = (formData.INQInfo?.description || "").trim();
  if (!description) {
    addIssue({
      id: "err-gen-description",
      tab: "general",
      fieldKey: "INQInfo.description",
      message: "General: Description is required",
    });
  }

  // 3. DOMAIN BUSINESS RULES: SELECTION TAB
  const filters = formData.INQSelectField || [];
  const seenFilterNames = new Map<string, number>();

  filters.forEach((filter, idx) => {
    const fName = (filter.selectFieldName || "").trim();
    const fDisplay = (filter.selectFieldDisplay || "").trim();

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
        seenFilterNames.set(lower, idx);
      }
    }

    if (!fDisplay) {
      addIssue({
        id: `err-sel-${idx}-display`,
        tab: "selection",
        fieldKey: `INQSelectField.${idx}.selectFieldDisplay`,
        message: `Filter #${idx + 1}: Display Label is required`,
        itemIndex: idx,
      });
    }
  });

  // 4. DOMAIN BUSINESS RULES: TABLE DESIGN TAB
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

  const seenColNames = new Map<string, number>();
  columns.forEach((col, idx) => {
    const cName = (col.fieldName || "").trim();
    const cDisplay = (col.fieldDisplay || "").trim();

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
        seenColNames.set(lower, idx);
      }
    }

    if (!cDisplay) {
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
    const btn = (act.cmdButton || "").trim();
    const cmdFor = (act.cmdFor || "").trim();

    if (!btn) {
      addIssue({
        id: `err-act-${idx}-btn`,
        tab: "table",
        fieldKey: `INQCmds.${idx}.cmdButton`,
        message: `Action #${idx + 1}: Button label is required`,
        itemIndex: idx,
        subSegment: "actions",
      });
    }

    if (!cmdFor) {
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
