"use client";

import * as React from "react";
import { type CbsAccessContext, type CbsAccessResult, evaluateCbsAccess } from "@/lib/cbs-access";
import { useSessionStore } from "@/store/session/session-provider";

/**
 * Universal React hook to evaluate active user's Core Banking accessibility & capabilities.
 * Bridges reactive SessionStore into the access evaluator.
 */
export function useCbsAccess(context: CbsAccessContext = {}): CbsAccessResult {
  const sessionUser = useSessionStore((state) => state.user);
  const user = context.user ?? sessionUser;
  const { recordStatus, recordInputter, mode, userId, grantedRights } = context;

  return React.useMemo(() => {
    return evaluateCbsAccess({
      recordStatus,
      recordInputter,
      mode,
      userId,
      grantedRights,
      user,
    });
  }, [recordStatus, recordInputter, mode, userId, grantedRights, user]);
}
