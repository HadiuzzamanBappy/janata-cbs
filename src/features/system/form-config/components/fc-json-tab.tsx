"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeFormConfigRecord } from "@/lib/data-parsers";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

interface FcJsonTabProps {
  formData: FormConfigRecord;
  baseline?: FormConfigRecord;
  raw?: unknown;
}

export function FcJsonTab({ formData, baseline, raw }: FcJsonTabProps) {
  const title = formData.title
    ? `${formData.title} — Layout Specification (JSON)`
    : "Form Layout Presentation Specification (JSON)";

  const cleanData = React.useMemo(() => sanitizeFormConfigRecord(formData), [formData]);
  const cleanBaseline = React.useMemo(() => sanitizeFormConfigRecord(baseline), [baseline]);

  return (
    <CbsJsonViewerTab
      data={cleanData}
      baseline={cleanBaseline}
      raw={raw}
      wireTag="SYS_FORM_DEFINITION"
      title={title}
      filename="form-config.json"
    />
  );
}
