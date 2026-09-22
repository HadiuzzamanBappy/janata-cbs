import type { Metadata } from "next";
import { ChangePassword } from "@/features/auth/change-password";

export const metadata: Metadata = {
  title: "Change Password — Janata Bank PLC.",
  description: "Set a new password for your initial login.",
};

export default function ChangePasswordPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Action Required
        </h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          This is your initial sign-on. You must set a new password to continue.
        </p>
      </div>

      <ChangePassword />
    </>
  );
}
