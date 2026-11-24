/**
 * @fileoverview Routine configuration tab for FORM.CONFIG.
 * Renders individual lifecycle routine hook cards (Validation, Pre-Auth, Post-Auth).
 *
 * @module features/system/form-config/components/fc-routine-tab
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { FORM_ROUTINE_SECTIONS } from "../fields/fc-routine-fields";

export interface FcRoutineTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
  errors?: Record<string, string>;
}

export function FcRoutineTab({
  formData,
  setFormData,
  isReadOnly = false,
  errors = {},
}: FcRoutineTabProps) {
  const handleChange = React.useCallback(
    (key: string, value: unknown) => {
      setFormData((prev) => {
        const next = setFieldValue(prev as Record<string, unknown>, key, value);
        return next as unknown as FormConfigRecord;
      });
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        <FormRenderer
          frmElements={{ sections: FORM_ROUTINE_SECTIONS }}
          values={formData as unknown as Record<string, unknown>}
          onChange={handleChange}
          errors={errors}
          disabled={isReadOnly}
          mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        />
      </div>
    </div>
  );
}
