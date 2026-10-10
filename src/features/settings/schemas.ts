import { z } from "zod";
import { appConfig } from "@/lib/core-config";

export const changeUsernameSchema = z.object({
  oldUserName: z.string().min(1, "Old user name is required"),
  newUserName: z.string().min(1, "New user name is required"),
  password: z.string().min(1, "Password is required to confirm"),
});

export const changePasswordSchema = z
  .object({
    oldPass: z.string().min(1, "Old password is required"),
    newPass: z
      .string()
      .min(
        appConfig.auth.minPasswordLength,
        `Minimum ${appConfig.auth.minPasswordLength} characters required!`,
      )
      .regex(/.*[A-Z].*/, "At least 1 uppercase character required!")
      .regex(/.*[a-z].*/, "At least 1 lowercase character required!")
      .regex(/.*\d.*/, "At least 1 digit required!")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least 1 special character required!"),
    confPass: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPass === data.confPass, {
    message: "New password and confirm password do not match.",
    path: ["confPass"],
  });

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
