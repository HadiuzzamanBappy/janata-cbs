"use client";

import * as React from "react";
import { FormRenderer } from "@/features/form-engine";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";

export interface McPreviewTabProps {
  formData: ModelConfigRecord;
}

export function McPreviewTab({ formData }: McPreviewTabProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  // Compile unified canonical form presentation using cbs-form-spec compiler
  const spec = React.useMemo(() => {
    return compileFormSpec(formData, null);
  }, [formData]);

  return (
    <div className="h-full flex-1 overflow-y-auto pr-1">
      <FormRenderer
        presentation={spec.presentation}
        values={formValues}
        onChange={handleInputChange}
        mode={CbsRecordFunction.INPUT}
      />
    </div>
  );
}
