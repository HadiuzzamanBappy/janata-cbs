"use client";

import { CbsAuditTab } from "@/components/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export function FcAuditTab({ formData }: { formData: FormConfigRecord }) {
  return <CbsAuditTab formData={formData} />;
}
