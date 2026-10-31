"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeModelConfigRecord } from "@/lib/data-schemas/clean-record";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

interface McJsonTabProps {
  formData: ModelConfigRecord;
  baseline?: ModelConfigRecord;
}

export function McJsonTab({ formData, baseline }: McJsonTabProps) {
  const name = formData.TABLENAME || "model";

  const cleanData = React.useMemo(() => sanitizeModelConfigRecord(formData), [formData]);
  const cleanBaseline = React.useMemo(() => sanitizeModelConfigRecord(baseline), [baseline]);

  return (
    <CbsJsonViewerTab
      data={cleanData}
      baseline={cleanBaseline}
      wireTag="SYS_MODEL_DEFINITION"
      title="Database Wire Output Payload"
      filename={`${name}.config.json`}
    />
  );
}
