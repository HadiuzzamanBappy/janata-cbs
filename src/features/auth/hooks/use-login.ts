"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { clientConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { type CurrentUser, type LoginInput, loginSchema } from "@/lib/data-schemas";
import { useSessionStore } from "@/store";

export function useLogin() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const login = React.useCallback(
    async (credentials: LoginInput): Promise<CurrentUser | null> => {
      setError(null);

      // 1. Zod input validation
      const parseResult = loginSchema.safeParse(credentials);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.issues[0]?.message || "Invalid credentials format";
        setError(errorMsg);
        return null;
      }

      setLoading(true);

      try {
        // 2. Fetch using centralized config route
        const res = await fetch(clientConfig.routes.api.login, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parseResult.data),
        });

        const data = (await res.json().catch(() => ({}))) as ApiResponse<CurrentUser>;

        if (!res.ok || (data.status && data.status !== "SUCCESS" && !data.success)) {
          const message =
            data.message || data.errors?.[0] || "Authentication failed. Please check credentials.";
          setError(message);
          return null;
        }

        const authenticatedUser = data.data;
        if (authenticatedUser) {
          // Reset client activity timestamp to current time on login
          if (typeof window !== "undefined") {
            localStorage.setItem(clientConfig.storage.local.lastActivity, String(Date.now()));
          }
          // 3. Centralized Store sync
          setSession(authenticatedUser);
          logger.info(
            "Session initialized in store for",
            { userId: authenticatedUser.userId },
            "AUTH_FEATURE",
          );
        }

        // 4. Navigation — use replace so browser Back cannot bounce back to /login
        if (authenticatedUser?.initLogin) {
          router.replace(clientConfig.routes.changePassword);
        } else {
          router.replace(clientConfig.routes.dashboard);
        }
        return authenticatedUser ?? null;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected network error occurred";
        setError(message);
        logger.error("Login attempt failed", err, "AUTH_FEATURE");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [router, setSession],
  );

  return {
    login,
    loading,
    error,
    setError,
  };
}
