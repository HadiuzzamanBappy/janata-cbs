"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcJsonTabProps {
  formData: InquiryConfigRecord;
}

export function IcJsonTab({ formData }: IcJsonTabProps) {
  return (
    <CbsJsonViewerTab data={formData} title="Inquiry Configuration & Layout Specification (JSON)" />
  );
}
