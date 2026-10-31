import type { CSSProperties, ReactNode } from "react";
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
  labelClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function FieldRow({
  id: _id,
  label,
  required = false,
  error,
  isViewMode = false,
  viewDisplayValue,
  labelSuffix,
  actionBeforeColon,
  indexSuffix,
  enrichText,
  labelClassName,
  style,
  children,
}: FieldRowProps) {
  // Tooltip only for enrichText
  const showTooltip = Boolean(enrichText && String(enrichText).trim().length > 0);

  const labelContent = (
    <span className="inline-flex items-center min-w-0 max-w-full" title={error || label}>
      <span
        className={cn(
          "truncate pb-0.5",
          showTooltip
            ? "cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4"
            : "",
          error ? "text-destructive font-semibold" : "text-muted-foreground font-normal",
        )}
      >
        {label}
      </span>
      {required && !isViewMode && (
        <span className="text-destructive font-semibold ml-0.5 select-none no-underline shrink-0">
          *
        </span>
      )}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Label Column */}
      <div
        className={cn(
          "w-36 shrink-0 flex items-center justify-between text-xs select-none font-normal",
          labelClassName,
        )}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {showTooltip ? (
            <Tooltip>
              <TooltipTrigger render={labelContent} />
              <TooltipContent side="right" className="text-xs max-w-xs z-50">
                {String(enrichText)}
              </TooltipContent>
            </Tooltip>
          ) : (
            labelContent
          )}

          {indexSuffix !== undefined && (
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground/75 font-semibold">
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
        <div style={style} className="min-w-0 flex items-center max-w-full flex-1">
          {children}
        </div>
      )}
    </div>
  );
}
