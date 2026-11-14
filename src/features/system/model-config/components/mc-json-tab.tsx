/**
 * @fileoverview Raw JSON & wire payload inspector tab for MODEL.CONFIG.
 * Shows sanitized record payload, persistence baseline, and raw server response.
 *
 * @module features/system/model-config/components/mc-json-tab
 */

"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeModelConfigRecord } from "@/lib/data-parsers";
import type { ModelConfigRecord } from "@/lib/data-schemas";

export interface McJsonTabProps {
  formData: ModelConfigRecord;
  baseline?: ModelConfigRecord;
  raw?: unknown;
}

export function McJsonTab({ formData, baseline, raw }: McJsonTabProps) {
  const name = formData.TABLENAME ? formData.TABLENAME.toLowerCase() : "model";

  const title = formData.TABLENAME
    ? `${formData.TABLENAME} — Database Wire Schema (JSON)`
    : "Database Wire Output Payload (JSON)";

  const cleanData = React.useMemo(() => sanitizeModelConfigRecord(formData), [formData]);
  const cleanBaseline = React.useMemo(() => sanitizeModelConfigRecord(baseline), [baseline]);

  return (
    <CbsJsonViewerTab
      data={cleanData}
      baseline={cleanBaseline}
      raw={raw}
      wireTag="SYS_MODEL_DEFINITION"
      title={title}
      filename={`${name}.config.json`}
    />
  );
}
