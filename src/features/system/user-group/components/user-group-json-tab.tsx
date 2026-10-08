"use client";

import { CbsJsonViewerTab } from "@/lib/cbs-screen";
import { serializeUserGroupToWireJson } from "@/lib/parsers";
import type { UserGroupRecord } from "@/lib/schemas/user-group-schema";

interface UserGroupJsonTabProps {
  formData: UserGroupRecord;
}

export function UserGroupJsonTab({ formData }: UserGroupJsonTabProps) {
  const wire = serializeUserGroupToWireJson(formData);
  const id = formData.recordId || "draft";

  return (
    <CbsJsonViewerTab
      data={wire}
      wireTag="SYS_USER_GROUP"
      title="Canonical Wire Payload"
      filename={`user-group-${id}.json`}
    />
  );
}
