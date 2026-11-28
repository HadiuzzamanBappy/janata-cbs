/**
 * @fileoverview General tab for MODEL.CONFIG editor.
 * Renders model attributes, ID rules, and governance flags via FormRenderer.
 *
 * @module features/system/model-config/components/mc-general-tab
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { tabFieldErrors } from "@/lib/cbs-screen";
import type { ModelConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { MODEL_CONFIG_SECTIONS } from "../fields/mc-general-fields";
import type { ModelValidationErrorItem } from "../hooks/mc-validation";

interface McGeneralTabProps {
  formData: ModelConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>;
  isReadOnly: boolean;
  validationErrors?: ModelValidationErrorItem[];
}

export function McGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: McGeneralTabProps) {
  const errorMap = React.useMemo(
    () => tabFieldErrors(validationErrors, "general"),
    [validationErrors],
  );

  // The pattern checkboxes are a UI helper over IDPATTERN ("PF#IS"): show the stored tokens as
  // ticked, so editing them extends the saved pattern instead of starting from nothing.
  // A model saved without ID rules has no IDDEF (the record is loaded unvalidated).
  const values = React.useMemo(() => {
    const idDef = (formData.IDDEF ?? {}) as Partial<ModelConfigRecord["IDDEF"]> & {
      idPatternSelect?: string[];
    };
    if (idDef.idPatternSelect) return formData;
    const tokens = (idDef.IDPATTERN || "").split("#").filter(Boolean);
    return { ...formData, IDDEF: { ...idDef, idPatternSelect: tokens } };
  }, [formData]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl space-y-3">
        <FormRenderer
          frmElements={{ sections: MODEL_CONFIG_SECTIONS }}
          values={values}
          onRecordChange={(next) => setFormData(next as ModelConfigRecord)}
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
