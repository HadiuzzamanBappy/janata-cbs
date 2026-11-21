"use client";

import { InquiryPreview } from "@/components/cbs-inquiry-engine";
import type { InquiryConfigRecord } from "@/lib/data-schemas";
import { CbsRecordStatus } from "@/types";

export interface IcPreviewTabProps {
  inquiryId: string;
  formData: InquiryConfigRecord;
  isDirty: boolean;
}

/** The designer's Live Preview: the draft's layout over the saved, live inquiry's data. */
export function IcPreviewTab({ inquiryId, formData, isDirty }: IcPreviewTabProps) {
  return (
    <InquiryPreview
      inquiryId={inquiryId}
      config={formData}
      draftDiffers={isDirty || formData.auditData?.recStatus !== CbsRecordStatus.AU}
    />
  );
}
