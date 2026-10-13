"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { appConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import { type CurrentUser, type LoginInput, loginSchema } from "@/lib/data-schemas";
import { useSessionStore } from "@/store";
import type { ApiResponse } from "@/types";

interface LoginApiResponseData {
  user?: CurrentUser;
}

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
        const res = await fetch(appConfig.routes.api.login, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parseResult.data),
        });

        const data = (await res.json().catch(() => ({}))) as ApiResponse<LoginApiResponseData> & {
          user?: CurrentUser;
          success?: boolean;
        };

        if (!res.ok || (data.status && data.status !== "SUCCESS" && !data.success)) {
          const message =
            data.message || data.errors?.[0] || "Authentication failed. Please check credentials.";
          setError(message);
          return null;
        }

        const authenticatedUser = data.data?.user || data.user;
        if (authenticatedUser) {
          // 3. Centralized Store sync
          setSession(authenticatedUser);
          logger.info(
            "Session initialized in store for",
            { userId: authenticatedUser.userId },
            "AUTH_FEATURE",
          );
        }

        // 4. Navigation
        if (authenticatedUser?.initLogin) {
          router.push(appConfig.routes.changePassword);
        } else {
          router.push(appConfig.routes.dashboard);
        }

        router.refresh();
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
