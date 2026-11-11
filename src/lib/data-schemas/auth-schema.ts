import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Security Configuration Constants                                           */
/* -------------------------------------------------------------------------- */

/** Global CBS minimum password length invariant (Banking Standard: 8+ chars). */
export const MIN_PASSWORD_LENGTH = 8;

/* -------------------------------------------------------------------------- */
/* User Authentication & Credential Change Schemas (STRICT)                   */
/* -------------------------------------------------------------------------- */

/** Validates operator sign-on credentials submitted on the login screen. */
export const loginSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

/** Validates password rotation requests ('CPW') ensuring match, length, and complexity. */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Minimum ${MIN_PASSWORD_LENGTH} characters required!`)
      .regex(/[A-Z]/, "At least 1 uppercase character required!")
      .regex(/[a-z]/, "At least 1 lowercase character required!")
      .regex(/\d/, "At least 1 digit required!")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least 1 special character required!"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Universal Authenticated CBS User Profile & Session Contract                */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes operator accessibility rights from either an array or string.
 * Supports:
 * - Arrays: ["R", "I", "D", "A", "S", "H", "L"] -> preserved as string[]
 * - String flags: "RIDASHL" or "RS" -> split into individual capability codes ["R", "S"]
 * - Delimited strings: "R, I, D" or "R S D" -> parsed into array of codes
 */
export const accessibilitySchema = z
  .union([z.array(z.string()), z.string()])
  .nullish()
  .transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((item) => String(item).trim()).filter(Boolean);
    }
    const str = String(val).trim();
    if (!str) return [];
    if (str.includes(",")) {
      return str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (str.includes(" ")) {
      return str
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // String of single-character capability codes (e.g. "RIDASHL", "RS")
    return str
      .split("")
      .map((s) => s.trim())
      .filter(Boolean);
  })
  .default([]);

/**
 * Universal authenticated CBS operator profile and session envelope.
 * Ingested from gRPC / Protobuf and persisted in Redis server session.
 * Pure representation of database session without duplicate entries.
 */
export const currentUserSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  branchCode: z.string().trim().min(1, "Branch Code is required"),
  fullName: z.string().default(""),
  userRole: z.array(z.string()).default([]),
  accessibility: accessibilitySchema,
  branchName: z.string().default(""),
  txnDate: z.string().default(""),
  commandLine: z.boolean().default(false),
  initLogin: z.boolean().default(false),
  userStatus: z.number().int().default(1),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

/* -------------------------------------------------------------------------- */
/* Session Branch Update Contract (STRICT)                                    */
/* -------------------------------------------------------------------------- */

/** Validates POST /api/session branch change payload */
export const updateBranchSessionSchema = z
  .object({
    branchCode: z.string().trim().min(1, "Branch code is required"),
    branchName: z.string().trim().min(1, "Branch name is required"),
  })
  .strict();

export type UpdateBranchSessionInput = z.infer<typeof updateBranchSessionSchema>;
