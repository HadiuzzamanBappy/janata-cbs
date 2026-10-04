"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/lib/config";
import { changePasswordSchema, changeUsernameSchema } from "../schemas";

export function ChangePassword({ command: _command }: { command?: string }) {
  // Username State
  const [unameLoading, setUnameLoading] = React.useState(false);
  const [unameError, setUnameError] = React.useState<string | null>(null);
  const [unameSuccess, setUnameSuccess] = React.useState<string | null>(null);

  const [oldUserName, setOldUserName] = React.useState("");
  const [newUserName, setNewUserName] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Password State
  const [passLoading, setPassLoading] = React.useState(false);
  const [passError, setPassError] = React.useState<string | null>(null);
  const [passSuccess, setPassSuccess] = React.useState<string | null>(null);

  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confPass, setConfPass] = React.useState("");

  React.useEffect(() => {
    fetch(appConfig.routes.api.session)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setOldUserName(data.user.userId || "");
        }
      })
      .catch(() => { });
  }, []);

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
      // Sending request to backend
      const response = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "CUN", // Assuming CUN for Change User Name
          controlName: "?",
          data: {
            oldUserName,
            newUserName,
            password: confirmPassword,
          },
        }),
      });

      const res = await response.json();

      if (response.ok && res.statusCode === 200) {
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
      oldPass,
      newPass,
      confPass,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setPassError(firstIssue?.message || "Invalid password fields.");
      return;
    }

    setPassLoading(true);

    try {
      const response = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "CPW",
          controlName: "?",
          data: {
            currPass: oldPass, // Map back to what backend expects if necessary
            newPass,
          },
        }),
      });

      const res = await response.json();

      if (response.ok && res.statusCode === 200) {
        setPassSuccess("Password successfully changed!");
        setOldPass("");
        setNewPass("");
        setConfPass("");
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
            <Label className="text-[11px] font-medium text-muted-foreground">Old Sign-on Name</Label>
            <Input value={oldUserName} disabled className="bg-muted/40 h-8 text-xs font-mono" />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              New Sign-on Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              Password (to confirm) <span className="text-destructive">*</span>
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
              Old Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
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
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
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
              value={confPass}
              onChange={(e) => setConfPass(e.target.value)}
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
