"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePassword({ command: _command }: { command?: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [userId, setUserId] = React.useState("");
  const [currPass, setCurrPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confPass, setConfPass] = React.useState("");
  const [newUserName, setNewUserName] = React.useState("");

  React.useEffect(() => {
    // Attempt to fetch current user session from API if no global store is strictly hooked up
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserId(data.user.userId || "");
          setNewUserName(data.user.userId || "");
        }
      })
      .catch(() => {});
  }, []);

  const isValidPass = () => {
    if (!currPass || !newPass || !confPass) {
      setError("Please fill up the form completely.");
      return false;
    }

    if (newPass !== confPass) {
      setError("New password and confirm password do not match.");
      return false;
    }

    if (newPass.length < 6) {
      setError("Minimum 6 characters required!");
      return false;
    }

    if (!newPass.match(".*[A-Z].*")) {
      setError("At least 1 upper case character required!");
      return false;
    }

    if (!newPass.match(".*[a-z].*")) {
      setError("At least 1 lower case character required!");
      return false;
    }

    if (!newPass.match(".*\\d.*")) {
      setError("At least 1 digit required!");
      return false;
    }

    const globalRegex = /[!@#$%^&*(),.?":{}|<>]/g;
    if (!globalRegex.test(newPass)) {
      setError("At least 1 special character required!");
      return false;
    }

    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isValidPass()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "CPW",
          controlName: "?",
          data: {
            currPass,
            newPass,
          },
        }),
      });

      const res = await response.json();

      if (response.ok && res.statusCode === 200) {
        setSuccess("Password successfully changed!");
        setCurrPass("");
        setNewPass("");
        setConfPass("");
      } else {
        setError(
          res.errors
            ? res.errors.join(", ")
            : res.message || "Failed to change password.",
        );
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-background rounded-lg border border-border/50 p-6 shadow-sm">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label className="font-medium text-sm">User Name</Label>
            <Input value={userId} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="font-medium text-sm">
              New User Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-sm">
              Current Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-sm">
              New Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-sm">
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={confPass}
              onChange={(e) => setConfPass(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
