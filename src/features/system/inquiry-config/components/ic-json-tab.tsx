"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-schemas/clean-record";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcJsonTabProps {
  formData: InquiryConfigRecord;
  baseline?: InquiryConfigRecord;
}

export function IcJsonTab({ formData, baseline }: IcJsonTabProps) {
  const name = formData.INQInfo?.controllerName || "inquiry";
  const cleanData = React.useMemo(() => sanitizeInquiryConfigRecord(formData), [formData]);
  const cleanBaseline = React.useMemo(() => sanitizeInquiryConfigRecord(baseline), [baseline]);

  return (
    <CbsJsonViewerTab
      data={cleanData}
      baseline={cleanBaseline}
      wireTag="SYS_INQUIRY_DEFINITION"
      title="Inquiry Configuration & Wire Spec (JSON)"
      filename={`${name}.inquiry.json`}
    />
  );
}
