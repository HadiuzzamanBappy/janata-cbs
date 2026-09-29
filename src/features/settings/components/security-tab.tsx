"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setOldUserName(data.user.userId || "");
        }
      })
      .catch(() => {});
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
      const response = await fetch("/api/proxy", {
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
      const response = await fetch("/api/proxy", {
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
    <div className="max-w-4xl space-y-6">
      {/* Change Sign-on Name Section */}
      <div className="bg-background rounded-lg border border-border/50 p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Change Sign-on Name</h3>

        {unameError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{unameError}</AlertDescription>
          </Alert>
        )}

        {unameSuccess && (
          <Alert className="mb-6 border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{unameSuccess}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangeUsername} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <Label className="font-medium text-xs">Old Sign-on Name</Label>
            <Input value={oldUserName} disabled className="bg-muted/50 h-9 text-xs" />
          </div>

          <div className="space-y-1 pt-1">
            <Label className="font-medium text-xs">
              New Sign-on Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="font-medium text-xs">
              Password (to confirm) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={unameLoading}
              className="w-full sm:w-auto h-9 text-xs font-medium"
            >
              {unameLoading ? <Loader2 className="size-3.5 animate-spin mr-2" /> : null}
              Change Sign-on Name
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-background rounded-lg border border-border/50 p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Change Password</h3>

        {passError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{passError}</AlertDescription>
          </Alert>
        )}

        {passSuccess && (
          <Alert className="mb-6 border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{passSuccess}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <Label className="font-medium text-xs">
              Old Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="font-medium text-xs">
              New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="font-medium text-xs">
              Confirm New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={confPass}
              onChange={(e) => setConfPass(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={passLoading}
              className="w-full sm:w-auto h-9 text-xs font-medium"
            >
              {passLoading ? <Loader2 className="size-3.5 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
