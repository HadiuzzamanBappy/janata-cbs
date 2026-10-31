"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

interface McJsonTabProps {
  formData: ModelConfigRecord;
  baseline?: ModelConfigRecord;
}

export function McJsonTab({ formData, baseline }: McJsonTabProps) {
  const name = formData.TABLENAME || "model";

  return (
    <CbsJsonViewerTab
      data={formData}
      baseline={baseline}
      wireTag="SYS_MODEL_DEFINITION"
      title="Database Wire Output Payload"
      filename={`${name}.config.json`}
    />
  );
}
