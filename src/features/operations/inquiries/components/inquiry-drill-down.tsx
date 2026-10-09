"use client";

import { toast } from "@/components/ui/toast";
import { OpsForm as FormScreen } from "@/features/operations/forms";
import type { CbsScreenMode } from "@/lib/cbs-screen";

export interface DrillRecord {
  formCommand: string;
  recordId: string;
  screenMode: CbsScreenMode;
  formData: Record<string, unknown>;
}

export interface InquiryDrillDownProps {
  drillRecord: DrillRecord;
  schemaTitle: string;
  onReturn: () => void;
  className?: string;
}

export function InquiryDrillDown({
  drillRecord,
  schemaTitle,
  onReturn,
  className = "",
}: InquiryDrillDownProps) {
  const modeBadgeColor =
    drillRecord.screenMode === "S"
      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
      : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <div className={`flex flex-col h-full w-full bg-background ${className}`}>
      {/* Breadcrumb navigation bar */}
      <nav className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/60 bg-muted/20 shrink-0 select-none">
        {/* Back crumb: Inquiry title */}
        <button
          type="button"
          onClick={onReturn}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors font-medium"
        >
          <span className="text-[11px] leading-none">◀</span>
          <span>{schemaTitle}</span>
        </button>

        {/* Separator */}
        <span className="text-muted-foreground/40 text-xs select-none">›</span>

        {/* Current crumb: Record ID + mode badge */}
        <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
          {drillRecord.recordId}
          <span
            className={`text-[9px] font-mono px-1 py-0 rounded border font-medium ${modeBadgeColor}`}
          >
            {drillRecord.screenMode}
          </span>
        </span>
      </nav>

      {/* FormScreen renders inline — opens in the correct VIEW/EDIT state with record pre-loaded */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <FormScreen
          command={drillRecord.formCommand}
          initialValues={drillRecord.formData}
          initialScreenMode={drillRecord.screenMode}
          initialRecordId={drillRecord.recordId}
          onReturn={onReturn}
          onSuccess={() => {
            onReturn();
            toast.add({
              title: "Saved",
              description: `Record saved. Returning to ${schemaTitle} list.`,
              type: "success",
            });
          }}
        />
      </div>
    </div>
  );
}
