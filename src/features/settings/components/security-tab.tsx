"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { useIdempotentSend } from "@/components/cbs-screen";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cbs } from "@/lib/cbs-client";
import { changePasswordSchema } from "@/lib/data-schemas";

export function ChangePassword() {
  const { sendMutation } = useIdempotentSend();

  // Password State
  const [passLoading, setPassLoading] = React.useState(false);
  const [passError, setPassError] = React.useState<string | null>(null);
  const [passSuccess, setPassSuccess] = React.useState<string | null>(null);

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    const validationResult = changePasswordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword: confirmNewPassword,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setPassError(firstIssue?.message || "Invalid password fields.");
      return;
    }

    setPassLoading(true);

    try {
      const res = await sendMutation(
        cbs.userSecurity.changePassword({
          currPass: oldPassword,
          newPass: newPassword,
        }),
        { silent: true },
      );

      if (res.status === "SUCCESS") {
        setPassSuccess("Password successfully changed!");
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPassError(
          res.errors ? res.errors.join(", ") : res.message || "Failed to change password.",
        );
      }
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-3">
      {/* Change Password Section */}
      <div className="bg-background rounded-lg border border-border/50 p-3.5 shadow-xs">
        <h3 className="text-xs font-semibold mb-2.5 text-foreground">Change Password</h3>

        {passError && (
          <Alert variant="destructive" className="mb-3 py-2 px-3 text-xs">
            <AlertDescription className="text-xs">{passError}</AlertDescription>
          </Alert>
        )}

        {passSuccess && (
          <Alert className="mb-3 py-2 px-3 text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400">
            <AlertDescription className="text-xs">{passSuccess}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-2.5 max-w-sm">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              Current Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              Confirm New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={passLoading}
              className="h-7.5 px-3 text-xs font-medium cursor-pointer"
            >
              {passLoading ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
