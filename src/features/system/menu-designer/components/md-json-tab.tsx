"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeMenuTreeRecord } from "@/lib/data-parsers";
import type { MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

interface MdJsonTabProps {
  formData: MenuTreeRecord;
  baseline?: MenuTreeRecord;
  raw?: unknown;
}

export function MdJsonTab({ formData, baseline, raw }: MdJsonTabProps) {
  const wire = sanitizeMenuTreeRecord(formData);
  const baselineWire = baseline ? sanitizeMenuTreeRecord(baseline) : undefined;
  const id = formData.recordId || "tree";

  return (
    <CbsJsonViewerTab
      data={wire}
      baseline={baselineWire}
      raw={raw}
      wireTag="SYS_MENU_TREE"
      title="Database Wire Output Payload"
      filename={`MENU_TREE_${id}.json`}
    />
  );
}
