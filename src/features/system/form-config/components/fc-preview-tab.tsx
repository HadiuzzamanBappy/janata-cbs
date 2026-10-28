"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
  targetModelRecord?: ModelConfigRecord | null;
}

export function FcPreviewTab({ formData, targetModelRecord }: FcPreviewTabProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  // Compile unified canonical form presentation using cbs-form-spec compiler
  const spec = React.useMemo(() => {
    if (targetModelRecord) {
      return compileFormSpec(targetModelRecord, formData);
    }
    return formData;
  }, [targetModelRecord, formData]);

  return (
    <div className="h-full flex-1 overflow-y-auto pr-1">
      <FormRenderer
        frmElements={spec.frmElements}
        values={formValues}
        onChange={handleInputChange}
        mode={CbsRecordFunction.INPUT}
      />
    </div>
  );
}
