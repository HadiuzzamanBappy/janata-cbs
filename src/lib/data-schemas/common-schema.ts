import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Standard CBS Audit Trail Contract                                          */
/* Shared across all maintainable records (Forms, Model Config, Menus, Groups)*/
/* -------------------------------------------------------------------------- */

export const auditDataSchema = z.object({
  recStatus: z.string().optional(),
  recCurrNumber: z.number().optional(),
  recInputter: z.string().optional(),
  recInputTime: z.string().optional(),
  recAuthorizer: z.string().optional(),
  recAuthTime: z.string().optional(),
  recBranchCode: z.string().optional(),
});

export type AuditData = z.infer<typeof auditDataSchema>;

/* -------------------------------------------------------------------------- */
/* Standard Enquiry / Dynamic Table Column Definition                         */
/* Shared between GMC dynamic forms sub-tables and Dynamic Inquiries          */
/* -------------------------------------------------------------------------- */

export const enquiryColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  align: z.enum(["left", "center", "right"]).optional(),
  width: z.string().optional(),
  isMono: z.boolean().optional(),
  isDrilldown: z.boolean().optional(),
  drilldownTargetCommand: z.string().optional(),
});

export type EnquiryColumn = z.infer<typeof enquiryColumnSchema>;
export type RawEnquiryColumn = EnquiryColumn;
export const rawEnquiryColumnSchema = enquiryColumnSchema;
