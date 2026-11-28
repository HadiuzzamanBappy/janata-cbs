/**
 * @fileoverview Form Configuration General Metadata Tab.
 * Configures the top-level form title, description and authorization level.
 *
 * @module features/system/form-config/components/fc-general-tab
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { tabFieldErrors } from "@/lib/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { FORM_CONFIG_SECTIONS } from "../fields/fc-general-fields";
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
  const errorMap = React.useMemo(
    () => tabFieldErrors(validationErrors, "general"),
    [validationErrors],
  );

  // Values are stored as typed; the save schema reads a cleared Authorization Level as 1
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      setFormData((prev) => setFieldValue(prev, fieldKey, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3 pb-8">
        <FormRenderer
          frmElements={{ sections: FORM_CONFIG_SECTIONS }}
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
