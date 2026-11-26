/**
 * @fileoverview Root Canvas and Container layout inspectors for Form Designer.
 * Exposes global grid columns, canvas density, card/tab variants, and container layout.
 *
 * @module features/system/form-config/components/designer/inspector/canvas-inspectors
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { setFieldValue } from "@/lib/cbs-form-spec";
import {
  DEFAULT_FORM_DENSITY,
  DEFAULT_FORM_LAYOUT,
  type FormDensity,
  type FormLayout,
  type FormSection,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import {
  CONTAINER_PROPERTIES_SECTION,
  ROOT_FORM_PROPERTIES_SECTION,
  TAB_GROUP_PROPERTIES_SECTION,
  TAB_ITEM_PROPERTIES_SECTION,
} from "../../../fields/fc-canvas-fields";
import { useOptionalDesignerContext } from "../context/designer-context";

export interface RootCanvasInspectorProps {
  layout?: FormLayout;
  density?: FormDensity;
  onUpdateFormConfig?: (patch: { layout?: FormLayout; density?: FormDensity }) => void;
  disabled?: boolean;
}

export function RootCanvasInspector({
  layout = DEFAULT_FORM_LAYOUT,
  density = DEFAULT_FORM_DENSITY,
  onUpdateFormConfig,
  disabled = false,
}: RootCanvasInspectorProps) {
  const values = React.useMemo(() => ({ layout, density }), [layout, density]);

  const handlePropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!onUpdateFormConfig) return;
      if (fieldKey === "layout") {
        onUpdateFormConfig({
          layout: (value as FormLayout) || DEFAULT_FORM_LAYOUT,
        });
      } else if (fieldKey === "density") {
        onUpdateFormConfig({
          density: (value as FormDensity) || DEFAULT_FORM_DENSITY,
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
  errors?: Record<string, string>;
}

export function ContainerInspector({
  section,
  onUpdateSection,
  disabled = false,
  errors = {},
}: ContainerInspectorProps) {
  const ctx = useOptionalDesignerContext();
  const tabScope = ctx?.tabScope || "container";
  const isTab = section.containerType === "tab";
  const inspectorSections = isTab
    ? [tabScope === "container" ? TAB_GROUP_PROPERTIES_SECTION : TAB_ITEM_PROPERTIES_SECTION]
    : [CONTAINER_PROPERTIES_SECTION];

  // Normalized values: apply UI defaults for unset containerConfig presets
  const normalizedValues = React.useMemo(() => {
    const raw = section as Record<string, unknown>;
    const cfg = section.containerConfig || {};
    return {
      ...raw,
      columns: section.columns ?? 1,
      collapsible: section.collapsible ?? false,
      containerConfig: {
        ...cfg,
        variant: cfg.variant || "default",
        tabVariant: cfg.tabVariant || "card",
        heightMode: cfg.heightMode || "auto",
        minHeight: cfg.minHeight ?? 350,
        badgeVariant: cfg.badgeVariant || "default",
        density: cfg.density || "auto",
      },
    };
  }, [section]);

  const handleSectionPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      // A cleared input (or "auto" density) removes the setting so the card falls back to its preset/root
      const finalVal =
        fieldKey === "columns"
          ? Number(value) || 1
          : value === "" || (fieldKey === "containerConfig.density" && value === "auto")
            ? undefined
            : value;
      const updated = setFieldValue(section as Record<string, unknown>, fieldKey, finalVal);
      onUpdateSection(updated as Partial<FormSection>);
    },
    [section, onUpdateSection],
  );

  return (
    <div className="p-3 select-none text-xs">
      <FormRenderer
        frmElements={{ sections: inspectorSections }}
        values={normalizedValues}
        onChange={handleSectionPropertyChange}
        errors={errors}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
        className="overflow-visible"
      />
    </div>
  );
}
