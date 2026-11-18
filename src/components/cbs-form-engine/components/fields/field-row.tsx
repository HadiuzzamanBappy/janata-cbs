/**
 * @fileoverview High-Density Banking Field Row Component
 * @module form-engine/field-row
 *
 * Core Invariants:
 * - Renders CBS standard 2-column (label : input) or stacked layout.
 * - Displays required indicator asterisk, index suffix, and enrich text tooltip.
 * - Read-only view mode renders clean monospace values with em-dash fallbacks.
 */

import { Info } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/core-utils";
import { useFormLayout } from "../form-layout-context";

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
  // Desktop horizontal: tooltip is triggered on underlined label text.
  // Mobile horizontal or Stacked mode: tooltip is triggered on the Info icon.
  const showTooltip = Boolean(enrichText && String(enrichText).trim().length > 0);
  const isDesktopTooltip = showTooltip && !isStacked;

  const labelContent = (
    <span
      className={cn(
        "group/label inline-flex items-center min-w-0 max-w-full select-none outline-none",
        isDesktopTooltip ? "sm:cursor-help" : "",
      )}
      title={error ? error : isDesktopTooltip ? undefined : label}
    >
      <span
        className={cn(
          "truncate pb-0.5 transition-colors duration-150 ease-out",
          isDesktopTooltip && [
            "sm:border-b sm:border-dotted",
            error
              ? "sm:border-destructive/40 sm:group-hover/label:border-destructive text-destructive font-semibold"
              : "sm:border-muted-foreground/25 sm:group-hover/label:border-primary sm:group-hover/label:text-foreground text-muted-foreground font-normal",
          ],
          !isDesktopTooltip &&
            (error ? "text-destructive font-semibold" : "text-muted-foreground font-normal"),
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
            <Tooltip disableHoverablePopup>
              <TooltipTrigger delay={350} closeDelay={100} render={labelContent} />
              <TooltipContent
                side="right"
                align="center"
                className="text-xs max-w-70 sm:max-w-xs z-50 shadow-md pointer-events-none"
              >
                {String(enrichText)}
              </TooltipContent>
            </Tooltip>
          ) : (
            labelContent
          )}

          {/* Stacked or Mobile View: Info icon with tap & click Popover */}
          {showTooltip && (
            <Popover>
              <PopoverTrigger
                openOnHover
                delay={120}
                closeDelay={100}
                render={
                  <button
                    type="button"
                    aria-label={`Help info for ${label}`}
                    className={cn(
                      "text-muted-foreground/60 hover:text-foreground items-center p-0.5 rounded shrink-0 cursor-pointer focus:outline-none",
                      isStacked ? "inline-flex" : "inline-flex sm:hidden",
                    )}
                  >
                    <Info className="size-3 text-muted-foreground/70 hover:text-foreground transition-colors" />
                  </button>
                }
              />
              <PopoverContent
                side="top"
                align="center"
                className="z-50 w-auto max-w-70 sm:max-w-xs text-xs px-2.5 py-1.5 bg-foreground text-background rounded-md shadow-md border-0 pointer-events-auto"
              >
                {String(enrichText)}
              </PopoverContent>
            </Popover>
          )}

          {indexSuffix !== undefined && (
            <span className="shrink-0 font-mono text-2xs text-muted-foreground/75 font-semibold">
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
          className={cn("min-w-0 flex items-center relative min-h-7", inputClassName)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
