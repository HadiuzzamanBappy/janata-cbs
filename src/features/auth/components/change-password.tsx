"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "../hooks/use-change-password";
import type { ChangePasswordProps } from "../types";

export function ChangePassword({ className = "mt-8 space-y-6" }: ChangePasswordProps) {
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const { changePassword, loading, error, setError } = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    await changePassword({ oldPassword, newPassword, confirmPassword });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="oldPassword" className="text-xs font-medium text-foreground">
          Current Password
        </Label>
        <Input
          id="oldPassword"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
          className="h-9 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="text-xs font-medium text-foreground">
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
          className="h-9 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
          className="h-9 text-xs"
        />
      </div>
      <Button type="submit" size="sm" className="w-full h-9 font-medium text-xs" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
