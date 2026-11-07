"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction } from "@/types";
import { INQUIRY_CONFIG_SECTIONS } from "../fields";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";

export interface IcGeneralTabProps {
  formData: InquiryConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>;
  isReadOnly?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcGeneralTab({
  formData,
  setFormData,
  isReadOnly = false,
  validationErrors = [],
}: IcGeneralTabProps) {
  // 1. Map validation errors
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        const cleanKey = err.fieldKey.replace(/^INQInfo\./, "");
        map[cleanKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  // 2. Centralized field change dispatcher using standard setFieldValue
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      let finalVal = value;
      if (fieldKey === "perpageItem") {
        finalVal = value !== "" && value !== undefined && value !== null ? Number(value) : 30;
      } else if (fieldKey === "controllerName" || fieldKey === "rptControllerName") {
        finalVal = typeof value === "string" ? value.toUpperCase() : value;
      }

      setFormData((prev) => setFieldValue(prev, `INQInfo.${fieldKey}`, finalVal));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        <FormRenderer
          frmElements={{ sections: INQUIRY_CONFIG_SECTIONS }}
          values={(formData.INQInfo || {}) as Record<string, unknown>}
          onChange={handleFieldChange}
          errors={errorMap}
          disabled={isReadOnly}
          mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        />
      </div>
    </div>
  );
}
