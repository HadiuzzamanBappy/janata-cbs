"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { serializeMenuTreeToWireJson } from "@/lib/data-parsers";
import type { MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

interface MdJsonTabProps {
  formData: MenuTreeRecord;
}

export function MdJsonTab({ formData }: MdJsonTabProps) {
  const wire = serializeMenuTreeToWireJson(formData);
  const id = formData.recordId || "tree";

  return (
    <CbsJsonViewerTab
      data={wire}
      wireTag="SYS_MENU_TREE"
      title="Database Wire Output Payload"
      filename={`MENU_TREE_${id}.json`}
    />
  );
}
