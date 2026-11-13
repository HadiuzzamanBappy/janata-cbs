"use client";

import * as React from "react";
import { buildRenderBlocks, evaluateOnChangeRule } from "@/lib/cbs-form-spec";
import type { AuditData } from "@/lib/data-schemas";
import type { FormRendererProps } from "../types";
import { AuditContainer } from "./containers/audit-container";
import { CardContainer } from "./containers/card-container";
import { TabGroupContainer } from "./containers/tab-group-container";
import { FormLayoutContext } from "./form-layout-context";

export type { FormRendererProps };

/**
 * FormRenderer: Pure composition orchestrator.
 * Delegates rendering to CardContainer and TabGroupContainer.
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
  auditVariant = "inline",
  hideHeader = false,
  layout = "horizontal",
}: FormRendererProps) {
  const layoutValue = React.useMemo(() => ({ layout }), [layout]);
  const sections = frmElements?.sections || [];

  // Active item tracking for multi-pane containers
  const [activeTabs, setActiveTabs] = React.useState<Record<string, string>>({});

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

  // Handle reactive ON_CHANGE rules on input change
  const handleFieldChange = (key: string, val: unknown) => {
    onChange(key, val);

    sections.forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        if (f.NAME === key && f.ON_CHANGE?.target) {
          const rule = f.ON_CHANGE;
          const targetVal = evaluateOnChangeRule(rule.action, val, rule.delimiter);
          if (targetVal !== values[rule.target]) {
            onChange(rule.target, targetVal);
          }
        }
      });
    });
  };

  return (
    <FormLayoutContext.Provider value={layoutValue}>
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
                  hideHeader={hideHeader}
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
                onTabChange={(grpId, tabId) =>
                  setActiveTabs((prev) => ({ ...prev, [grpId]: tabId }))
                }
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
            <AuditContainer
              auditData={auditData ?? (values.auditData as AuditData)}
              variant={auditVariant}
            />
          )}
        </div>
      </div>
    </FormLayoutContext.Provider>
  );
}
