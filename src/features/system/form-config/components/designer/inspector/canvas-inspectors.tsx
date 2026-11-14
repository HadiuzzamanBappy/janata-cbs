/**
 * @fileoverview Root Canvas and Container layout inspectors for Form Designer.
 * Exposes global grid columns, canvas density, card/tab variants, and container layout.
 *
 * @module features/system/form-config/components/designer/inspector/canvas-inspectors
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import {
  CONTAINER_PROPERTIES_SECTION,
  ROOT_FORM_PROPERTIES_SECTION,
  TAB_PROPERTIES_SECTIONS,
} from "@/features/system/form-config/fields/fc-canvas-fields";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";

export interface RootCanvasInspectorProps {
  layout?: "horizontal" | "stacked";
  density?: "compact" | "normal" | "spacious";
  onUpdateFormConfig?: (patch: {
    layout?: "horizontal" | "stacked";
    density?: "compact" | "normal" | "spacious";
  }) => void;
  disabled?: boolean;
}

export function RootCanvasInspector({
  layout = "horizontal",
  density = "compact",
  onUpdateFormConfig,
  disabled = false,
}: RootCanvasInspectorProps) {
  const values = React.useMemo(() => ({ layout, density }), [layout, density]);

  const handlePropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!onUpdateFormConfig) return;
      if (fieldKey === "layout") {
        onUpdateFormConfig({
          layout: (value as "horizontal" | "stacked") || "horizontal",
        });
      } else if (fieldKey === "density") {
        onUpdateFormConfig({
          density: (value as "compact" | "normal") || "compact",
        });
      }
    },
    [onUpdateFormConfig],
  );

  return (
    <div className="p-3 select-none text-xs">
      <FormRenderer
        frmElements={{ sections: [ROOT_FORM_PROPERTIES_SECTION] }}
        values={values}
        onChange={handlePropertyChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
        className="overflow-visible"
      />
    </div>
  );
}

export interface ContainerInspectorProps {
  section: FormSection;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  disabled?: boolean;
}

export function ContainerInspector({
  section,
  onUpdateSection,
  disabled = false,
}: ContainerInspectorProps) {
  const isTab = section.containerType === "tab";
  const inspectorSections = isTab ? TAB_PROPERTIES_SECTIONS : [CONTAINER_PROPERTIES_SECTION];

  // Normalized values: maps legacy variant to new atomic fields so inspector switches reflect legacy states accurately
  const normalizedValues = React.useMemo(() => {
    const raw = section as Record<string, unknown>;
    const cfg = section.containerConfig || {};
    return {
      ...raw,
      containerConfig: {
        ...cfg,
        showHeader: cfg.showHeader !== undefined ? cfg.showHeader : cfg.variant !== "ghost",
        bordered: cfg.bordered !== undefined ? cfg.bordered : cfg.variant !== "ghost",
        background:
          cfg.background ??
          (cfg.variant === "ghost" ? "none" : cfg.variant === "subtle" ? "subtle" : "regular"),
      },
    };
  }, [section]);

  const handleSectionPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const finalVal = fieldKey === "columns" ? Number(value) || 1 : value;
      let updated = setFieldValue(section as Record<string, unknown>, fieldKey, finalVal);
      if (isTab && fieldKey === "title") {
        updated = {
          ...updated,
          groupTitle: String(value || ""),
        };
      }
      onUpdateSection(updated as Partial<FormSection>);
    },
    [section, isTab, onUpdateSection],
  );

  return (
    <div className="p-3 select-none text-xs">
      <FormRenderer
        frmElements={{ sections: inspectorSections }}
        values={normalizedValues}
        onChange={handleSectionPropertyChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader={!isTab}
        layout="stacked"
        className="overflow-visible"
      />
    </div>
  );
}
