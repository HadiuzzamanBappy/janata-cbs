"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    fetch("/api/session").then(res => res.json()).then(data => {
      if(data.user) {
        setUserId(data.user.userId || "");
        setNewUserName(data.user.userId || "");
      }
    }).catch(() => {});
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

    const globalRegex = RegExp('[!@#$%^&*(),.?":{}|<>]', "g");
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
        setError(res.errors ? res.errors.join(", ") : res.message || "Failed to change password.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto mt-8 bg-surface border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold">Change Password</h2>
        <p className="text-sm text-fg-muted mt-1">Update your account password. Ensure it meets the security requirements.</p>
      </div>

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

      <form onSubmit={handleChangePassword} className="space-y-5">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right font-medium">User Name</Label>
          <div className="col-span-3">
            <Input value={userId} disabled className="bg-gray-50 dark:bg-gray-900" />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right font-medium">New User Name <span className="text-red-500">*</span></Label>
          <div className="col-span-3">
            <Input 
              value={newUserName} 
              onChange={(e) => setNewUserName(e.target.value)} 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right font-medium">Current Password <span className="text-red-500">*</span></Label>
          <div className="col-span-3">
            <Input 
              type="password" 
              value={currPass} 
              onChange={(e) => setCurrPass(e.target.value)} 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right font-medium">New Password <span className="text-red-500">*</span></Label>
          <div className="col-span-3">
            <Input 
              type="password" 
              value={newPass} 
              onChange={(e) => setNewPass(e.target.value)} 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right font-medium">Confirm Password <span className="text-red-500">*</span></Label>
          <div className="col-span-3">
            <Input 
              type="password" 
              value={confPass} 
              onChange={(e) => setConfPass(e.target.value)} 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 pt-4">
          <div className="col-start-2 col-span-3">
            <Button type="submit" disabled={loading} className="w-32 bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
