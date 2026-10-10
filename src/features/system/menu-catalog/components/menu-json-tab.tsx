"use client";

import { CbsJsonViewerTab } from "@/lib/cbs-screen";
import { serializeMenuCatalogToWireJson } from "@/lib/data-parsers";
import type { MenuCatalogRecord } from "@/lib/data-schemas/menu-catalog-schema";

interface MenuJsonTabProps {
  formData: MenuCatalogRecord;
}

export function MenuJsonTab({ formData }: MenuJsonTabProps) {
  const wire = serializeMenuCatalogToWireJson(formData);
  const id = formData.recordId || "record";

  return (
    <CbsJsonViewerTab
      data={wire}
      wireTag="SYS_MENU"
      title="Database Wire Output Payload"
      filename={`MENU_${id}.json`}
    />
  );
}
