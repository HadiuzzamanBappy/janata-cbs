/**
 * @fileoverview Card container for CBS dynamic form sections.
 * Renders individual form sections with configurable variants (default, subtle, bordered,
 * elevated, ghost), density settings, section badges, and collapsible state.
 *
 * @module features/form-engine/components/containers/card-container
 */

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/core-utils";
import { CbsRecordFunction } from "@/types";
import type { SectionCardProps } from "../../types";
import { FieldGrid } from "../fields/field-grid";
import { FORM_DENSITY_CLASSES, useFormLayout } from "../form-layout-context";

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
  const { density: rootDensity } = useFormLayout();
  const isCollapsible = Boolean(section.collapsible);
  const [collapsed, setCollapsed] = useState<boolean>(
    isCollapsible ? (section.isCollapsed ?? false) : false,
  );

  const numCols = section.columns || 1;
  const isViewMode = mode !== CbsRecordFunction.INPUT;
  const config = section.containerConfig || {};
  const variant = config.variant ?? "default";
  const hasHeader = Boolean(section.title?.trim() || isCollapsible || config.badge);

  // Explicit card container when titled, multi-field, collapsible, or non-default non-ghost preset
  const isExplicitContainer = Boolean(
    hasHeader ||
      (variant !== "default" && variant !== "ghost") ||
      (section.fields && section.fields.length > 1),
  );

  // Embedded inside a Tab Group (via hideHeader or containerType === "tab")
  const isEmbeddedTab = hideHeader || section.containerType === "tab";

  const shouldShowHeader = !hideHeader && variant !== "ghost" && hasHeader;

  const effectiveDensity = config.density || rootDensity || "compact";
  const densityTokens = FORM_DENSITY_CLASSES[effectiveDensity];
  const stackGap = isViewMode ? densityTokens.stackView : densityTokens.stack;

  // Resolve container styling from single `containerConfig.variant`
  const getContainerClasses = () => {
    if (isEmbeddedTab || !isExplicitContainer || (variant === "ghost" && !shouldShowHeader)) {
      return stackGap;
    }

    const borderClass =
      variant === "subtle" ? "border border-border/60" : "border border-border/80";

    const isAccordionCollapsed = isCollapsible && collapsed;
    if (isAccordionCollapsed) {
      return cn(
        "rounded bg-muted/20 hover:bg-muted/35 p-2.5 transition-colors cursor-pointer",
        borderClass,
      );
    }

    const bgClass =
      variant === "bordered"
        ? "bg-transparent"
        : variant === "subtle"
          ? "bg-muted/20"
          : variant === "elevated"
            ? "bg-card"
            : "bg-card/60";

    const shadowClass =
      variant === "elevated" ? "shadow-sm" : variant === "default" ? "shadow-2xs" : "";

    const paddingClass = isViewMode ? densityTokens.cardPaddingView : densityTokens.cardPadding;

    return cn("rounded", borderClass, bgClass, shadowClass, paddingClass, stackGap);
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
                  <span className="text-2xs font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap text-foreground/90 group-hover:text-foreground">
                    {section.title}
                  </span>
                )}
                {section.description && (
                  <span
                    className="text-2xs text-muted-foreground/60 font-normal truncate min-w-0"
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
                    "inline-flex items-center px-1.5 py-0.2 text-3xs font-medium rounded-full shrink-0 whitespace-nowrap",
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
                  <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 whitespace-nowrap">
                    {section.title}
                  </span>
                )}
                {section.description && (
                  <span
                    className="text-2xs text-muted-foreground/60 font-normal truncate min-w-0"
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
                    "inline-flex items-center px-1.5 py-0.2 text-3xs font-medium rounded-full shrink-0 whitespace-nowrap",
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
        />
      )}
    </div>
  );
}
