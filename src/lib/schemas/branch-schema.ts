import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/**
 * CBS Branch Contact Information Contract
 */
export const branchContactSchema = z.object({
  addressLine: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export type BranchContact = z.infer<typeof branchContactSchema>;

/**
 * CBS Branch Record Schema & Domain Model
 * Matches exactly 1:1 with CBS wire & fixture schema (fixtures/branches.ts)
 */
export const branchRecordSchema = z.object({
  recordId: z.string(),
  branchTitle: z.string(),
  branchType: z.string().optional().default("BR"),
  branchContact: z.array(branchContactSchema).optional().default([]),
  openDate: z.string().optional().default(""),
  branchOpenDate: z.string().optional(),
  branchAddress: z.string().optional(),
  currTxnDate: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  bbCode: z.string().optional(),
  divCode: z.string().optional().default(""),
  areaCode: z.string().optional().default(""),
  gradeCode: z.string().optional(),
  countryCode: z.string().optional().default("BD"),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  parentBranch: z.string().optional(),
  auditData: auditDataSchema.optional(),
});

export type BranchRecord = z.infer<typeof branchRecordSchema>;
