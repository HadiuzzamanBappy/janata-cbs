import { Info } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  inputClassName?: string;
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
  inputClassName,
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
          // Desktop: dotted underline indicating hover help. Mobile: underline hidden, Info icon displayed instead.
          showTooltip
            ? "cursor-help sm:underline decoration-dotted decoration-muted-foreground underline-offset-4"
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
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
      {/* Label Column: Full-width top row on mobile, 144px (w-36) left column on desktop */}
      <div
        className={cn(
          "w-full sm:w-36 shrink-0 flex items-center justify-between text-xs select-none font-normal min-h-6 sm:min-h-7 sm:pt-1",
          labelClassName,
        )}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {showTooltip ? (
            <Tooltip>
              <TooltipTrigger render={labelContent} />
              <TooltipContent
                side="right"
                align="center"
                className="text-xs max-w-70 sm:max-w-xs z-50 shadow-md"
              >
                {String(enrichText)}
              </TooltipContent>
            </Tooltip>
          ) : (
            labelContent
          )}

          {/* Touch Info Popover: Triggers reliably on click/tap for tablet and mobile inspect mode */}
          {showTooltip && (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Help info for ${label}`}
                    className="sm:hidden text-muted-foreground/60 hover:text-foreground inline-flex items-center p-0.5 rounded shrink-0 cursor-pointer focus:outline-none"
                  >
                    <Info className="size-3 text-muted-foreground/70" />
                  </button>
                }
              />
              <PopoverContent
                side="top"
                align="start"
                className="w-auto max-w-70 p-2 text-xs leading-relaxed z-50 shadow-lg bg-foreground text-background"
              >
                {String(enrichText)}
              </PopoverContent>
            </Popover>
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

      {/* Colon separator: hidden on mobile stacked layout, visible on desktop */}
      <span className="hidden sm:inline-block text-muted-foreground/60 font-mono text-xs shrink-0 pt-1 select-none">
        :
      </span>

      {/* Input or View Badge */}
      {isViewMode ? (
        <div
          style={style}
          className={cn(
            "min-h-7 flex items-center px-2 rounded text-xs bg-muted/15 border border-border/80 font-mono text-foreground font-medium select-text w-full sm:w-auto",
            inputClassName,
          )}
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
        <div
          style={style}
          className={cn("min-w-0 flex items-center w-full relative min-h-7", inputClassName)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
