"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { CbsRecordFunction } from "@/types";
import { ROOT_FORM_PROPERTIES_SECTION } from "./inspector-fields-spec";

export interface RootCanvasInspectorProps {
  columns?: number;
  density?: string;
  onUpdateFormConfig?: (patch: { columns?: number; density?: string }) => void;
  disabled?: boolean;
}

/**
 * RootCanvasInspector: Configuration panel for canvas root layout.
 * Rendered whenever no specific field or container is selected.
 */
export function RootCanvasInspector({
  columns = 1,
  density = "compact",
  onUpdateFormConfig,
  disabled = false,
}: RootCanvasInspectorProps) {
  const values = React.useMemo(
    () => ({
      columns,
      density,
    }),
    [columns, density],
  );

  const handlePropertyChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!onUpdateFormConfig) return;
      if (fieldKey === "columns") {
        const numVal = Number(value) || 1;
        onUpdateFormConfig({ columns: numVal });
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
