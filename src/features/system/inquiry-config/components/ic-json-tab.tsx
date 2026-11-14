"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeInquiryConfigRecord } from "@/lib/data-parsers";
import type { InquiryConfigRecord } from "@/lib/data-schemas";

export interface IcJsonTabProps {
  formData: InquiryConfigRecord;
  baseline?: InquiryConfigRecord;
  raw?: unknown;
}

export function IcJsonTab({ formData, baseline, raw }: IcJsonTabProps) {
  const name = (formData.INQInfo?.controllerName || "inquiry").toLowerCase();
  const desc = formData.INQInfo?.description;

  const title = desc
    ? `${desc} — Inquiry Specification (JSON)`
    : "Inquiry Configuration & Wire Spec (JSON)";

  const cleanData = React.useMemo(() => sanitizeInquiryConfigRecord(formData), [formData]);
  const cleanBaseline = React.useMemo(() => sanitizeInquiryConfigRecord(baseline), [baseline]);

  return (
    <CbsJsonViewerTab
      data={cleanData}
      baseline={cleanBaseline}
      raw={raw}
      wireTag="SYS_INQUIRY_DEFINITION"
      title={title}
      filename={`${name}.inquiry.json`}
    />
  );
}
