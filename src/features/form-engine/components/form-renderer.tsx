"use client";

import * as React from "react";
import { buildRenderBlocks } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormRendererProps } from "../types";
import { SectionCard } from "./section-card";

export type { FormRendererProps };

export function FormRenderer({
  frmElements,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: FormRendererProps) {
  const sections = frmElements?.sections || [];

  // Map of active tab ID per tab group
  const [activeTabs, setActiveTabs] = React.useState<Record<string, string>>({});

  // Cluster sections preserving designer order
  const blocks = React.useMemo(() => {
    return buildRenderBlocks(sections);
  }, [sections]);

  // Extract all tab groups from blocks
  const tabGroups = React.useMemo(() => {
    const map: Record<string, FormSection[]> = {};
    for (const b of blocks) {
      if (b.type === "tab-group") {
        map[b.groupId] = b.tabSections;
      }
    }
    return map;
  }, [blocks]);

  // Keep active tab state in sync
  React.useEffect(() => {
    setActiveTabs((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [groupKey, groupSecs] of Object.entries(tabGroups)) {
        if (
          groupSecs.length > 0 &&
          (!next[groupKey] || !groupSecs.some((s) => s.id === next[groupKey]))
        ) {
          next[groupKey] = groupSecs[0].id;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tabGroups]);

  // Handle reactive ON_CHANGE rules on input change
  const handleFieldChange = (key: string, val: unknown) => {
    onChange(key, val);

    // Process reactive ON_CHANGE rules (simple copy, uppercase, lowercase, join)
    sections.forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        if (f.NAME === key && f.ON_CHANGE?.target) {
          const rule = f.ON_CHANGE;
          let targetVal: unknown = val;

          if (rule.action === "join") {
            const delim = rule.delimiter ?? "#";
            targetVal = Array.isArray(val) ? val.filter(Boolean).join(delim) : String(val ?? "");
          } else if (rule.action === "uppercase") {
            targetVal = typeof val === "string" ? val.toUpperCase() : val;
          } else if (rule.action === "lowercase") {
            targetVal = typeof val === "string" ? val.toLowerCase() : val;
          } else if (rule.action === "clear") {
            targetVal = "";
          }

          if (targetVal !== values[rule.target]) {
            onChange(rule.target, targetVal);
          }
        }
      });
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto pr-1">
      <div className="w-full space-y-2">
        {blocks.map((block) => {
          if (block.type === "single") {
            return (
              <SectionCard
                key={block.section.id}
                section={block.section}
                values={values}
                onChange={handleFieldChange}
                errors={errors}
                disabled={disabled}
                mode={mode}
              />
            );
          }

          const currentActiveId = activeTabs[block.groupId] || block.tabSections[0]?.id;
          const activeSection =
            block.tabSections.find((t) => t.id === currentActiveId) || block.tabSections[0];

          return (
            <div
              key={block.groupId}
              className="rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden"
            >
              {/* Tab Header Bar (Workbench TabBar Square Density with Active Top Border) */}
              <div className="flex border-b border-border/80 bg-muted/40 p-0 gap-0 items-end select-none">
                {block.tabSections.map((tab) => {
                  const isActive = tab.id === currentActiveId;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setActiveTabs((prev) => ({ ...prev, [block.groupId]: tab.id }))
                      }
                      className={cn(
                        "relative flex items-center h-8 px-3 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap rounded-none",
                        isActive
                          ? "bg-background text-foreground font-semibold border-t border-l border-r border-border/80 border-b-0 shadow-2xs z-10 -mb-px after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground border-transparent",
                      )}
                    >
                      {tab.tabTitle || tab.title || "Tab"}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Body without duplicate inner header */}
              {activeSection && (
                <div className="p-3">
                  <SectionCard
                    key={activeSection.id}
                    section={activeSection}
                    values={values}
                    onChange={handleFieldChange}
                    errors={errors}
                    disabled={disabled}
                    mode={mode}
                    hideHeader
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
