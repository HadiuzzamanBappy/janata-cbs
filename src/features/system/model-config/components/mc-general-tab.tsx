/**
 * @fileoverview General tab for MODEL.CONFIG editor.
 * Renders model attributes, ID rules, and governance flags via FormRenderer.
 *
 * @module features/system/model-config/components/mc-general-tab
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import type { ModelConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { MODEL_CONFIG_SECTIONS } from "../fields/mc-general-fields";
import type { ModelValidationErrorItem } from "../hooks/mc-validation";

interface McGeneralTabProps {
  formData: ModelConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>;
  isReadOnly: boolean;
  validationErrors?: ModelValidationErrorItem[];
}

export function McGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: McGeneralTabProps) {
  // 1. Map external domain validation errors to field names
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3">
        <FormRenderer
          frmElements={{ sections: MODEL_CONFIG_SECTIONS }}
          values={formData}
          onRecordChange={(next) => setFormData(next as ModelConfigRecord)}
          externalErrors={errorMap}
          disabled={isReadOnly}
          mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          showAuditSection={true}
          auditData={formData.auditData}
          auditVariant="card"
        />
      </div>
    </div>
  );
}
