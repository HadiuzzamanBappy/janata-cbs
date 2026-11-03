"use client";

import * as React from "react";
import { FormPreview } from "@/features/form-engine";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface McPreviewTabProps {
  formData: ModelConfigRecord;
}

export function McPreviewTab({ formData }: McPreviewTabProps) {
  const spec = React.useMemo(() => compileFormSpec(formData, null), [formData]);

  return (
    <FormPreview
      frmElements={spec.frmElements}
      emptyTitle="No Fields in Model Configuration"
      emptyDescription="This model has no properties defined yet. Switch to the Properties tab to add columns before previewing."
    />
  );
}
