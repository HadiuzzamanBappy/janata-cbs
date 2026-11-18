"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { cbsAuth } from "@/lib/cbs-client";
import { clientConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import { useSessionStore } from "@/store";

/** Navigation for the forced first-login change; the form itself is `ChangePasswordForm`. */
export function useChangePassword() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const [canceling, setCanceling] = React.useState(false);

  /** After the core accepted the new password: lift the client lock and enter the workbench. */
  const completeChange = React.useCallback(() => {
    if (user) setSession({ ...user, initLogin: false });
    // Replace history so browser Back cannot return to /change-password
    router.replace(clientConfig.routes.dashboard);
  }, [router, setSession, user]);

  const cancelToLogin = React.useCallback(async () => {
    setCanceling(true);
    try {
      await cbsAuth.logout();
    } catch (err: unknown) {
      logger.error("Logout during change-password cancel failed", err, "AUTH_FEATURE");
    } finally {
      clearSession();
      router.replace(clientConfig.routes.login);
      setCanceling(false);
    }
  }, [clearSession, router]);

  return { completeChange, cancelToLogin, canceling };
}
