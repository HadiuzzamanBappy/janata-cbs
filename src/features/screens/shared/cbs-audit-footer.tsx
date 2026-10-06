"use client";

import { ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CbsAuditRecord {
  recordStatus?: string;
  currNo?: number | string;
  inputter?: string | string[];
  dateTime?: string | string[];
  authoriser?: string;
  coCode?: string;
  deptCode?: string;
}

export interface CbsAuditFooterProps {
  audit?: CbsAuditRecord;
  className?: string;
}

/**
 * Standard Temenos T24 Audit Footer displaying record ledger state:
 * - REC.STATUS, CURR.NO, INPUTTER, DATE.TIME, AUTHORISER, CO.CODE
 */
export function CbsAuditFooter({ audit, className }: CbsAuditFooterProps) {
  if (!audit) return null;

  const inputterStr = Array.isArray(audit.inputter)
    ? audit.inputter.join(", ")
    : audit.inputter || "SYSTEM";

  const dateTimeStr = Array.isArray(audit.dateTime)
    ? audit.dateTime.join(", ")
    : audit.dateTime || "LIVE";

  return (
    <footer
      className={cn(
        "w-full border-t border-border/50 bg-muted/20 px-4 py-2 text-[11px] font-mono text-muted-foreground flex flex-wrap items-center justify-between gap-3 select-none",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        {audit.recordStatus && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/70 uppercase">Status:</span>
            <span className="font-semibold text-foreground px-1 py-0.5 rounded bg-muted/60 text-[10px]">
              {audit.recordStatus}
            </span>
          </div>
        )}

        {audit.currNo !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/70 uppercase">Rev:</span>
            <span className="text-foreground font-medium">#{audit.currNo}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <User className="size-3 text-muted-foreground/60" />
          <span className="text-muted-foreground/70 uppercase">Inputter:</span>
          <span className="text-foreground font-medium">{inputterStr}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {audit.authoriser && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3 text-emerald-500" />
            <span className="text-muted-foreground/70 uppercase">Auth:</span>
            <span className="text-foreground font-medium">{audit.authoriser}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70 uppercase">Timestamp:</span>
          <span className="text-foreground font-medium">{dateTimeStr}</span>
        </div>
      </div>
    </footer>
  );
}
