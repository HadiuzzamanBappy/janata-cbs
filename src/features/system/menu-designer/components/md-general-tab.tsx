"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import type {
  MenuDesignerValidationError,
  MenuTreeRecord,
} from "@/lib/data-schemas/menu-designer-schema";
import { CbsRecordFunction } from "@/types";
import { MENU_DESIGNER_SECTIONS, setMenuDesignerFieldValue } from "../fields";

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
