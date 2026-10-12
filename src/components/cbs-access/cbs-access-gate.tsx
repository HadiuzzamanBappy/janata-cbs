"use client";

import type * as React from "react";
import { useCbsAccess } from "@/lib/cbs-access";
import type { CbsRecordFunction } from "@/types";

/* -------------------------------------------------------------------------- */
/* Access Boundary Props                                                      */
/* -------------------------------------------------------------------------- */

export interface CbsAccessGateProps {
  /** Required function right (e.g. "I", "A", "D", "R", "S") */
  readonly require: CbsRecordFunction;
  /** Fallback content when access is denied */
  readonly fallback?: React.ReactNode;
  readonly children: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Declarative Access Boundary Component                                      */
/* -------------------------------------------------------------------------- */

/**
 * Declarative access boundary.
 * Renders children only if user's accessibility profile grants the required function code.
 */
export function CbsAccessGate({
  require: requiredCode,
  fallback = null,
  children,
}: CbsAccessGateProps) {
  const { hasFunctionRight } = useCbsAccess();
  if (!hasFunctionRight(requiredCode)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
