"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <div className="max-w-xl">
      <div className="bg-background rounded-lg border border-border/50 p-3.5 shadow-xs">
        <h3 className="text-xs font-semibold mb-2.5 text-foreground">Deactivate Account</h3>

        {error && (
          <Alert variant="destructive" className="mb-3 py-2 px-3 text-xs">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-3 py-2 px-3 text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400">
            <AlertDescription className="text-xs">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleDeactivate} className="space-y-2.5 max-w-sm">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              Deactivate Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={deactivateDate}
              onChange={(e) => setDeactivateDate(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              Reactivation Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={reactivationDate}
              onChange={(e) => setReactivationDate(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              variant="destructive"
              className="h-7.5 px-3 text-xs font-medium"
            >
              {loading ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
              Submit Deactivation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
