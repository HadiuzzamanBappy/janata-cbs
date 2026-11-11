"use client";

import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/core-utils";
import { MIN_PASSWORD_LENGTH } from "@/lib/data-schemas";
import { useChangePassword } from "../hooks/use-change-password";
import type { ChangePasswordProps } from "../types";

/* -------------------------------------------------------------------------- */
/* Password rule definitions (mirrors changePasswordSchema in auth-schema.ts) */
/* -------------------------------------------------------------------------- */

const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    test: (v: string) => v.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: "digit",
    label: "One number (0–9)",
    test: (v: string) => /\d/.test(v),
  },
  {
    id: "special",
    label: `One special character (!@#$%^&*…)`,
    test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Sub-component: live password checklist                                      */
/* -------------------------------------------------------------------------- */

function PasswordChecklist({ value }: { value: string }) {
  if (!value) return null;
  return (
    <ul className="mt-1.5 space-y-0.5">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              passed ? "text-primary" : "text-muted-foreground",
            )}
          >
            {passed ? (
              <Check className="size-3 shrink-0" />
            ) : (
              <X className="size-3 shrink-0 opacity-40" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: confirm match indicator                                       */
/* -------------------------------------------------------------------------- */

function MatchIndicator({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const matched = password === confirm;
  return (
    <p
      className={cn(
        "mt-1.5 flex items-center gap-1 text-xs",
        matched ? "text-primary" : "text-destructive",
      )}
    >
      {matched ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
      {matched ? "Passwords match" : "Passwords do not match"}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: masked input with eye toggle                                  */
/* -------------------------------------------------------------------------- */

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
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
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
          className="h-9 text-xs pr-8 focus-visible:ring-0 focus-visible:border-ring"
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

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function ChangePassword({ className = "mt-8 space-y-5" }: ChangePasswordProps) {
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const { changePassword, cancelToLogin, loading, canceling, error, setError } =
    useChangePassword();

  const busy = loading || canceling;
  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPassed && passwordsMatch && oldPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
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

      {/* Current password — no checklist */}
      <MaskedField
        id="oldPassword"
        label="Current Password"
        value={oldPassword}
        onChange={setOldPassword}
        disabled={busy}
        autoComplete="current-password"
      />

      {/* New password — live rule checklist appears while typing */}
      <MaskedField
        id="newPassword"
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        disabled={busy}
        autoComplete="new-password"
      >
        <PasswordChecklist value={newPassword} />
      </MaskedField>

      {/* Confirm — live match indicator */}
      <MaskedField
        id="confirmPassword"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={busy}
        autoComplete="new-password"
      >
        <MatchIndicator password={newPassword} confirm={confirmPassword} />
      </MaskedField>

      <div className="space-y-2">
        <Button
          type="submit"
          size="sm"
          className="w-full h-9 font-medium text-xs"
          disabled={busy || !canSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
          disabled={busy}
          onClick={cancelToLogin}
        >
          {canceling ? "Signing out..." : "Sign in with a different account"}
        </Button>
      </div>
    </form>
  );
}
