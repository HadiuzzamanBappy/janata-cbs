/**
 * @fileoverview Root Canvas and Container layout inspectors for Form Designer.
 * Exposes global grid columns, canvas density, card/tab variants, and container layout.
 *
 * @module features/system/form-config/components/designer/inspector/canvas-inspectors
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine";
import {
  CONTAINER_PROPERTIES_SECTION,
  ROOT_FORM_PROPERTIES_SECTION,
} from "@/features/system/form-config/fields/fc-canvas-fields";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";

export interface RootCanvasInspectorProps {
  columns?: number;
  density?: string;
  onUpdateFormConfig?: (patch: { columns?: number; density?: string }) => void;
  disabled?: boolean;
}

export function RootCanvasInspector({
  columns = 1,
  density = "compact",
  onUpdateFormConfig,
  disabled = false,
}: RootCanvasInspectorProps) {
  const values = React.useMemo(() => ({ columns, density }), [columns, density]);

  const handlePropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!onUpdateFormConfig) return;
      if (fieldKey === "columns") {
        onUpdateFormConfig({ columns: Number(value) || 1 });
      } else if (fieldKey === "density") {
        onUpdateFormConfig({ density: value as string });
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
  const handleSectionPropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const finalVal = fieldKey === "columns" ? Number(value) || 1 : value;
      const updated = setFieldValue(section as Record<string, unknown>, fieldKey, finalVal);
      onUpdateSection(updated as Partial<FormSection>);
    },
    [section, onUpdateSection],
  );

  return (
    <div className="p-3 select-none text-xs">
      <FormRenderer
        frmElements={{ sections: [CONTAINER_PROPERTIES_SECTION] }}
        values={section as Record<string, unknown>}
        onChange={handleSectionPropertyChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
      />
    </div>
  );
}
