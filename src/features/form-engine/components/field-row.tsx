import { Info } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/core-utils";
import { useFormLayout } from "./form-layout-context";

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
  stacked?: boolean;
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
  stacked,
  style,
  children,
}: FieldRowProps) {
  const { layout: contextLayout } = useFormLayout();
  const isStacked = stacked ?? contextLayout === "stacked";

  // Tooltip only for enrichText:
  // Desktop mode: tooltip is triggered on the underlined label text.
  // Stacked/mobile mode: tooltip is triggered ONLY on the Info icon (label is plain).
  const showTooltip = Boolean(enrichText && String(enrichText).trim().length > 0);
  const isDesktopTooltip = showTooltip && !isStacked;
  const isIconTooltip = showTooltip && isStacked;

  const labelContent = (
    <span className="inline-flex items-center min-w-0 max-w-full" title={error || label}>
      <span
        className={cn(
          "truncate pb-0.5",
          // Dotted underline ONLY in desktop mode when label itself triggers the tooltip
          isDesktopTooltip
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
    <div
      className={
        isStacked
          ? "flex flex-col gap-1 w-full"
          : cn(
              "flex flex-col sm:flex-row sm:items-start gap-1",
              isViewMode ? "sm:gap-2 leading-none" : "sm:gap-2",
            )
      }
    >
      {/* Label Column: Full-width top row on mobile or when stacked, 144px (w-36) left column on desktop */}
      <div
        className={cn(
          isStacked ? "w-full" : "w-full sm:w-36",
          "shrink-0 flex items-center justify-between text-xs select-none font-normal",
          isViewMode ? "min-h-5 sm:min-h-5.5 pt-0.5" : "min-h-6 sm:min-h-7 sm:pt-1",
          labelClassName,
        )}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Desktop Mode: Tooltip on label text hover */}
          {isDesktopTooltip ? (
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

          {/* Stacked/Mobile Mode: Tooltip ONLY on the Info icon (triggers on desktop hover and mobile tap) */}
          {isIconTooltip && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Help info for ${label}`}
                    className="text-muted-foreground/60 hover:text-foreground inline-flex items-center p-0.5 rounded shrink-0 cursor-help focus:outline-none"
                  >
                    <Info className="size-3 text-muted-foreground/70 hover:text-foreground transition-colors" />
                  </button>
                }
              />
              <TooltipContent
                side="top"
                align="center"
                className="text-xs max-w-70 sm:max-w-xs z-50 shadow-md"
              >
                {String(enrichText)}
              </TooltipContent>
            </Tooltip>
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
      {!isStacked && (
        <span
          className={cn(
            "hidden sm:inline-block text-muted-foreground/60 font-mono text-xs shrink-0 select-none",
            isViewMode ? "pt-0.5" : "pt-1",
          )}
        >
          :
        </span>
      )}

      {/* Input or Pure Text View */}
      {isViewMode ? (
        <div
          style={style}
          className={cn(
            "min-h-5 sm:min-h-5.5 flex items-center text-xs font-mono text-foreground font-medium select-text pt-0.5",
            inputClassName,
          )}
        >
          {viewDisplayValue !== undefined &&
          viewDisplayValue !== null &&
          viewDisplayValue !== "" ? (
            <span className="truncate">{viewDisplayValue}</span>
          ) : (
            <span className="text-muted-foreground/40 font-mono select-none">—</span>
          )}
        </div>
      ) : (
        <div
          style={style}
          className={cn(
            "min-w-0 flex items-center w-full relative min-h-7",
            isStacked ? "w-full" : inputClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
