"use client";

import { InquiryPreview } from "@/features/inquiry-engine";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcPreviewTabProps {
  formData: InquiryConfigRecord;
}

/**
 * Lean wrapper delegating inquiry preview and live simulation
 * directly to the authoritative InquiryPreview component in inquiry-engine.
 */
export function IcPreviewTab({ formData }: IcPreviewTabProps) {
  return <InquiryPreview config={formData} />;
}
