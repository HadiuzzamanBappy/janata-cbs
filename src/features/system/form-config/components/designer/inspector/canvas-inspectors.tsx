/**
 * @fileoverview Root Canvas and Container layout inspectors for Form Designer.
 * Exposes global grid columns, canvas density, card/tab variants, and container layout.
 *
 * @module features/system/form-config/components/designer/inspector/canvas-inspectors
 */

"use client";

import { Layers, LayoutList } from "lucide-react";
import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import {
  CONTAINER_PROPERTIES_SECTION,
  ROOT_FORM_PROPERTIES_SECTION,
  TAB_GROUP_PROPERTIES_SECTION,
  TAB_ITEM_PROPERTIES_SECTION,
} from "../../../fields/fc-canvas-fields";
import { useOptionalDesignerContext } from "../context/designer-context";

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
          density: (value as "compact" | "normal" | "spacious") || "compact",
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
  const setTabScope = ctx?.setTabScope;
  const isTab = section.containerType === "tab";
  const inspectorSections = isTab
    ? [tabScope === "container" ? TAB_GROUP_PROPERTIES_SECTION : TAB_ITEM_PROPERTIES_SECTION]
    : [CONTAINER_PROPERTIES_SECTION];

  // Normalized values: expands the variant preset (e.g. "ghost") into the atomic fields so the inspector switches show the effective state
  const normalizedValues = React.useMemo(() => {
    const raw = section as Record<string, unknown>;
    const cfg = section.containerConfig || {};
    return {
      ...raw,
      columns: section.columns ?? 1,
      containerConfig: {
        ...cfg,
        tabVariant: cfg.tabVariant || "card",
        heightMode: cfg.heightMode || "auto",
        minHeight: cfg.minHeight ?? 350,
        showHeader:
          cfg.showHeader !== undefined
            ? cfg.showHeader
            : Boolean(section.title?.trim() || section.collapsible || cfg.badge) &&
              cfg.variant !== "ghost",
        bordered: cfg.bordered !== undefined ? cfg.bordered : cfg.variant !== "ghost",
        background:
          cfg.background ??
          (cfg.variant === "ghost" ? "none" : cfg.variant === "subtle" ? "subtle" : "regular"),
      },
    };
  }, [section]);

  const handleSectionPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      // A cleared input removes the setting, so the card falls back to its style preset
      const finalVal =
        fieldKey === "columns" ? Number(value) || 1 : value === "" ? undefined : value;
      const updated = setFieldValue(section as Record<string, unknown>, fieldKey, finalVal);
      onUpdateSection(updated as Partial<FormSection>);
    },
    [section, isTab, onUpdateSection],
  );

  return (
    <div className="p-3 select-none text-xs">
      {isTab && (
        <div className="flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/70 mb-3 gap-0.5 select-none">
          <button
            type="button"
            onClick={() => setTabScope?.("container")}
            className={cn(
              "flex-1 h-6 text-2xs font-medium rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer",
              tabScope === "container"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <Layers className="size-3 text-info" />
            Tab Group
          </button>
          <button
            type="button"
            onClick={() => setTabScope?.("item")}
            className={cn(
              "flex-1 h-6 text-2xs font-medium rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer truncate px-1",
              tabScope === "item"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <LayoutList className="size-3 text-primary" />
            <span className="truncate">Tab: {section.title || "Item"}</span>
          </button>
        </div>
      )}
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
