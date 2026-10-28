import type { CSSProperties, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/core-utils";

export interface FieldRowProps {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  isViewMode?: boolean;
  viewDisplayValue?: ReactNode;
  labelSuffix?: ReactNode;
  actionBeforeColon?: ReactNode;
  indexSuffix?: number | string;
  style?: CSSProperties;
  children: ReactNode;
}

export function FieldRow({
  id,
  label,
  required = false,
  error,
  isViewMode = false,
  viewDisplayValue,
  labelSuffix,
  actionBeforeColon,
  indexSuffix,
  style,
  children,
}: FieldRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {/* Label Column */}
        <div className="w-36 shrink-0 flex items-center justify-between gap-1 select-none">
          <div className="flex items-center gap-1 min-w-0">
            <Label
              htmlFor={id}
              className={cn(
                "text-xs truncate",
                error
                  ? "text-destructive font-semibold"
                  : required && !isViewMode
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
              )}
            >
              {label}
              {required && !isViewMode && (
                <span className="text-destructive font-bold ml-1">*</span>
              )}
            </Label>
            {indexSuffix !== undefined && (
              <span className="font-mono text-[11px] text-muted-foreground/75 font-semibold">
                .{indexSuffix}
              </span>
            )}
            {labelSuffix}
          </div>
          {actionBeforeColon}
        </div>

        {/* Colon separator */}
        <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

        {/* Input or View Badge */}
        {isViewMode ? (
          <div
            style={style}
            className="h-7 flex items-center px-2 rounded text-xs bg-muted/15 border border-border/80 font-mono text-foreground font-medium select-text"
          >
            {viewDisplayValue !== undefined &&
            viewDisplayValue !== null &&
            viewDisplayValue !== "" ? (
              <span className="truncate">{viewDisplayValue}</span>
            ) : (
              <span className="text-muted-foreground/50 italic text-[11px]">Not specified</span>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Field Error Message */}
      {error && !isViewMode && (
        <div className="text-[11px] text-destructive pl-40 font-medium">{error}</div>
      )}
    </div>
  );
}
