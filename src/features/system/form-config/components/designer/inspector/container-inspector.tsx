"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { CbsRecordFunction } from "@/types";
import { CONTAINER_PROPERTIES_SECTION } from "./inspector-fields-spec";

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
      let finalVal = value;
      if (fieldKey === "columns") {
        finalVal = Number(value) || 1;
      }
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
