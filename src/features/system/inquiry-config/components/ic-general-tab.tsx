"use client";

import * as React from "react";
import { SectionCard } from "@/features/form-engine/components/section-card";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction } from "@/types";
import { INQUIRY_CONFIG_SECTIONS, setInquiryFieldValue } from "../fields";
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
  // 1. Build values record matching form fields
  const formValues = React.useMemo(() => {
    const info = formData.INQInfo || ({} as InquiryConfigRecord["INQInfo"]);
    return {
      description: info.description ?? "",
      controllerName: info.controllerName ?? "",
      inqType: info.inqType ?? "DFT",
      pageOrientation: info.pageOrientation ?? "Portrait",
      perpageItem: info.perpageItem ?? 30,
      showSerial: Boolean(info.showSerial),
      showPagination: Boolean(info.showPagination),
      showBranchWise: Boolean(info.showBranchWise),
      rptControllerName: info.rptControllerName ?? "",
      inqServicePath: info.inqServicePath ?? "default",
    };
  }, [formData]);

  // 2. Map validation errors
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        // Strip "INQInfo." prefix if present
        const cleanKey = err.fieldKey.replace(/^INQInfo\./, "");
        map[cleanKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  // 3. Centralized field change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      setFormData((prev) => setInquiryFieldValue(prev, fieldKey, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        {INQUIRY_CONFIG_SECTIONS.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            values={formValues}
            onChange={handleFieldChange}
            errors={errorMap}
            disabled={isReadOnly}
            mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        ))}
      </div>
    </div>
  );
}
