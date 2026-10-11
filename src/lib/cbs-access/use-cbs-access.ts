"use client";

import * as React from "react";
import { getCommandAdapter } from "@/lib/cbs-command";
import { parseAccessibilityRights } from "./accessibility";
import { evaluateCbsAccess } from "./record-guard";
import type { CbsAccessContext, CbsAccessResult } from "./types";

/* -------------------------------------------------------------------------- */
/* Universal Core Banking Access Hook                                         */
/* -------------------------------------------------------------------------- */

/**
 * Universal React hook to evaluate active user's Core Banking accessibility & capabilities.
 * Automatically resolves the active user profile via the decoupled CommandAdapter (or context override),
 * parses RIDASH rights, and computes button permissions, Four-Eyes compliance, and read-only flags.
 */
export function useCbsAccess(context: CbsAccessContext = {}): CbsAccessResult {
  const adapter = getCommandAdapter();
  const user = context.user ?? adapter.getCurrentUser?.();
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
