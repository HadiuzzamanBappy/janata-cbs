"use client";

import * as React from "react";
import { useSessionStore } from "@/store";
import { parseAccessibilityRights } from "./accessibility";
import { evaluateCbsAccess } from "./record-guard";
import type { CbsAccessContext, CbsAccessResult } from "./types";

/**
 * Universal React hook to evaluate active user's Core Banking accessibility & capabilities.
 * Automatically extracts the user session profile, parses RIDASH rights, and computes
 * button permissions, Four-Eyes compliance, and read-only flags for the given record context.
 */
export function useCbsAccess(context: CbsAccessContext = {}): CbsAccessResult {
  const user = useSessionStore((state) => state.user);
  const { command, recordStatus, recordInputter, mode } = context;

  const grantedRights = React.useMemo(() => {
    return parseAccessibilityRights(user?.accessibility ?? user?.functionRights);
  }, [user?.accessibility, user?.functionRights]);

  return React.useMemo(() => {
    return evaluateCbsAccess({
      userId: user?.userId,
      grantedRights,
      command,
      recordStatus,
      recordInputter,
      mode,
    });
  }, [user?.userId, grantedRights, command, recordStatus, recordInputter, mode]);
}
