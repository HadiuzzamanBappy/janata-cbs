"use client";

import { ChangePasswordForm } from "@/components/cbs-settings";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "../hooks/use-change-password";
import type { ChangePasswordProps } from "../types";

/** Forced first-login password change: the shared form plus this page's redirect and sign-out. */
export function ChangePassword({ className = "mt-8" }: ChangePasswordProps) {
  const { completeChange, cancelToLogin, canceling } = useChangePassword();

  return (
    <ChangePasswordForm
      className={className}
      onChanged={completeChange}
      disabled={canceling}
      footer={
        <Button
          type="button"
          variant="ghost"
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
          disabled={canceling}
          onClick={cancelToLogin}
        >
          {canceling ? "Signing out..." : "Sign in with a different account"}
        </Button>
      }
    />
  );
}
