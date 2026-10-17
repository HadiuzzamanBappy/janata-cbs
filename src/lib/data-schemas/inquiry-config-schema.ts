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

export const inquiryActionConfigSchema = z.object({
  id: z.string().min(1, "Action ID is required"),
  label: z.string().min(1, "Action Label is required"),
  targetCommand: z.string().optional(), // e.g. "ACCOUNT,SEE", "ACCOUNT,AMEND"
  actionType: z.enum(["view", "edit", "command", "drilldown"]).default("view"),
  icon: z
    .enum(["eye", "edit", "rotate-ccw", "history", "external-link", "file-text"])
    .default("eye"),
  openMode: z.enum(["tab", "popup", "drilldown"]).default("tab"),
  idParamField: z.string().default("recordId"),
});

export type InquiryActionConfig = z.infer<typeof inquiryActionConfigSchema>;

export const inquiryConfigRecordSchema = z.object({
  id: z.string().min(1, "Inquiry ID is required"), // e.g. "INQ.ACCOUNT.LIST"
  title: z.string().min(1, "Inquiry Title is required"),
  description: z.string().optional(),
  targetModel: z.string().min(1, "Target Model is required"), // e.g. "ACCOUNT"
  columns: z.array(inquiryColumnConfigSchema).default([]),
  filters: z.array(inquiryFilterConfigSchema).default([]),
  actions: z.array(inquiryActionConfigSchema).default([]),
  auditData: auditDataSchema.optional(),
});

export type InquiryConfigRecord = z.infer<typeof inquiryConfigRecordSchema>;
