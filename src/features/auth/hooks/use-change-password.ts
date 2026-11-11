"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { clientConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { type ChangePasswordInput, changePasswordSchema } from "@/lib/data-schemas";
import { useSessionStore } from "@/store";

export function useChangePassword() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const [loading, setLoading] = React.useState(false);
  const [canceling, setCanceling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const changePassword = React.useCallback(
    async (payload: ChangePasswordInput) => {
      setError(null);

      // 1. Zod input validation
      const parseResult = changePasswordSchema.safeParse(payload);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.issues[0]?.message || "Invalid password data";
        setError(errorMsg);
        return false;
      }

      setLoading(true);

      try {
        // 2. Fetch using centralized config route
        const res = await fetch(clientConfig.routes.api.changePassword, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: parseResult.data.oldPassword,
            newPassword: parseResult.data.newPassword,
            confirmPassword: parseResult.data.confirmPassword,
          }),
        });

        const data: ApiResponse = await res.json().catch(() => ({
          status: "ERROR",
          statusCode: 500,
          timestamp: new Date().toISOString(),
        }));

        if (!res.ok || (data.status && data.status !== "SUCCESS")) {
          const message = data.message || "Failed to update password";
          setError(message);
          return false;
        }

        // Sync client session state before entering workbench
        if (user) {
          setSession({ ...user, initLogin: false });
        }

        // 3. Replace history so browser Back cannot return to /change-password
        router.replace(clientConfig.routes.dashboard);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected network error occurred";
        setError(message);
        logger.error("Change password attempt failed", err, "AUTH_FEATURE");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router, setSession, user],
  );

  const cancelToLogin = React.useCallback(async () => {
    setCanceling(true);
    try {
      await fetch(clientConfig.routes.api.logout, { method: "POST" });
    } catch (err: unknown) {
      logger.error("Logout during change-password cancel failed", err, "AUTH_FEATURE");
    } finally {
      clearSession();
      router.replace(clientConfig.routes.login);
      setCanceling(false);
    }
  }, [clearSession, router]);

  return {
    changePassword,
    cancelToLogin,
    loading,
    canceling,
    error,
    setError,
  };
}
