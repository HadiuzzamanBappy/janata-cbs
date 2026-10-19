"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { appConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import { type ChangePasswordInput, changePasswordSchema } from "@/lib/data-schemas";
import type { ApiResponse } from "@/types";

export function useChangePassword() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
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
        const res = await fetch(appConfig.routes.api.changePassword, {
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

        // 3. Navigation to dashboard
        router.push(appConfig.routes.dashboard);
        router.refresh();
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
    [router],
  );

  return {
    changePassword,
    loading,
    error,
    setError,
  };
}
