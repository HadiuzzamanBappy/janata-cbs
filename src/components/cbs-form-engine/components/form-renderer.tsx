/**
 * @fileoverview Pure composition orchestrator for dynamic CBS forms.
 * Coordinates section render blocks (cards and tab groups), automatic schema validation,
 * field value transforms, cascades, and reactive on-change rules.
 *
 * @module features/form-engine/components/form-renderer
 */

"use client";

import * as React from "react";
import {
  applyFieldTransform,
  buildRenderBlocks,
  evaluateFieldCascade,
  evaluateOnChangeRule,
  findFieldSpecByKey,
  getFieldValue,
  isLiveTransform,
  setFieldValue,
  validateValues,
} from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { AuditData } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
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
  mode = CbsRecordFunction.INPUT,
  auditData,
  showAuditSection = false,
  auditVariant = "inline",
  hideHeader = false,
  layout = "horizontal",
  density = "compact",
  className,
}: FormRendererProps) {
  const effectiveLayout = frmElements?.layout || layout || "horizontal";
  const effectiveDensity = frmElements?.density || density || "compact";
  const layoutValue = React.useMemo(
    () => ({ layout: effectiveLayout, density: effectiveDensity }),
    [effectiveLayout, effectiveDensity],
  );
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

  // Check if any tab group is configured in "fill" (Fill Screen) mode
  const hasFillBlock = React.useMemo(() => {
    return blocks.some((b) => {
      if (b.type === "tab-group") {
        const cfg =
          b.tabSections.find(
            (t) =>
              t.containerConfig?.heightMode ||
              t.containerConfig?.tabVariant ||
              t.containerConfig?.minHeight,
          )?.containerConfig || b.tabSections[0]?.containerConfig;
        return cfg?.heightMode === "fill";
      }
      return false;
    });
  }, [blocks]);

  // Unified error map: schema validation errors merged with external business/server errors
  const effectiveErrors = React.useMemo(() => {
    return { ...schemaErrors, ...errors, ...externalErrors };
  }, [schemaErrors, errors, externalErrors]);

  // Handle field change with TRANSFORM, CASCADE, and ON_CHANGE
  const handleFieldChange = (key: string, rawVal: unknown) => {
    // 1. Locate the field spec (inner fields of object groups included)
    const fieldSpec = findFieldSpecByKey(sections, key);

    // 2. Apply the field transform (trim waits for blur, in the text widgets)
    const val = isLiveTransform(fieldSpec?.TRANSFORM)
      ? applyFieldTransform(fieldSpec?.TRANSFORM, rawVal)
      : rawVal;

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
    if (fieldSpec?.ON_CHANGE?.target) {
      const rule = fieldSpec.ON_CHANGE;
      const targetVal = evaluateOnChangeRule(rule.action, val, rule.delimiter);
      if (targetVal !== getFieldValue(nextValues, rule.target)) {
        nextValues = setFieldValue(nextValues, rule.target, targetVal);
        onChange?.(rule.target, targetVal);
      }
    }

    // 5. Emit full nextValues to record subscribers
    if (onRecordChange) {
      onRecordChange(nextValues);
    } else if (onValuesChange) {
      onValuesChange(nextValues);
    }
  };

  return (
    <FormLayoutContext.Provider value={layoutValue}>
      <div
        className={cn(
          "h-full w-full",
          className
            ? className
            : hasFillBlock
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto pr-1",
        )}
      >
        <div
          className={cn("w-full space-y-2", hasFillBlock && "flex-1 flex flex-col min-h-0 h-full")}
        >
          {blocks.map((block) => {
            if (block.type === "single") {
              return (
                <div key={block.section.id} className={hasFillBlock ? "shrink-0" : undefined}>
                  <CardContainer
                    section={block.section}
                    values={values}
                    onChange={handleFieldChange}
                    errors={effectiveErrors}
                    disabled={disabled}
                    mode={mode}
                    hideHeader={hideHeader}
                  />
                </div>
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
            <div className={hasFillBlock ? "shrink-0" : undefined}>
              <AuditContainer
                auditData={auditData ?? (values.auditData as AuditData)}
                variant={auditVariant}
              />
            </div>
          )}
        </div>
      </div>
    </FormLayoutContext.Provider>
  );
}
