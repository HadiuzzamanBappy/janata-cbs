"use client";

import { Calendar, Hash, Shield, ShieldCheck, User } from "lucide-react";
import type { AuditData } from "@/lib/data-schemas";

export interface CbsAuditTabProps {
  formData: unknown;
  className?: string;
}

function getStatusBadgeClass(status: string) {
  const upper = status.toUpperCase();
  if (upper === "AU" || upper === "LIVE") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }
  if (upper === "HLD") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
  if (upper === "INA") {
    return "bg-primary/10 text-primary border-primary/20";
  }
  return "bg-muted text-muted-foreground border-border/60";
}

/**
 * Standard CBS Audit Trail Tab (Maker-Checker & Ledger Status).
 * Directly renders canonical AuditData from @/lib/data-schemas:
 * 1. Ledger & Audit Summary (recStatus, recCurrNumber, recBranchCode)
 * 2. Lifecycle Sign-off & Personnel (recInputter/Time, recAuthorizer/Time)
 */
export function CbsAuditTab({ formData, className = "" }: CbsAuditTabProps) {
  const rec = (formData as Record<string, unknown>) || {};
  const audit = ((rec.auditData as AuditData) || (rec as AuditData)) ?? {};
  const statusStr = String(audit.recStatus ?? "");
  const revisionStr = audit.recCurrNumber !== undefined ? `#${audit.recCurrNumber}` : "—";
  const branchStr = audit.recBranchCode || "—";

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <div className="max-w-3xl space-y-3">
        {/* 1. CBS Ledger & Audit Summary */}
        <div className="rounded-md border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                CBS Ledger & Audit Summary
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border ${getStatusBadgeClass(statusStr)}`}
            >
              STATUS: {statusStr || "LIVE"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Record Status */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-sm border border-border/50 bg-background/40 hover:bg-background/70 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="size-3 text-muted-foreground/70" />
                <span className="font-medium text-foreground text-xs whitespace-nowrap">
                  Record Status
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-muted/70 text-muted-foreground border border-border/50">
                  recStatus
                </span>
              </div>
              <div className="font-mono text-xs font-semibold shrink-0 pl-3 text-foreground">
                {statusStr || "LIVE"}
              </div>
            </div>

            {/* Current Revision */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-sm border border-border/50 bg-background/40 hover:bg-background/70 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Hash className="size-3 text-muted-foreground/70" />
                <span className="font-medium text-foreground text-xs whitespace-nowrap">
                  Current Sequence / Revision
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-muted/70 text-muted-foreground border border-border/50">
                  recCurrNumber
                </span>
              </div>
              <div className="font-mono text-xs font-semibold shrink-0 pl-3 text-primary">
                {revisionStr}
              </div>
            </div>

            {/* Operating Branch Code */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-sm border border-border/50 bg-background/40 hover:bg-background/70 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="size-3 text-muted-foreground/70" />
                <span className="font-medium text-foreground text-xs whitespace-nowrap">
                  Operating Company Code
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-muted/70 text-muted-foreground border border-border/50">
                  recBranchCode
                </span>
              </div>
              <div className="font-mono text-xs font-semibold shrink-0 pl-3 text-foreground">
                {branchStr}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Lifecycle Sign-off & Personnel Details */}
        <div className="rounded-md border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
            Lifecycle Sign-off & Personnel Details
          </div>

          <div className="space-y-2 text-xs">
            {/* Input Operator */}
            <div className="py-2 px-2.5 rounded-sm border border-border/50 bg-background/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-6 rounded-sm flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <User className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-xs whitespace-nowrap">
                      Input Operator
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-muted/70 text-muted-foreground border border-border/50">
                      recInputter
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    User ID responsible for initial draft input and security modifications
                  </div>
                </div>
              </div>

              <div className="text-right font-mono shrink-0 pl-2">
                <div
                  className={
                    audit.recInputter
                      ? "font-semibold text-foreground text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {audit.recInputter || "—"}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="size-2.5" />
                  <span>{audit.recInputTime || "—"}</span>
                </div>
              </div>
            </div>

            {/* Authorizing Supervisor */}
            <div className="py-2 px-2.5 rounded-sm border border-border/50 bg-background/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-6 rounded-sm flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-xs whitespace-nowrap">
                      Authorizing Supervisor
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-muted/70 text-muted-foreground border border-border/50">
                      recAuthorizer
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Dual-control supervisor signature confirming record approval
                  </div>
                </div>
              </div>

              <div className="text-right font-mono shrink-0 pl-2">
                <div
                  className={
                    audit.recAuthorizer
                      ? "font-semibold text-foreground text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {audit.recAuthorizer || "—"}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="size-2.5" />
                  <span>{audit.recAuthTime || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
