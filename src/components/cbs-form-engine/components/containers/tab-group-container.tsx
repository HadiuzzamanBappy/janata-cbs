/**
 * @fileoverview Tab group container for clustered CBS dynamic form sections.
 * Renders tab-grouped sections into a high-density banking workbench TabBar
 * with active badge indicators, error counts, and embedded CardContainer content.
 *
 * @module features/form-engine/components/containers/tab-group-container
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { CardContainer } from "./card-container";

export interface TabGroupContainerProps {
  groupId: string;
  tabSections: FormSection[];
  activeTabId: string;
  onTabChange: (groupId: string, tabId: string) => void;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

/**
 * TabGroupContainer renders clustered 'tab' container sections into a Workbench TabBar.
 * Supports configurable container properties, badges, and density.
 */
export function TabGroupContainer({
  groupId,
  tabSections,
  activeTabId,
  onTabChange,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = CbsRecordFunction.INPUT,
}: TabGroupContainerProps) {
  const currentActiveId = activeTabId || tabSections[0]?.id;
  const activeSection = tabSections.find((t) => t.id === currentActiveId) || tabSections[0];

  // Visual config from active tab or any configured tab in the group
  const activeConfig =
    tabSections.find(
      (t) =>
        t.containerConfig?.tabVariant ||
        t.containerConfig?.heightMode ||
        t.containerConfig?.minHeight,
    )?.containerConfig ||
    activeSection?.containerConfig ||
    {};
  const tabVariant = activeConfig.tabVariant || "card";
  const heightMode = activeConfig.heightMode || "auto";
  const minHeightStyle =
    heightMode === "fixed" && activeConfig.minHeight
      ? typeof activeConfig.minHeight === "number"
        ? `${activeConfig.minHeight}px`
        : activeConfig.minHeight
      : undefined;

  const containerVariantClass = {
    card: "rounded border border-border/80 bg-card/60 shadow-2xs",
    workbench: "rounded-none border-b border-border/80 bg-transparent shadow-none",
    pills: "rounded-lg border border-border/60 bg-muted/20 shadow-2xs",
  }[tabVariant];

  const containerHeightClass = {
    auto: "shrink-0",
    fill: "flex-1 h-full min-h-[250px] flex flex-col",
    fixed: "shrink-0 flex flex-col",
  }[heightMode];

  const headerClass = {
    card: "flex h-9 border-b border-border/80 bg-muted/40 p-0 gap-0 items-end select-none overflow-x-auto overflow-y-hidden no-scrollbar",
    workbench:
      "flex h-9 border-b border-border/80 bg-muted/30 p-0 gap-0 items-end select-none overflow-x-auto overflow-y-hidden no-scrollbar",
    pills:
      "flex h-10 border-b border-border/40 bg-muted/30 px-2 py-1 gap-1 items-center select-none overflow-x-auto overflow-y-hidden no-scrollbar",
  }[tabVariant];

  return (
    <div
      style={minHeightStyle ? { minHeight: minHeightStyle } : undefined}
      className={cn(containerVariantClass, containerHeightClass, "overflow-hidden")}
    >
      {/* Workbench TabBar Header */}
      <div className={cn(headerClass, "shrink-0")}>
        {tabSections.map((tab) => {
          const isActive = tab.id === currentActiveId;
          const config = tab.containerConfig || {};
          const isPills = tabVariant === "pills";
          const tabFields = tab.fields || [];
          const tabErrorCount = tabFields.filter((f) => errors[f.NAME]).length;

          const buttonClass = isPills
            ? cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
              )
            : cn(
                "relative flex items-center gap-1.5 h-8 px-3 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap rounded-none",
                isActive
                  ? "bg-background text-foreground font-semibold border-t border-l border-r border-border/80 border-b-0 shadow-2xs z-10 -mb-px after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground border-transparent",
              );

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(groupId, tab.id)}
              className={buttonClass}
            >
              <span>{tab.groupTitle || tab.title || "Tab"}</span>
              {tabErrorCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-3.5 min-w-3.5 px-1 text-3xs rounded-xs shrink-0"
                >
                  {tabErrorCount}
                </Badge>
              )}
              {config.badge && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.2 text-3xs font-mono rounded",
                    isPills && isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {config.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Body without duplicate inner header */}
      {activeSection && (
        <div
          className={cn(
            "p-3",
            heightMode === "fill" && "flex-1 overflow-y-auto min-h-0",
            heightMode === "fixed" && "flex-1",
          )}
        >
          <CardContainer
            key={activeSection.id}
            section={activeSection}
            values={values}
            onChange={onChange}
            errors={errors}
            disabled={disabled}
            mode={mode}
            hideHeader
          />
        </div>
      )}
    </div>
  );
}
