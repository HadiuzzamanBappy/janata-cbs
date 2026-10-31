"use client";

import * as React from "react";
import { SectionCard } from "@/features/form-engine/components/section-card";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import { CbsRecordFunction } from "@/types";
import { FORM_CONFIG_SECTIONS, setFieldValue } from "../fields";
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
  // 1. Build values record matching form fields
  const formValues = React.useMemo(() => {
    return {
      title: formData.title ?? "",
      description: formData.description ?? "",
      authNumber: formData.authNumber ?? 1,
    };
  }, [formData]);

  // 2. Map validation errors
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  // 3. Centralized field change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      setFormData((prev) => setFieldValue(prev, fieldKey, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        {FORM_CONFIG_SECTIONS.map((section) => (
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
