import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Security Configuration Constants                                           */
/* -------------------------------------------------------------------------- */

export const MIN_PASSWORD_LENGTH = 6;

/* -------------------------------------------------------------------------- */
/* User Authentication & Credential Change Schemas                            */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changeUsernameSchema = z.object({
  oldUserName: z.string().min(1, "Old sign-on name is required"),
  newUserName: z.string().min(1, "New sign-on name is required"),
  password: z.string().min(1, "Password is required to confirm"),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Universal Authenticated CBS User Profile & Session Contract                */
/* -------------------------------------------------------------------------- */

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
