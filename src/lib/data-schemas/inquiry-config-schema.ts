import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Inquiry Configuration Record Schema (Visual Presentation Layer)            */
/* -------------------------------------------------------------------------- */

export const inquiryColumnConfigSchema = z.object({
  id: z.string().min(1, "Column ID is required"),
  label: z.string().min(1, "Column Header is required"),
  width: z.union([z.string(), z.number()]).optional(),
  align: z.enum(["left", "center", "right"]).default("left"),
  format: z.enum(["text", "currency", "date", "account", "badge", "number"]).default("text"),
  currencyCode: z.string().optional(),
  isMono: z.boolean().default(false),
  sortable: z.boolean().default(true),
  visible: z.boolean().default(true),
  isPinned: z.boolean().default(false),
});

export type InquiryColumnConfig = z.infer<typeof inquiryColumnConfigSchema>;

export const inquiryFilterConfigSchema = z.object({
  id: z.string().min(1, "Filter ID is required"),
  label: z.string().min(1, "Filter Label is required"),
  type: z.enum(["text", "select", "date", "number"]).default("text"),
  defaultOperand: z.enum(["EQ", "LK", "RG", "NE", "GT", "LT", "CT"]).default("EQ"),
  defaultValue: z.string().default(""),
  required: z.boolean().default(false),
});

export type InquiryFilterConfig = z.infer<typeof inquiryFilterConfigSchema>;

export const inquiryDrillDownRuleSchema = z.object({
  targetCommand: z.string().min(1, "Target Command is required"), // e.g. "ACCOUNT,SEE"
  idParamField: z.string().default("id"), // e.g. "accountNo"
  openMode: z.enum(["tab", "popup"]).default("tab"),
});

export type InquiryDrillDownRule = z.infer<typeof inquiryDrillDownRuleSchema>;

export const inquiryConfigRecordSchema = z.object({
  id: z.string().min(1, "Inquiry ID is required"), // e.g. "INQ.ACCOUNT.LIST"
  title: z.string().min(1, "Inquiry Title is required"),
  description: z.string().optional(),
  targetModel: z.string().min(1, "Target Model is required"), // e.g. "ACCOUNT"
  defaultPageSize: z.number().default(25),
  columns: z.array(inquiryColumnConfigSchema).default([]),
  filters: z.array(inquiryFilterConfigSchema).default([]),
  drillDown: inquiryDrillDownRuleSchema.optional(),
  auditData: auditDataSchema.optional(),
});

export type InquiryConfigRecord = z.infer<typeof inquiryConfigRecordSchema>;
