"use client";

import * as React from "react";
import { buildRenderBlocks } from "@/lib/cbs-form-spec";
import type { AuditData } from "@/lib/data-schemas";
import type { FormRendererProps } from "../types";
import { AuditContainer } from "./containers/audit-container";
import { CardContainer } from "./containers/card-container";
import { StepperContainer } from "./containers/stepper-container";
import { TabGroupContainer } from "./containers/tab-group-container";

export type { FormRendererProps };

/**
 * FormRenderer: Pure composition orchestrator.
 * Delegates rendering to CardContainer, TabGroupContainer, and StepperContainer.
 */
export function FormRenderer({
  frmElements,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  auditData,
  showAuditSection = false,
}: FormRendererProps) {
  const sections = frmElements?.sections || [];

  // Active item tracking for multi-pane containers
  const [activeTabs, setActiveTabs] = React.useState<Record<string, string>>({});
  const [activeSteps, setActiveSteps] = React.useState<Record<string, string>>({});

  // Cluster sections preserving designer order
  const blocks = React.useMemo(() => {
    return buildRenderBlocks(sections);
  }, [sections]);

  // Keep active tab state in sync
  React.useEffect(() => {
    setActiveTabs((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const b of blocks) {
        if (b.type === "tab-group" && b.tabSections.length > 0) {
          if (!next[b.groupId] || !b.tabSections.some((s) => s.id === next[b.groupId])) {
            next[b.groupId] = b.tabSections[0].id;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [blocks]);

  // Keep active step state in sync
  React.useEffect(() => {
    setActiveSteps((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const b of blocks) {
        if (b.type === "step-group" && b.stepSections.length > 0) {
          if (!next[b.groupId] || !b.stepSections.some((s) => s.id === next[b.groupId])) {
            next[b.groupId] = b.stepSections[0].id;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [blocks]);

  // Handle reactive ON_CHANGE rules on input change
  const handleFieldChange = (key: string, val: unknown) => {
    onChange(key, val);

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
              <CardContainer
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

          if (block.type === "step-group") {
            return (
              <StepperContainer
                key={block.groupId}
                groupId={block.groupId}
                stepSections={block.stepSections}
                activeStepId={activeSteps[block.groupId]}
                onStepChange={(grpId, stepId) =>
                  setActiveSteps((prev) => ({ ...prev, [grpId]: stepId }))
                }
                values={values}
                onChange={handleFieldChange}
                errors={errors}
                disabled={disabled}
                mode={mode}
              />
            );
          }

          // Tab Group
          return (
            <TabGroupContainer
              key={block.groupId}
              groupId={block.groupId}
              tabSections={block.tabSections}
              activeTabId={activeTabs[block.groupId]}
              onTabChange={(grpId, tabId) => setActiveTabs((prev) => ({ ...prev, [grpId]: tabId }))}
              values={values}
              onChange={handleFieldChange}
              errors={errors}
              disabled={disabled}
              mode={mode}
            />
          );
        })}

        {/* Constant Read-Only Audit Section below all form sections */}
        {showAuditSection && (
          <AuditContainer auditData={auditData ?? (values.auditData as AuditData)} />
        )}
      </div>
    </div>
  );
}
