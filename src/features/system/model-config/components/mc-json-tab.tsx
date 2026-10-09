"use client";

import { CbsJsonViewerTab } from "@/lib/cbs-screen";
import { serializeModelToWireJson } from "@/lib/parsers";
import type { ModelConfigRecord } from "@/lib/schemas/model-config-schema";

interface McJsonTabProps {
  formData: ModelConfigRecord;
}

export function McJsonTab({ formData }: McJsonTabProps) {
  const wire = serializeModelToWireJson(formData);
  const name = formData.tableName || formData.recordId || "model";

  return (
    <CbsJsonViewerTab
      data={wire}
      wireTag="SYS_MODEL_DEFINITION"
      title="Database Wire Output Payload"
      filename={`${name}.config.json`}
    />
  );
}
