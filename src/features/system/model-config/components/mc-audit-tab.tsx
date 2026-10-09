"use client";

import { CbsAuditTab } from "@/lib/cbs-screen";
import { AUDIT_FIELD_REGISTRY, AUDIT_SECTIONS } from "../config/audit-fields";
import type { ModelConfigRecord } from "@/lib/schemas/model-config-schema";

interface McAuditTabProps {
  formData: ModelConfigRecord;
}

export function McAuditTab({ formData }: McAuditTabProps) {
  return (
    <CbsAuditTab
      formData={formData}
      sections={AUDIT_SECTIONS}
      fields={AUDIT_FIELD_REGISTRY}
    />
  );
}
