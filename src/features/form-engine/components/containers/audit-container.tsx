"use client";

import { cn } from "@/lib/core-utils";
import type { AuditData } from "@/lib/data-schemas";
import { FieldRow } from "../field-row";

export interface AuditContainerProps {
  auditData?: AuditData | null;
  className?: string;
}

/**
 * AuditContainer: Fixed banking audit trailer container.
 * Displays maker-checker, authorization, timestamps, and revision details.
 */
export function AuditContainer({ auditData, className }: AuditContainerProps) {
  const audit = auditData ?? {};
  const statusStr = String(audit.recStatus || "AU");
  const revisionStr = audit.recCurrNumber !== undefined ? String(audit.recCurrNumber) : "1";
  const branchStr = audit.recBranchCode || "JB0001";
  const inputterStr = audit.recInputter || "Current User";
  const authorizerStr = audit.recAuthorizer || "—";
  const inputTimeStr = audit.recInputTime || "—";
  const authTimeStr = audit.recAuthTime || "—";

  return (
    <div className={cn("pt-3 border-t border-border/40 flex flex-col gap-2 text-xs", className)}>
      <FieldRow
        label="Record Status"
        isViewMode
        viewDisplayValue={statusStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>

      <FieldRow
        label="Revision No"
        isViewMode
        viewDisplayValue={revisionStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>

      <FieldRow
        label="Branch Code"
        isViewMode
        viewDisplayValue={branchStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>

      <FieldRow
        label="Inputter (Maker)"
        isViewMode
        viewDisplayValue={inputterStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>

      <FieldRow
        label="Input Time"
        isViewMode
        viewDisplayValue={inputTimeStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>

      <FieldRow
        label="Authorizer"
        isViewMode
        viewDisplayValue={authorizerStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>

      <FieldRow
        label="Auth Time"
        isViewMode
        viewDisplayValue={authTimeStr}
        inputClassName="w-full sm:max-w-md"
      >
        <span />
      </FieldRow>
    </div>
  );
}
