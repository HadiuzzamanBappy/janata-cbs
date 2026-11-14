"use client";

import * as React from "react";
import {
  applyFieldTransform,
  buildRenderBlocks,
  evaluateFieldCascade,
  evaluateOnChangeRule,
  setFieldValue,
  validateValues,
} from "@/lib/cbs-form-spec";
import type { AuditData } from "@/lib/data-schemas";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
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
  onRecordChange,
  onValuesChange,
  errors = {},
  externalErrors = {},
  autoValidate = false,
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

  // Automatic schema-driven validation
  const schemaErrors = React.useMemo(() => {
    if (!autoValidate || sections.length === 0) return {};
    return validateValues(sections, values);
  }, [sections, values, autoValidate]);

  // Unified error map: schema validation errors merged with external business/server errors
  const effectiveErrors = React.useMemo(() => {
    return { ...schemaErrors, ...errors, ...externalErrors };
  }, [schemaErrors, errors, externalErrors]);

  // Handle field change with TRANSFORM, CASCADE, and ON_CHANGE
  const handleFieldChange = (key: string, rawVal: unknown) => {
    // 1. Locate the field spec
    let fieldSpec: FormElement | undefined;
    for (const sec of sections) {
      fieldSpec = (sec.fields || []).find((f) => f.NAME === key);
      if (fieldSpec) break;
    }

    // 2. Apply field value transform if configured
    const val = fieldSpec?.TRANSFORM ? applyFieldTransform(fieldSpec.TRANSFORM, rawVal) : rawVal;

    let nextValues = setFieldValue(values, key, val);
    onChange?.(key, val);

    // 3. Apply field cascades if configured
    if (fieldSpec?.CASCADE) {
      const cascadePatch = evaluateFieldCascade(fieldSpec.CASCADE, val);
      if (cascadePatch) {
        for (const [targetKey, targetVal] of Object.entries(cascadePatch)) {
          nextValues = setFieldValue(nextValues, targetKey, targetVal);
          onChange?.(targetKey, targetVal);
        }
      }
    }

    // 4. Handle reactive ON_CHANGE rules on input change
    sections.forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        if (f.NAME === key && f.ON_CHANGE?.target) {
          const rule = f.ON_CHANGE;
          const targetVal = evaluateOnChangeRule(rule.action, val, rule.delimiter);
          if (targetVal !== values[rule.target]) {
            nextValues = setFieldValue(nextValues, rule.target, targetVal);
            onChange?.(rule.target, targetVal);
          }
        }
      });
    });

    // 5. Emit full nextValues to record subscribers
    if (onRecordChange) {
      onRecordChange(nextValues);
    } else if (onValuesChange) {
      onValuesChange(nextValues);
    }
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
                  errors={effectiveErrors}
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
                errors={effectiveErrors}
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
