"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cbs } from "@/lib/cbs-client";
import { changePasswordSchema, changeUsernameSchema } from "@/lib/data-schemas";
import { useSessionStore } from "@/store";

export function ChangePassword() {
  const { user } = useSessionStore();

  // Username State
  const [unameLoading, setUnameLoading] = React.useState(false);
  const [unameError, setUnameError] = React.useState<string | null>(null);
  const [unameSuccess, setUnameSuccess] = React.useState<string | null>(null);

  const [oldUserName, setOldUserName] = React.useState(user?.userId || "");
  const [newUserName, setNewUserName] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Sync if user updates
  React.useEffect(() => {
    if (user?.userId) {
      setOldUserName(user.userId);
    }
  }, [user?.userId]);

  // Password State
  const [passLoading, setPassLoading] = React.useState(false);
  const [passError, setPassError] = React.useState<string | null>(null);
  const [passSuccess, setPassSuccess] = React.useState<string | null>(null);

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnameError(null);
    setUnameSuccess(null);

    const validationResult = changeUsernameSchema.safeParse({
      oldUserName,
      newUserName,
      password: confirmPassword,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setUnameError(firstIssue?.message || "Invalid sign-on name fields.");
      return;
    }

    setUnameLoading(true);
    try {
      const res = await cbs.send(
        cbs.userSecurity.changeSignOnName({
          oldUserName,
          newUserName,
          password: confirmPassword,
        }),
        { silent: true },
      );

      if (res.status === "SUCCESS") {
        setUnameSuccess("Sign-on name successfully changed!");
        setConfirmPassword("");
        setOldUserName(newUserName);
        setNewUserName("");
      } else {
        setUnameError(
          res.errors ? res.errors.join(", ") : res.message || "Failed to change sign-on name.",
        );
      }
    } catch (err: unknown) {
      setUnameError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setUnameLoading(false);
    }
  };

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
      const res = await cbs.send(
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
      {/* Change Sign-on Name Section */}
      <div className="bg-background rounded-lg border border-border/50 p-3.5 shadow-xs">
        <h3 className="text-xs font-semibold mb-2.5 text-foreground">Change Sign-on Name</h3>

        {unameError && (
          <Alert variant="destructive" className="mb-3 py-2 px-3 text-xs">
            <AlertDescription className="text-xs">{unameError}</AlertDescription>
          </Alert>
        )}

        {unameSuccess && (
          <Alert className="mb-3 py-2 px-3 text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400">
            <AlertDescription className="text-xs">{unameSuccess}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangeUsername} className="space-y-2.5 max-w-sm">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">Current Sign-on Name</Label>
            <Input
              type="text"
              value={oldUserName}
              disabled
              className="bg-muted/50 cursor-not-allowed h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              New Sign-on Name <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. TELLER99"
              required
              className="h-8 text-xs font-mono uppercase"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              Verify Current Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={unameLoading}
              className="h-7.5 px-3 text-xs font-medium"
            >
              {unameLoading ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
              Change Sign-on Name
            </Button>
          </div>
        </form>
      </div>

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
              className="h-7.5 px-3 text-xs font-medium"
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
