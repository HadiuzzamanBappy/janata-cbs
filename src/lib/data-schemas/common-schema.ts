import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Standard CBS Audit Trail Contract                                          */
/* -------------------------------------------------------------------------- */

/**
 * Standard CBS Maker-Checker Audit Trail Contract.
 * Tracks lifecycle status ("AU" Live, "INA" Pending, "HLD" Held, "DEL" Deleted)
 * and dual-control operator stamps across all maintainable records.
 */
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
/* Standard Enquiry & Dynamic Table Column Definition                         */
/* -------------------------------------------------------------------------- */

/**
 * Universal column configuration for dynamic tabular data grids in CBS.
 * Shared across Generic Model Config (GMC) sub-tables and dynamic inquiry views.
 */
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
