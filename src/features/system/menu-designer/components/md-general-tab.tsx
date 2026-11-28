"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { tabFieldErrors } from "@/lib/cbs-screen";
import type { MenuDesignerValidationError, MenuTreeRecord } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { MENU_DESIGNER_SECTIONS, setMenuDesignerFieldValue } from "../fields/md-general-fields";

interface MdGeneralTabProps {
  formData: MenuTreeRecord;
  setFormData: React.Dispatch<React.SetStateAction<MenuTreeRecord>>;
  isReadOnly: boolean;
  validationErrors?: MenuDesignerValidationError[];
}

export function MdGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: MdGeneralTabProps) {
  // 1. Build values record matching form fields
  const formValues = React.useMemo(() => {
    return {
      treeDescription: formData.treeDescription ?? "",
      isActive: Boolean(formData.isActive),
    };
  }, [formData]);

  // 2. Validation errors for this tab
  const errorMap = React.useMemo(
    () => tabFieldErrors(validationErrors, "general"),
    [validationErrors],
  );

  // 3. Centralized field change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      setFormData((prev) => setMenuDesignerFieldValue(prev, fieldKey, value));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl space-y-3 pb-8">
        <FormRenderer
          frmElements={{ sections: MENU_DESIGNER_SECTIONS }}
          values={formValues}
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
