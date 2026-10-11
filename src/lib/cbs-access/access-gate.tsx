"use client";

import type * as React from "react";
import type { CbsRecordFunction } from "@/types";
import { useCbsAccess } from "./use-cbs-access";

export interface CbsAccessGateProps {
  /** Required function right (e.g. "I", "A", "D", "R", "S") */
  require: CbsRecordFunction;
  /** Fallback content when access is denied */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

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
