"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useContext, useState } from "react";
import { cn } from "@/lib/core-utils";
import { FormKernelContext } from "../../store/form-kernel-provider";
import type { SectionCardProps } from "../../types";
import { FieldGrid } from "../field-grid";

export type CardContainerProps = SectionCardProps;

/**
 * CardContainer renders 'card' container types.
 * Supports configurable variants (default, subtle, bordered, elevated, ghost),
 * density (compact, normal, spacious), badges, and collapsible state.
 */
export function CardContainer({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  hideHeader = false,
}: CardContainerProps) {
  const hasKernel = Boolean(useContext(FormKernelContext));
  const isCollapsible = Boolean(section.collapsible);
  const [collapsed, setCollapsed] = useState<boolean>(
    isCollapsible ? (section.isCollapsed ?? false) : false,
  );

  const numCols = section.columns || 1;
  const isViewMode = mode !== "I";
  const config = section.containerConfig || {};

  const hasHeader = Boolean(section.title || isCollapsible || config.badge);

  // Resolve container styling based on containerConfig
  const getContainerClasses = () => {
    if (hideHeader || !hasHeader) {
      return isViewMode ? "space-y-1.5" : "space-y-2";
    }

    const variantClasses = {
      default: "border border-border/80 bg-card/60 shadow-2xs",
      subtle: "border border-border/40 bg-muted/20",
      bordered: "border-2 border-border bg-card",
      elevated: "border border-border/80 bg-card shadow-sm",
      ghost: "border-transparent bg-transparent",
    }[config.variant || "default"];

    const densityClasses = {
      compact: isViewMode ? "px-3 py-2 space-y-1.5" : "p-3 space-y-2.5",
      normal: isViewMode ? "px-4 py-3 space-y-2" : "p-4 space-y-3",
      spacious: "p-5 space-y-4",
    }[config.density || "compact"];

    return cn(
      "rounded transition-all duration-150",
      variantClasses,
      densityClasses,
      config.customClass,
    );
  };

  return (
    <div className={getContainerClasses()}>
      {/* Section Header */}
      {!hideHeader && (section.title || isCollapsible || config.badge) && (
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            {isCollapsible && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                {collapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            )}
            {section.title && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </span>
            )}
            {section.description && (
              <span className="text-[11px] text-muted-foreground/60 font-normal">
                &bull; {section.description}
              </span>
            )}
          </div>

          {/* Optional Badge */}
          {config.badge && (
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded-full",
                config.badgeVariant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : config.badgeVariant === "outline"
                    ? "border border-border text-foreground"
                    : "bg-primary/10 text-primary",
              )}
            >
              {config.badge}
            </span>
          )}
        </div>
      )}

      {/* Grid containing fields */}
      {!collapsed && (
        <FieldGrid
          section={section}
          values={values}
          onChange={onChange}
          errors={errors}
          disabled={disabled}
          mode={mode}
          numCols={numCols}
          hasKernel={hasKernel}
        />
      )}
    </div>
  );
}
