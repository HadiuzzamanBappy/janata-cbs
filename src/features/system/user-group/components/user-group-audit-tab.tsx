"use client";

import { CbsAuditTab } from "@/components/cbs-screen";
import type { UserGroupRecord } from "@/lib/data-schemas/user-group-schema";

interface UserGroupAuditTabProps {
  formData: UserGroupRecord;
}

export function UserGroupAuditTab({ formData }: UserGroupAuditTabProps) {
  return <CbsAuditTab formData={formData} />;
}
