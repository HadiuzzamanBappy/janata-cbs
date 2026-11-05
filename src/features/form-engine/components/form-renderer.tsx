"use client";

import * as React from "react";
import { cn, evaluateFormula } from "@/lib/core-utils";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { getFieldValue } from "../utils/path-utils";
import { buildRenderBlocks } from "../utils/section-utils";
import { SectionCard } from "./section-card";

export interface FormRendererProps {
  presentation?:
    | FormConfigRecord["frmElements"]
    | { sections: FormSection[]; steps?: FormConfigRecord["frmElements"]["steps"] };
  frmElements?:
    | FormConfigRecord["frmElements"]
    | { sections: FormSection[]; steps?: FormConfigRecord["frmElements"]["steps"] };
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

export function FormRenderer({
  presentation,
  frmElements,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: FormRendererProps) {
  const container = frmElements || presentation || { steps: [], sections: [] };
  const sections = container.sections || [];

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

  // Handle formula evaluation and ON_CHANGE rules on input change
  const handleFieldChange = (key: string, val: unknown) => {
    onChange(key, val);

    let nextValues = { ...values, [key]: val };

    // 1. Process reactive ON_CHANGE rules
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

          if (targetVal !== nextValues[rule.target]) {
            nextValues = { ...nextValues, [rule.target]: targetVal };
            onChange(rule.target, targetVal);
          }
        }
      });
    });

    // 2. Evaluate derived formulas across all sections
    sections.forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        const fieldKey = f.NAME;
        const rawFormula = f.FIXEDVALUE || f.DEFAULTVALUE;
        const formula =
          typeof rawFormula === "string" && rawFormula.startsWith("=")
            ? rawFormula.slice(1)
            : typeof rawFormula === "string" && /[+\-*/]/.test(rawFormula)
              ? rawFormula
              : undefined;
        if (formula && fieldKey) {
          const calculated = evaluateFormula(formula, nextValues);
          if (calculated !== undefined && calculated !== nextValues[fieldKey]) {
            onChange(fieldKey, calculated);
          }
        }
      });
    });
  };

  // Merge external errors with dynamic cross-field validation errors
  const dynamicErrors = React.useMemo(() => {
    const errs: Record<string, string> = { ...errors };

    sections.forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        const val = getFieldValue(values, f.NAME);

        // 1. Check matching rule (e.g. New Pass === Confirm Pass)
        if (f.VALIDATION?.matches) {
          const matchTarget = f.VALIDATION.matches;
          const targetVal = getFieldValue(values, matchTarget);
          if (val !== undefined && val !== "" && targetVal !== undefined && targetVal !== "") {
            if (val !== targetVal) {
              errs[f.NAME] = f.VALIDATION.message || `Must match ${matchTarget}`;
            }
          }
        }

        // 2. Minimum length/value
        if (f.VALIDATION?.min !== undefined && val !== undefined && val !== "") {
          if (typeof val === "string" && val.length < f.VALIDATION.min) {
            errs[f.NAME] = f.VALIDATION.message || `Minimum length is ${f.VALIDATION.min}`;
          } else if (typeof val === "number" && val < f.VALIDATION.min) {
            errs[f.NAME] = f.VALIDATION.message || `Minimum value is ${f.VALIDATION.min}`;
          }
        }

        // 3. Maximum length/value
        if (f.VALIDATION?.max !== undefined && val !== undefined && val !== "") {
          if (typeof val === "string" && val.length > f.VALIDATION.max) {
            errs[f.NAME] = f.VALIDATION.message || `Maximum length is ${f.VALIDATION.max}`;
          } else if (typeof val === "number" && val > f.VALIDATION.max) {
            errs[f.NAME] = f.VALIDATION.message || `Maximum value is ${f.VALIDATION.max}`;
          }
        }

        // 4. Regex pattern matching
        if (f.VALIDATION?.pattern && val !== undefined && val !== "") {
          try {
            const reg = new RegExp(f.VALIDATION.pattern);
            if (!reg.test(String(val))) {
              errs[f.NAME] = f.VALIDATION.message || "Invalid format";
            }
          } catch {
            // Ignore invalid regex in user definition
          }
        }
      });
    });

    return errs;
  }, [errors, sections, values]);

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
                errors={dynamicErrors}
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
                    errors={dynamicErrors}
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
