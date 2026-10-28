import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. FILTER OPERANDS & ROW DATA                                              */
/* ========================================================================== */

export const selectionOperandSchema = z.enum(["EQ", "LK", "RG", "NE", "GT", "LT", "CT"]);
export type SelectionOperand = z.infer<typeof selectionOperandSchema>;
export const SELECTION_OPERANDS = selectionOperandSchema.options;

export const enquiryRowSchema = z
  .object({
    id: z.string(),
  })
  .passthrough();

export type EnquiryRow = z.infer<typeof enquiryRowSchema> & {
  [key: string]: unknown;
};

/* ========================================================================== */
/* 2. INQUIRY COLUMN CONFIGURATION                                            */
/* ========================================================================== */

export const inquiryColumnFormatSchema = z.enum([
  "text",
  "currency",
  "date",
  "account",
  "badge",
  "number",
]);
export type InquiryColumnFormat = z.infer<typeof inquiryColumnFormatSchema>;

export const inquiryColumnConfigSchema = z.object({
  id: z.string().min(1, "Column ID is required"),
  label: z.string().min(1, "Column Header is required"),
  width: z.union([z.string(), z.number()]).optional(),
  align: z.enum(["left", "center", "right"]).default("left"),
  format: inquiryColumnFormatSchema.default("text"),
  currencyCode: z.string().optional(),
  isMono: z.boolean().default(false),
  sortable: z.boolean().default(true),
  visible: z.boolean().default(true),
  isPinned: z.boolean().default(false),
});

export type InquiryColumnConfig = z.infer<typeof inquiryColumnConfigSchema>;

/* ========================================================================== */
/* 3. INQUIRY FILTER CONFIGURATION                                            */
/* ========================================================================== */

export const inquiryFilterOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type InquiryFilterOption = z.infer<typeof inquiryFilterOptionSchema>;

export const inquiryFilterTypeSchema = z.enum(["text", "select", "date", "number"]);
export type InquiryFilterType = z.infer<typeof inquiryFilterTypeSchema>;

export const inquiryFilterConfigSchema = z.object({
  id: z.string().min(1, "Filter ID is required"),
  label: z.string().min(1, "Filter Label is required"),
  type: inquiryFilterTypeSchema.default("text"),
  defaultOperand: selectionOperandSchema.default("EQ"),
  defaultValue: z.string().default(""),
  options: z.array(inquiryFilterOptionSchema).optional().default([]),
  required: z.boolean().default(false),
});

export type InquiryFilterConfig = z.infer<typeof inquiryFilterConfigSchema>;

/* ========================================================================== */
/* 4. INQUIRY ACTION CONFIGURATION                                            */
/* ========================================================================== */

export const inquiryActionTypeSchema = z.enum(["view", "edit", "command", "drilldown"]);
export type InquiryActionType = z.infer<typeof inquiryActionTypeSchema>;

export const inquiryActionIconSchema = z.enum([
  "eye",
  "edit",
  "rotate-ccw",
  "history",
  "external-link",
  "file-text",
]);
export type InquiryActionIcon = z.infer<typeof inquiryActionIconSchema>;

export const inquiryActionOpenModeSchema = z.enum(["tab", "popup", "drilldown"]);
export type InquiryActionOpenMode = z.infer<typeof inquiryActionOpenModeSchema>;

export const inquiryActionConfigSchema = z.object({
  id: z.string().min(1, "Action ID is required"),
  label: z.string().min(1, "Action Label is required"),
  targetCommand: z.string().default(""),
  actionType: inquiryActionTypeSchema.default("view"),
  icon: inquiryActionIconSchema.default("eye"),
  openMode: inquiryActionOpenModeSchema.default("tab"),
  idParamField: z.string().default("recordId"),
});

export type InquiryActionConfig = z.infer<typeof inquiryActionConfigSchema>;

/* ========================================================================== */
/* 5. TABLE RECORD: INQUIRY CONFIG RECORD (INQUIRY.CONFIG)                    */
/* ========================================================================== */

/**
 * Canonical control table definition record for `INQUIRY.CONFIG`.
 * Single source of truth across Designer, Database, and Runtime.
 */
export const inquiryConfigRecordSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  pageOrientation: z.enum(["Portrait", "Landscape", ""]).default("Portrait"),
  showSerial: z.boolean().default(true),
  showPagination: z.boolean().default(true),
  showBranchWise: z.boolean().default(false),
  recordPerPage: z.coerce.number().default(30),
  inqType: z.string().default("DFT"),
  controllerName: z.string().min(1, "Target controller/model is required"),
  rptControllerName: z.string().default(""),
  inqServicePath: z.string().default("default"),
  columns: z.array(inquiryColumnConfigSchema).default([]),
  filters: z.array(inquiryFilterConfigSchema).default([]),
  actions: z.array(inquiryActionConfigSchema).default([]),
  sampleData: z.array(enquiryRowSchema).optional(),
  auditData: auditDataSchema.optional(),
});

export type InquiryConfigRecord = z.infer<typeof inquiryConfigRecordSchema>;

/* ========================================================================== */
/* 6. VALIDATION ERRORS                                                       */
/* ========================================================================== */

export interface InquiryValidationErrorItem {
  id: string;
  tab: "general" | "selection" | "table";
  fieldKey: string;
  message: string;
}
