"use client";

import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcJsonTabProps {
  formData: InquiryConfigRecord;
}

export function IcJsonTab({ formData }: IcJsonTabProps) {
  return (
    <pre className="p-3 bg-muted/40 rounded-md font-mono text-xs overflow-auto h-full border border-border/60 mt-2">
      {JSON.stringify(formData, null, 2)}
    </pre>
  );
}
