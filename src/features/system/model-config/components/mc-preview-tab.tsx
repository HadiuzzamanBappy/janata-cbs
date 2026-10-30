"use client";

import { Database } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
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

  const hasFields =
    (spec.frmElements?.sections || []).some((sec) => (sec.fields || []).length > 0) ||
    Boolean(formData.PROPERTIES && formData.PROPERTIES.length > 0);

  if (!hasFields) {
    return (
      <div className="h-full w-full flex-1">
        <EmptyState
          icon={Database}
          title="No Fields in Model Configuration"
          description="This model has no properties defined yet. Switch to the Properties tab to add columns before previewing."
        />
      </div>
    );
  }

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
