import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Security Configuration Constants                                           */
/* -------------------------------------------------------------------------- */

/** Global CBS minimum password length invariant. */
export const MIN_PASSWORD_LENGTH = 6;

/* -------------------------------------------------------------------------- */
/* User Authentication & Credential Change Schemas                            */
/* -------------------------------------------------------------------------- */

/** Validates operator sign-on credentials submitted on the login screen. */
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Validates self-service sign-on username modification requests ('CUN'). */
export const changeUsernameSchema = z.object({
  oldUserName: z.string().min(1, "Old sign-on name is required"),
  newUserName: z.string().min(1, "New sign-on name is required"),
  password: z.string().min(1, "Password is required to confirm"),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;

/** Validates password rotation requests ('CPW') ensuring match, length, and complexity. */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Minimum ${MIN_PASSWORD_LENGTH} characters required!`)
      .regex(/.*[A-Z].*/, "At least 1 uppercase character required!")
      .regex(/.*[a-z].*/, "At least 1 lowercase character required!")
      .regex(/.*\d.*/, "At least 1 digit required!")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least 1 special character required!"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Universal Authenticated CBS User Profile & Session Contract                */
/* -------------------------------------------------------------------------- */

/**
 * Universal authenticated CBS operator profile and session envelope.
 * Ingested from gRPC / Protobuf and persisted in Redis server session.
 * Holds user credentials, active branch code, and RIDASH accessibility permissions.
 */
export const currentUserSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  userRole: z.array(z.string()),
  accessibility: z.string(),
  functionRights: z.array(z.string()).optional(),
  branchCode: z.string(),
  branchName: z.string(),
  txnDate: z.string(),
  lastTxnDate: z.string().optional(),
  nextDate: z.string().optional(),
  isLoggedIn: z.boolean().default(true),
  commandLine: z.boolean().default(false),
  initLogin: z.boolean().default(false),
  userStatus: z.number().default(1),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
