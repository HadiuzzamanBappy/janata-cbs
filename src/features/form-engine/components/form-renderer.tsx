"use client";

import * as React from "react";
import { cn, evaluateFormula } from "@/lib/core-utils";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { SectionCard } from "./section-card";

export interface FormRendererProps {
  presentation: FormConfigRecord["presentation"];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

type RendererBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] };

/**
 * Cluster sections preserving their layout order on the canvas.
 * Tab sections sharing a tabGroupId are clustered into an inline tab group at
 * the exact position where the first tab section appears.
 */
function buildRendererBlocks(sections: FormSection[]): RendererBlock[] {
  const blocks: RendererBlock[] = [];
  const seenTabGroups = new Map<string, FormSection[]>();

  for (const sec of sections) {
    if (sec.zone === "tab") {
      const grpId = sec.tabGroupId?.trim() || "default_tab_group";
      if (!seenTabGroups.has(grpId)) {
        const grpList: FormSection[] = [sec];
        seenTabGroups.set(grpId, grpList);
        blocks.push({ type: "tab-group", groupId: grpId, tabSections: grpList });
      } else {
        seenTabGroups.get(grpId)?.push(sec);
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
}

export function FormRenderer({
  presentation,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: FormRendererProps) {
  // Map of active tab ID per tab group
  const [activeTabs, setActiveTabs] = React.useState<Record<string, string>>({});

  // Cluster sections preserving designer order
  const blocks = React.useMemo(() => {
    return buildRendererBlocks(presentation.sections);
  }, [presentation.sections]);

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

  // Handle formula evaluation on input change
  const handleFieldChange = (key: string, val: unknown) => {
    onChange(key, val);

    // Evaluate derived formulas across all sections
    const nextValues = { ...values, [key]: val };
    presentation.sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (f.formula) {
          const calculated = evaluateFormula(f.formula, nextValues);
          if (calculated !== undefined && calculated !== nextValues[f.fieldKey]) {
            onChange(f.fieldKey, calculated);
          }
        }
      });
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto pr-1">
      <div className="w-full space-y-3.5 pb-8">
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
              {/* Tab Header Bar */}
              <div className="flex border-b border-border/80 gap-1 bg-muted/25 px-2.5 pt-2">
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
                        "px-3.5 py-1.5 text-xs font-medium border-b-2 transition-all cursor-pointer",
                        isActive
                          ? "border-primary text-primary font-semibold bg-background rounded-t -mb-px"
                          : "border-transparent text-muted-foreground hover:text-foreground",
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
