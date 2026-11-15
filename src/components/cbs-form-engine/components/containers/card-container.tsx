/**
 * @fileoverview Card container for CBS dynamic form sections.
 * Renders individual form sections with configurable variants (default, subtle, bordered,
 * elevated, ghost), density settings, section badges, and collapsible state.
 *
 * @module features/form-engine/components/containers/card-container
 */

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useContext, useState } from "react";
import { cn } from "@/lib/core-utils";
import { CbsRecordFunction } from "@/types";
import { FormKernelContext } from "../../store/form-kernel-provider";
import type { SectionCardProps } from "../../types";
import { FieldGrid } from "../fields/field-grid";
import { useFormLayout } from "../form-layout-context";

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
  mode = CbsRecordFunction.INPUT,
  hideHeader = false,
}: CardContainerProps) {
  const hasKernel = Boolean(useContext(FormKernelContext));
  const { density: rootDensity } = useFormLayout();
  const isCollapsible = Boolean(section.collapsible);
  const [collapsed, setCollapsed] = useState<boolean>(
    isCollapsible ? (section.isCollapsed ?? false) : false,
  );

  const numCols = section.columns || 1;
  const isViewMode = mode !== CbsRecordFunction.INPUT;
  const config = section.containerConfig || {};
  const hasHeader = Boolean(section.title?.trim() || isCollapsible || config.badge);

  // Check if this section is an explicit card container (titled, multi-field, collapsible, or explicitly bordered)
  const isExplicitContainer = Boolean(
    hasHeader ||
      config.showHeader ||
      config.bordered === true ||
      config.background === "subtle" ||
      config.variant === "bordered" ||
      config.variant === "subtle" ||
      config.variant === "elevated" ||
      (section.fields && section.fields.length > 1),
  );

  // Check if embedded inside a Tab Group (via hideHeader or containerType === "tab")
  const isEmbeddedTab = hideHeader || section.containerType === "tab";

  // Resolve background (new background property takes precedence, falls back to legacy variant)
  const bg =
    config.background ??
    (config.variant === "ghost" ? "none" : config.variant === "subtle" ? "subtle" : "regular");

  // Resolve border (new bordered property takes precedence, falls back to legacy variant)
  const isBordered = config.bordered !== undefined ? config.bordered : config.variant !== "ghost";

  // Resolve header visibility (hideHeader prop takes precedence, then config.showHeader, then legacy check)
  const shouldShowHeader =
    !hideHeader &&
    (config.showHeader !== undefined ? config.showHeader : hasHeader && config.variant !== "ghost");

  const effectiveDensity = config.density || rootDensity || "compact";

  // Resolve container styling based on containerConfig
  const getContainerClasses = () => {
    // 1. Inside a Tab Group, fields sit directly in the tab body without a duplicate inner card border/background
    if (isEmbeddedTab) {
      return isViewMode ? "space-y-1.5" : "space-y-2";
    }

    // 2. Standalone field rows (untitled single-field blocks at root canvas level) render seamlessly without a card box
    if (!isExplicitContainer) {
      return isViewMode ? "space-y-1.5" : "space-y-2";
    }

    // 3. Ghost / transparent frameless containers
    if ((bg === "none" && !isBordered && !shouldShowHeader) || config.variant === "ghost") {
      return isViewMode ? "space-y-1.5" : "space-y-2";
    }

    const isAccordionCollapsed = isCollapsible && collapsed;

    if (isAccordionCollapsed) {
      return cn(
        "rounded border border-transparent bg-muted/20 hover:bg-muted/35 px-2.5 py-1.5 transition-colors cursor-pointer",
        config.customClass,
      );
    }

    const borderClass = !isBordered
      ? "border-transparent"
      : config.variant === "bordered"
        ? "border-2 border-border"
        : config.variant === "subtle" || bg === "subtle"
          ? "border border-border/60"
          : "border border-border/80";

    const bgClass =
      bg === "none"
        ? "bg-transparent"
        : bg === "subtle"
          ? "bg-muted/20"
          : config.variant === "bordered"
            ? "bg-card"
            : "bg-card/60";

    const shadowClass =
      config.variant === "elevated"
        ? "shadow-sm"
        : bg === "none" || !isBordered
          ? ""
          : "shadow-2xs";

    const densityClasses = {
      compact: isViewMode ? "px-2.5 py-1.5 space-y-1.5" : "p-2.5 space-y-2",
      normal: isViewMode ? "px-3 py-2 space-y-2" : "p-3 space-y-2.5",
      spacious: "p-4 space-y-3",
    }[effectiveDensity];

    return cn("rounded", borderClass, bgClass, shadowClass, densityClasses, config.customClass);
  };

  return (
    <div className={getContainerClasses()}>
      {/* Section Header */}
      {shouldShowHeader && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 min-w-0 select-none",
            !collapsed ? "pb-1.5 border-b border-border/40" : "",
          )}
        >
          {isCollapsible ? (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-between gap-2 w-full text-left rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors group"
              title={collapsed ? "Expand section" : "Collapse section"}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {collapsed ? (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
                {section.title && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap text-foreground/90 group-hover:text-foreground">
                    {section.title}
                  </span>
                )}
                {section.description && (
                  <span
                    className="text-[11px] text-muted-foreground/60 font-normal truncate min-w-0"
                    title={section.description}
                  >
                    &bull; {section.description}
                  </span>
                )}
              </div>

              {/* Optional Badge */}
              {config.badge && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded-full shrink-0 whitespace-nowrap",
                    config.badgeVariant === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : config.badgeVariant === "outline"
                        ? "border border-border text-foreground"
                        : config.badgeVariant === "secondary"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary/10 text-primary",
                  )}
                >
                  {config.badge}
                </span>
              )}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {section.title && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 whitespace-nowrap">
                    {section.title}
                  </span>
                )}
                {section.description && (
                  <span
                    className="text-[11px] text-muted-foreground/60 font-normal truncate min-w-0"
                    title={section.description}
                  >
                    &bull; {section.description}
                  </span>
                )}
              </div>

              {/* Optional Badge */}
              {config.badge && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded-full shrink-0 whitespace-nowrap",
                    config.badgeVariant === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : config.badgeVariant === "outline"
                        ? "border border-border text-foreground"
                        : config.badgeVariant === "secondary"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary/10 text-primary",
                  )}
                >
                  {config.badge}
                </span>
              )}
            </>
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
