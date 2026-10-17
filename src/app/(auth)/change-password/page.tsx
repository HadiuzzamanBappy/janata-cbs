import type { Metadata } from "next";
import { ChangePassword } from "@/features/auth";

export const metadata: Metadata = {
  title: "Change Password — Janata Bank PLC.",
  description: "Set a new password for your initial login.",
};

export default function ChangePasswordPage() {
  return (
    <>
      <div className="mb-6 text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Action Required</h2>
        <p className="text-xs text-muted-foreground">
          This is your initial sign-on. You must set a new password to continue.
        </p>
      </div>

      <ChangePassword />
    </>
  );
}
