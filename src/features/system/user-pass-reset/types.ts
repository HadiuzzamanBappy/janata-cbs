import { z } from "zod";

/**
 * User Security Profile & Password Reset Schema
 * Stored in USER.PASS.RESET / USER security records
 */
export const userPassResetRecordSchema = z.object({
  recordId: z.string().min(1, "User ID is required"),
  bankId: z.string().default(""),
  username: z.string().default(""),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email().optional().or(z.literal("")),
  branchCode: z.string().default("0101"),
  userGroup: z.string().default("TELLER.GRP"),
  accountStatus: z.enum(["ACTIVE", "LOCKED", "SUSPENDED", "PASSWORD_EXPIRED"]).default("ACTIVE"),
  failedAttempts: z.number().default(0),
  lastPasswordChange: z.string().optional(),
  temporaryPassword: z.string().optional(),
  requirePasswordChange: z.boolean().default(true),
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

export type UserPassResetRecord = z.infer<typeof userPassResetRecordSchema>;

export type UserPassResetScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";
