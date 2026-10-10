"use client";

import { CbsAuditTab } from "@/lib/cbs-screen";
import type { MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

interface DesignerAuditTabProps {
  formData: MenuTreeRecord;
}

export function DesignerAuditTab({ formData }: DesignerAuditTabProps) {
  return <CbsAuditTab formData={formData} />;
}
