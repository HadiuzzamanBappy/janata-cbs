"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearInitLoginCookie } from "../actions";

export function ChangePassword() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // TODO: Here we will eventually send the password change request.
      // await fetch("/api/proxy", { ... })

      // TODO: Replace this simulated network request once the API is ready.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await clearInitLoginCookie();

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label
          htmlFor="oldPassword"
          className="text-[13px] font-semibold text-foreground"
        >
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
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="newPassword"
          className="text-[13px] font-semibold text-foreground"
        >
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
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          className="text-[13px] font-semibold text-foreground"
        >
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
          className="h-11"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-11 font-semibold text-[15px]"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
