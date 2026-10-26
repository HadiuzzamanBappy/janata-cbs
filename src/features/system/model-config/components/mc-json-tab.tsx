"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

interface McJsonTabProps {
  formData: ModelConfigRecord;
}

export function McJsonTab({ formData }: McJsonTabProps) {
  const name = formData.TABLENAME || "model";

  return (
    <CbsJsonViewerTab
      data={formData}
      wireTag="SYS_MODEL_DEFINITION"
      title="Database Wire Output Payload"
      filename={`${name}.config.json`}
    />
  );
}
