import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* CBS Branch Contact Information Contract                                    */
/* -------------------------------------------------------------------------- */

/** Validates branch physical address and telecommunication contact details. */
export const branchContactSchema = z.object({
  addressLine: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export type BranchContact = z.infer<typeof branchContactSchema>;

/* -------------------------------------------------------------------------- */
/* CBS Branch Record Schema & Domain Model                                    */
/* Matches 1:1 with CBS wire & fixture schema (fixtures/branches.ts)          */
/* -------------------------------------------------------------------------- */

/**
 * Canonical CBS Branch ledger profile and routing contract.
 * Holds routing numbers for BEFTN, SWIFT codes, division codes, and current accounting dates.
 */
export const branchRecordSchema = z.object({
  recordId: z.string(),
  branchTitle: z.string(),
  branchType: z.string().optional(),
  branchContact: z.array(branchContactSchema).optional().default([]),
  openDate: z.string().optional(),
  branchOpenDate: z.string().optional(),
  branchAddress: z.string().optional(),
  currTxnDate: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  bbCode: z.string().optional(),
  divCode: z.string().optional(),
  areaCode: z.string().optional(),
  gradeCode: z.string().optional(),
  countryCode: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  parentBranch: z.string().optional(),
  auditData: auditDataSchema.optional(),
});

export type BranchRecord = z.infer<typeof branchRecordSchema>;
