"use client";

import { CbsAuditTab } from "@/lib/cbs-screen";
import type { ModelConfigRecord } from "@/lib/schemas/model-config-schema";

interface McAuditTabProps {
  formData: ModelConfigRecord;
}

export function McAuditTab({ formData }: McAuditTabProps) {
  return <CbsAuditTab formData={formData} />;
}
