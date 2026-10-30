import type { CSSProperties, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  enrichText?: string;
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
  enrichText,
  style,
  children,
}: FieldRowProps) {
  // Tooltip only for enrichText
  const showTooltip = Boolean(enrichText);

  const labelCore = (
    <Label
      htmlFor={id}
      title={label}
      className={cn(
        "text-xs truncate min-w-0 block select-none",
        showTooltip &&
          "cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground hover:text-foreground transition-colors",
        error
          ? "text-destructive font-semibold"
          : required && !isViewMode
            ? "text-foreground font-medium"
            : "text-muted-foreground",
      )}
    >
      {label}
    </Label>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {/* Label Column */}
        <div className="w-36 shrink-0 flex items-center justify-between gap-1 select-none">
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            {showTooltip ? (
              <Tooltip>
                <TooltipTrigger
                  render={<div className="min-w-0 flex-1 truncate">{labelCore}</div>}
                />
                <TooltipContent side="right" className="text-xs max-w-xs z-50">
                  {enrichText}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="min-w-0 flex-1 truncate">{labelCore}</div>
            )}

            {indexSuffix !== undefined && (
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground/75 font-semibold">
                .{indexSuffix}
              </span>
            )}

            {required && !isViewMode && (
              <span className="shrink-0 text-destructive font-bold ml-0.5 select-none">*</span>
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
          <div style={style} className="min-w-0 flex items-center max-w-full flex-1">
            {children}
          </div>
        )}
      </div>

      {/* Field Error Message */}
      {error && !isViewMode && (
        <div className="text-[11px] text-destructive pl-40 font-medium">{error}</div>
      )}
    </div>
  );
}
