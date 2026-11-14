"use client";

import { InquiryPreview } from "@/components/cbs-inquiry-engine";
import type { InquiryConfigRecord } from "@/lib/data-schemas";

export interface IcPreviewTabProps {
  formData: InquiryConfigRecord;
}

/**
 * Lean wrapper delegating inquiry preview and live simulation
 * directly to the authoritative InquiryPreview component in inquiry-engine.
 */
export function IcPreviewTab({ formData }: IcPreviewTabProps) {
  return (
    <InquiryPreview
      config={formData}
      emptyTitle="No Columns or Criteria Defined"
      emptyDescription="This inquiry has no display columns or filter criteria configured yet. Switch to the Filters or Columns tab to add fields."
    />
  );
}
