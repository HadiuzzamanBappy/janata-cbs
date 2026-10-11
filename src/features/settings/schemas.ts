import { z } from "zod";
import { appConfig } from "@/lib/core-config";

export {
  type ChangeUsernameInput,
  changeUsernameSchema,
} from "@/lib/data-schemas";

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

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
