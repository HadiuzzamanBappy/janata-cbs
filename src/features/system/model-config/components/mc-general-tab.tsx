"use client";

import * as React from "react";
import { SectionCard } from "@/features/form-engine/components/section-card";
import type {
  ModelConfigRecord,
  ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { MODEL_CONFIG_SECTIONS, setFieldValue } from "../fields";

interface McGeneralTabProps {
  formData: ModelConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>;
  isReadOnly: boolean;
  validationErrors?: ValidationErrorItem[];
}

export function McGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: McGeneralTabProps) {
  // 1. Build values record matching FormFieldItem names
  const formValues = React.useMemo(() => {
    const vals: Record<string, unknown> = {
      ...formData,
      "IDDEF.IDPREFIX": formData.IDDEF?.IDPREFIX ?? "",
      "IDDEF.idPatternSelect": formData.IDDEF?.IDPATTERN
        ? formData.IDDEF.IDPATTERN.split("#").filter(Boolean)
        : [],
      "IDDEF.IDPATTERN": formData.IDDEF?.IDPATTERN ?? "",
      "IDDEF.SEQUENCELENGTH": formData.IDDEF?.SEQUENCELENGTH ?? "",
      "IDDEF.SEQUENCERESET": formData.IDDEF?.SEQUENCERESET ?? false,
    };
    return vals;
  }, [formData]);

  // 2. Map validation errors to field names
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "general" && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors]);

  // 3. Centralized change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      setFormData((prev) => setFieldValue(prev, fieldKey, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3">
        {MODEL_CONFIG_SECTIONS.map((section) => (
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
