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
  resolveTabGroupConfig,
  setFieldValue,
} from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import { type AuditData, DEFAULT_FORM_DENSITY, DEFAULT_FORM_LAYOUT } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import type { FormRendererProps } from "../types";
import { AuditContainer } from "./containers/audit-container";
import { CardContainer } from "./containers/card-container";
import { TabGroupContainer } from "./containers/tab-group-container";
import { FORM_DENSITY_CLASSES, FormLayoutContext } from "./form-layout-context";

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
  errors = {},
  disabled = false,
  mode = CbsRecordFunction.INPUT,
  auditData,
  showAuditSection = false,
  auditVariant = "inline",
  hideHeader = false,
  layout = DEFAULT_FORM_LAYOUT,
  density = DEFAULT_FORM_DENSITY,
  className,
}: FormRendererProps) {
  const effectiveLayout = frmElements?.layout || layout || DEFAULT_FORM_LAYOUT;
  const effectiveDensity = frmElements?.density || density || DEFAULT_FORM_DENSITY;
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

  // Check if any tab group is configured in "fill" (Fill Screen) mode
  const hasFillBlock = React.useMemo(() => {
    return blocks.some((b) => {
      if (b.type === "tab-group") {
        return resolveTabGroupConfig(b.tabSections, b.tabSections[0]).heightMode === "fill";
      }
      return false;
    });
  }, [blocks]);

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
    onRecordChange?.(nextValues);
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
          className={cn(
            "w-full",
            mode !== CbsRecordFunction.INPUT
              ? FORM_DENSITY_CLASSES[effectiveDensity].stackView
              : FORM_DENSITY_CLASSES[effectiveDensity].stack,
            hasFillBlock && "flex-1 flex flex-col min-h-0 h-full",
          )}
        >
          {blocks.map((block) => {
            if (block.type === "single") {
              return (
                <div key={block.section.id} className={hasFillBlock ? "shrink-0" : undefined}>
                  <CardContainer
                    section={block.section}
                    values={values}
                    onChange={handleFieldChange}
                    errors={errors}
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
                errors={errors}
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
