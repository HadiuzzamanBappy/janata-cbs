/**
 * @fileoverview Tab group container for clustered CBS dynamic form sections.
 * Renders tab-grouped sections into a high-density banking workbench TabBar
 * with active badge indicators, error counts, and embedded CardContainer content.
 *
 * @module features/form-engine/components/containers/tab-group-container
 */

"use client";

import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-engine-schema";
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

  // Visual config from active tab or first tab
  const activeConfig = activeSection?.containerConfig || {};

  return (
    <div
      className={cn(
        "rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden",
        activeConfig.customClass,
      )}
    >
      {/* Workbench TabBar Header */}
      <div className="flex border-b border-border/80 bg-muted/40 p-0 gap-0 items-end select-none overflow-x-auto">
        {tabSections.map((tab) => {
          const isActive = tab.id === currentActiveId;
          const config = tab.containerConfig || {};
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(groupId, tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 h-8 px-3 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap rounded-none",
                isActive
                  ? "bg-background text-foreground font-semibold border-t border-l border-r border-border/80 border-b-0 shadow-2xs z-10 -mb-px after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground border-transparent",
              )}
            >
              <span>{tab.groupTitle || tab.title || "Tab"}</span>
              {config.badge && (
                <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono rounded bg-muted text-muted-foreground">
                  {config.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Body without duplicate inner header */}
      {activeSection && (
        <div className="p-3">
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
