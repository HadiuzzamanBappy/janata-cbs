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
import { tabFieldErrors } from "@/lib/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { FORM_ROUTINE_SECTIONS } from "../fields/fc-routine-fields";
import type { FormConfigValidationError } from "../hooks/fc-validation";

export interface FcRoutineTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
  validationErrors?: FormConfigValidationError[];
}

export function FcRoutineTab({
  formData,
  setFormData,
  isReadOnly = false,
  validationErrors = [],
}: FcRoutineTabProps) {
  const errorMap = React.useMemo(
    () => tabFieldErrors(validationErrors, "routines"),
    [validationErrors],
  );

  const handleChange = React.useCallback(
    (key: string, value: unknown) => {
      setFormData((prev) => setFieldValue(prev, key, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        <FormRenderer
          frmElements={{ sections: FORM_ROUTINE_SECTIONS }}
          values={formData}
          onChange={handleChange}
          errors={errorMap}
          disabled={isReadOnly}
          mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        />
      </div>
    </div>
  );
}
