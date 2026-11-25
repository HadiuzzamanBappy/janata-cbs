"use client";

import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cbsAuth } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import { changePasswordSchema, isApiSuccess, MIN_PASSWORD_LENGTH } from "@/lib/data-schemas";

/** Live checklist rules; mirrors `changePasswordSchema`, which stays the authority on submit. */
const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    test: (v: string) => v.length >= MIN_PASSWORD_LENGTH,
  },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", label: "One number (0–9)", test: (v: string) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character (!@#$%^&*…)",
    test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
  },
] as const;

function RuleLine({ passed, label }: { passed: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 text-2xs",
        passed ? "text-primary" : "text-muted-foreground",
      )}
    >
      {passed ? (
        <Check className="size-3 shrink-0" />
      ) : (
        <X className="size-3 shrink-0 opacity-40" />
      )}
      {label}
    </li>
  );
}

interface MaskedFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  autoComplete: string;
  children?: React.ReactNode;
}

function MaskedField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  children,
}: MaskedFieldProps) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-2xs font-medium text-foreground">
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          autoComplete={autoComplete}
          className="h-8 text-xs pr-8 focus-visible:ring-0 focus-visible:border-foreground/50"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          tabIndex={-1}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        >
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      {children}
    </div>
  );
}

export interface ChangePasswordFormProps {
  /** Runs after the core accepted the new password. Without it, the form shows a success note. */
  onChanged?: () => void;
  /** Extra controls under the submit button (e.g. "sign in with a different account"). */
  footer?: React.ReactNode;
  /** Locks the form while the host is busy (e.g. signing out). */
  disabled?: boolean;
  className?: string;
}

/**
 * The single change-password form: the forced first-login screen and Settings → Security both use
 * it. Submits through `cbsAuth.changePassword` (`/api/change-password`, which runs CPW on the core).
 */
export function ChangePasswordForm({
  onChanged,
  footer,
  disabled = false,
  className,
}: ChangePasswordFormProps) {
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const busy = loading || disabled;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit =
    oldPassword.length > 0 && passwordsMatch && PASSWORD_RULES.every((r) => r.test(newPassword));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = changePasswordSchema.safeParse({ oldPassword, newPassword, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid password fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await cbsAuth.changePassword(parsed.data);
      if (!isApiSuccess(res)) {
        setError(res.message || res.errors?.[0] || "Failed to update password.");
        return;
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onChanged) onChanged();
      else setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2.5", className)}>
      {error && (
        <Alert variant="destructive" className="py-2 px-3">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2 px-3 border-success/30 text-success bg-success/10">
          <AlertDescription className="text-xs">Password successfully changed.</AlertDescription>
        </Alert>
      )}

      <MaskedField
        id="oldPassword"
        label="Current Password"
        value={oldPassword}
        onChange={setOldPassword}
        disabled={busy}
        autoComplete="current-password"
      />

      <MaskedField
        id="newPassword"
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        disabled={busy}
        autoComplete="new-password"
      >
        {newPassword && (
          <ul className="mt-1.5 space-y-0.5">
            {PASSWORD_RULES.map((rule) => (
              <RuleLine key={rule.id} passed={rule.test(newPassword)} label={rule.label} />
            ))}
          </ul>
        )}
      </MaskedField>

      <MaskedField
        id="confirmPassword"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={busy}
        autoComplete="new-password"
      >
        {confirmPassword && (
          <ul className="mt-1.5">
            <RuleLine
              passed={passwordsMatch}
              label={passwordsMatch ? "Passwords match" : "Passwords do not match"}
            />
          </ul>
        )}
      </MaskedField>

      <div className="space-y-2 pt-1">
        <Button
          type="submit"
          className="w-full h-8 text-xs font-medium"
          disabled={busy || !canSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
        {footer}
      </div>
    </form>
  );
}
