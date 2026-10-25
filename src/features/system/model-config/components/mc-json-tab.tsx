"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { serializeModelToWireJson } from "@/lib/data-parsers";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

interface McJsonTabProps {
  formData: ModelConfigRecord;
}

export function McJsonTab({ formData }: McJsonTabProps) {
  const wire = serializeModelToWireJson(formData);
  const name = formData.tableName || "model";

  return (
    <CbsJsonViewerTab
      data={wire}
      wireTag="SYS_MODEL_DEFINITION"
      title="Database Wire Output Payload"
      filename={`${name}.config.json`}
    />
  );
}
