"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeactivateTab() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [deactivateDate, setDeactivateDate] = React.useState("");
  const [reactivationDate, setReactivationDate] = React.useState("");

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!deactivateDate) {
      setError("Deactivation date is required.");
      return;
    }

    if (!reactivationDate) {
      setError("Reactivation date is required.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reactDate = new Date(reactivationDate);
    const deactDate = new Date(deactivateDate);

    if (reactDate <= today) {
      setError("Reactivation date must be in the future.");
      return;
    }

    if (reactDate <= deactDate) {
      setError("Reactivation date must be after deactivation date.");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call for deactivation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Account marked for deactivation successfully!");
      setDeactivateDate("");
      setReactivationDate("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-background rounded-lg border border-border/50 p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Deactivate Account</h3>

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

        <form onSubmit={handleDeactivate} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <Label className="font-medium text-xs">
              Deactivate Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={deactivateDate}
              onChange={(e) => setDeactivateDate(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1 pt-1">
            <Label className="font-medium text-xs">
              Reactivation Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={reactivationDate}
              onChange={(e) => setReactivationDate(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="w-full sm:w-auto h-9 text-xs font-medium"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin mr-2" /> : null}
              Schedule Deactivation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
