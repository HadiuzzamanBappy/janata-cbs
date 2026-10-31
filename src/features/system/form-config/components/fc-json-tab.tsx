"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeFormConfigRecord } from "@/lib/data-schemas/clean-record";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

interface FcJsonTabProps {
  formData: FormConfigRecord;
  baseline?: FormConfigRecord;
}

export function FcJsonTab({ formData, baseline }: FcJsonTabProps) {
  const title = formData.title
    ? `${formData.title} — Layout Specification (JSON)`
    : "Form Layout Presentation Specification (JSON)";

  const cleanData = React.useMemo(() => sanitizeFormConfigRecord(formData), [formData]);
  const cleanBaseline = React.useMemo(() => sanitizeFormConfigRecord(baseline), [baseline]);

  return (
    <CbsJsonViewerTab
      data={cleanData}
      baseline={cleanBaseline}
      wireTag="SYS_FORM_DEFINITION"
      title={title}
      filename="form-config.json"
    />
  );
}
