"use client";

import { Layout } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { FormRenderer } from "@/features/form-engine";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
  targetModelRecord?: ModelConfigRecord | null;
}

export function FcPreviewTab({ formData }: FcPreviewTabProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const sections = formData.frmElements?.sections || [];
  const totalFields = sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0);
  const hasDesign = sections.length > 0 && totalFields > 0;

  if (!hasDesign) {
    return (
      <div className="h-full w-full flex-1">
        <EmptyState
          icon={Layout}
          title="No Layout Designed Yet"
          description="The preview displays exclusively what you have designed in the Form Designer tab. Add sections and fields to view them here."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 overflow-y-auto pr-1">
      <FormRenderer
        frmElements={formData.frmElements}
        values={formValues}
        onChange={handleInputChange}
        mode={CbsRecordFunction.INPUT}
      />
    </div>
  );
}
