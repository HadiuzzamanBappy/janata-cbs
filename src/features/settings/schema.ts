import { z } from "zod";

export const securityPasswordSchema = z
  .object({
    newUserName: z.string().min(1, "New user name is required"),
    currPass: z.string().min(1, "Current password is required"),
    newPass: z
      .string()
      .min(6, "Minimum 6 characters required!")
      .regex(/.*[A-Z].*/, "At least 1 uppercase character required!")
      .regex(/.*[a-z].*/, "At least 1 lowercase character required!")
      .regex(/.*\d.*/, "At least 1 digit required!")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least 1 special character required!"),
    confPass: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPass === data.confPass, {
    message: "New password and confirm password do not match.",
    path: ["confPass"],
  });

export type SecurityPasswordInput = z.infer<typeof securityPasswordSchema>;
