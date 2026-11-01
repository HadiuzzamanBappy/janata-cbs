"use client";

import { CbsAuditTab } from "@/components/cbs-screen";
import type { MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

interface MdAuditTabProps {
  formData: MenuTreeRecord;
}

export function MdAuditTab({ formData }: MdAuditTabProps) {
  return <CbsAuditTab formData={formData} />;
}
