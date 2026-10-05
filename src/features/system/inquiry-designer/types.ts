import { z } from "zod";

/**
 * Filter / Selection criteria for Enquiry search bar
 */
export const enquirySelectionFieldSchema = z.object({
  id: z.string().optional(),
  fieldName: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Filter label is required"),
  operator: z.enum(["EQ", "LIKE", "BETWEEN", "GT", "LT", "NE"]).default("EQ"),
  fieldType: z.enum(["Text", "Number", "Date", "Dropdown"]).default("Text"),
  defaultValue: z.string().default(""),
  required: z.boolean().default(false),
});

export type EnquirySelectionField = z.infer<typeof enquirySelectionFieldSchema>;

/**
 * Column definition for Enquiry grid display
 */
export const enquiryColumnDefSchema = z.object({
  id: z.string().optional(),
  fieldName: z.string().min(1, "Column field is required"),
  headerLabel: z.string().min(1, "Header label is required"),
  width: z.number().default(160),
  alignment: z.enum(["left", "center", "right"]).default("left"),
  sortable: z.boolean().default(true),
  format: z.enum(["text", "currency", "date", "badge"]).default("text"),
});

export type EnquiryColumnDef = z.infer<typeof enquiryColumnDefSchema>;

/**
 * Drill-down command action (e.g. Row Click runs ACCOUNT S {recordId})
 */
export const enquiryDrillDownActionSchema = z.object({
  actionLabel: z.string(),
  targetCommand: z.string(), // e.g. "ACCOUNT S", "CUSTOMER S"
  icon: z.string().default("ExternalLink"),
});

export type EnquiryDrillDownAction = z.infer<typeof enquiryDrillDownActionSchema>;

/**
 * Complete Enquiry Definition Schema (persisted in INQUIRY / ENQUIRY table)
 */
export const enquiryConfigRecordSchema = z.object({
  recordId: z.string().min(1, "Enquiry ID is required"),
  title: z.string().min(1, "Title is required"),
  targetTable: z.string().min(1, "Target table is required"),
  category: z.string().default("INQUIRY"),
  pageSize: z.number().default(20),
  isActive: z.boolean().default(true),
  selectionFields: z.array(enquirySelectionFieldSchema).default([]),
  columns: z.array(enquiryColumnDefSchema).default([]),
  drillDownActions: z.array(enquiryDrillDownActionSchema).default([]),
  auditData: z
    .object({
      recStatus: z.string().optional(),
      recCurrNumber: z.number().optional(),
      recInputter: z.string().optional(),
      recInputTime: z.string().optional(),
      recAuthorizer: z.string().optional(),
      recAuthTime: z.string().optional(),
      recBranchCode: z.string().optional(),
    })
    .optional(),
});

export type EnquiryConfigRecord = z.infer<typeof enquiryConfigRecordSchema>;

export type EnquiryScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";
