"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
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
  // 1. Map validation errors to field names
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  // 2. Centralized change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      setFormData((prev) => setFieldValue(prev, fieldKey, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3">
        <FormRenderer
          frmElements={{ sections: MODEL_CONFIG_SECTIONS }}
          values={formData}
          onChange={handleFieldChange}
          errors={errorMap}
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
