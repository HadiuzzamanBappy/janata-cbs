"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import { CbsRecordFunction } from "@/types";
import { FORM_CONFIG_SECTIONS } from "../fields";
import type { FormConfigValidationError } from "../hooks/fc-validation";

export interface FcGeneralTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
  validationErrors?: FormConfigValidationError[];
}

export function FcGeneralTab({
  formData,
  setFormData,
  isReadOnly = false,
  validationErrors = [],
}: FcGeneralTabProps) {
  // Map validation errors for general tab
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  // Centralized field change dispatcher via standard setFieldValue
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      let finalVal = value;
      if (fieldKey === "authNumber") {
        finalVal = value !== "" && value !== undefined && value !== null ? Number(value) : 1;
      }
      setFormData((prev) => setFieldValue(prev, fieldKey, finalVal));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        <FormRenderer
          frmElements={{ sections: FORM_CONFIG_SECTIONS }}
          values={formData as unknown as Record<string, unknown>}
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
