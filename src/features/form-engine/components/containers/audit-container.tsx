/**
 * @fileoverview Fixed banking audit trailer container for CBS dynamic forms.
 * Displays maker-checker authorization trails, branch codes, revision numbers,
 * and operation timestamps using standard FieldRow components.
 *
 * @module features/form-engine/components/containers/audit-container
 */

"use client";

import { cn, formatNameToLabel } from "@/lib/core-utils";
import type { AuditData } from "@/lib/data-schemas";
import { FieldRow } from "../fields/field-row";

export interface AuditContainerProps {
  auditData?: AuditData | null;
  className?: string;
  variant?: "inline" | "card";
}

interface AuditFieldSpec {
  key: keyof AuditData;
  label?: string;
  enrichText: string;
  defaultFallback?: string;
}

const AUDIT_FIELD_SPECS: readonly AuditFieldSpec[] = [
  {
    key: "recStatus",
    label: "Record Status",
    enrichText:
      "Lifecycle status of this record (e.g. INAU = Unauthorized, AU/LIVE = Authorized, RNAU = Reverse Unauthorized).",
    defaultFallback: "AU",
  },
  {
    key: "recCurrNumber",
    label: "Revision No",
    enrichText: "Sequential version counter incremented on every record amendment.",
    defaultFallback: "1",
  },
  {
    key: "recBranchCode",
    enrichText: "Originating bank branch code where this record was booked.",
    defaultFallback: "JB0001",
  },
  {
    key: "recInputter",
    label: "Inputter",
    enrichText:
      "User ID of the maker who created or last modified this record under Four-Eyes control.",
    defaultFallback: "Current User",
  },
  {
    key: "recInputTime",
    label: "Input Time",
    enrichText: "Server timestamp when the maker submitted the record.",
  },
  {
    key: "recAuthorizer",
    label: "Authorizer",
    enrichText: "User ID of the supervisor who verified and approved the record (Checker).",
  },
  {
    key: "recAuthTime",
    label: "Authorizer Time",
    enrichText: "Server timestamp when the checker authorized the record.",
  },
] as const;

/**
 * AuditContainer: Fixed banking audit trailer container.
 * Displays maker-checker, authorization, timestamps, and revision details.
 * Supports "card" (enclosed card with header matching CBS form cards) and "inline" (default border-top).
 */
export function AuditContainer({ auditData, className, variant = "card" }: AuditContainerProps) {
  const audit = auditData ?? {};

  const rows = (
    <div className="flex flex-col gap-2 text-xs">
      {AUDIT_FIELD_SPECS.map(({ key, label: customLabel, enrichText, defaultFallback }) => {
        const label = customLabel || formatNameToLabel(key.replace(/^rec/, ""));
        const rawVal = audit[key];
        const displayValue =
          rawVal !== undefined && rawVal !== null && rawVal !== ""
            ? String(rawVal)
            : defaultFallback || "—";

        return (
          <FieldRow
            key={key}
            label={label}
            isViewMode
            viewDisplayValue={displayValue}
            enrichText={enrichText}
            inputClassName="w-full sm:max-w-md"
          >
            <span />
          </FieldRow>
        );
      })}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("pt-3 border-t border-border/40", className)}>{rows}</div>;
  }

  return (
    <div
      className={cn(
        "rounded border border-border/80 bg-card/60 shadow-2xs p-3 space-y-2.5",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Audit Trail & Record Information
        </span>
      </div>
      {rows}
    </div>
  );
}
