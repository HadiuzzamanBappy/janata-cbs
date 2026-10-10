"use client";

import { CbsAuditTab } from "@/lib/cbs-screen";
import type { MenuCatalogRecord } from "@/lib/data-schemas/menu-catalog-schema";

interface MenuAuditTabProps {
  formData: MenuCatalogRecord;
}

export function MenuAuditTab({ formData }: MenuAuditTabProps) {
  return <CbsAuditTab formData={formData} />;
}
