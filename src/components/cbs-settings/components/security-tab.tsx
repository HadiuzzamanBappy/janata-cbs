"use client";

import { ChangePasswordForm } from "./change-password-form";

export function ChangePassword() {
  return (
    <div className="max-w-xl space-y-3">
      <div className="bg-background rounded-lg border border-border/50 p-3.5 shadow-xs">
        <h3 className="text-xs font-semibold mb-2.5 text-foreground">Change Password</h3>
        <ChangePasswordForm className="max-w-sm" />
      </div>
    </div>
  );
}
