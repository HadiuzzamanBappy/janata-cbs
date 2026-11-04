"use client";

import { FormPreview } from "@/features/form-engine";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
  targetModelRecord?: ModelConfigRecord | null;
}

export function FcPreviewTab({ formData }: FcPreviewTabProps) {
  return (
    <FormPreview
      frmElements={formData.frmElements}
      emptyTitle="No Layout Designed Yet"
      emptyDescription="The preview displays exclusively what you have designed in the Form Designer tab. Add sections and fields to view them here."
    />
  );
}
