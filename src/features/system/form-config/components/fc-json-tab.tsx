/**
 * @fileoverview Form Configuration Raw JSON Wire Representation Tab.
 * Inspects normalized JSON schemas and diffs against baseline records.
 *
 * @module features/system/form-config/components/fc-json-tab
 */

"use client";

import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { sanitizeFormConfigRecord } from "@/lib/data-parsers";
import type { FormConfigRecord } from "@/lib/data-schemas";

export interface FcJsonTabProps {
  formData: FormConfigRecord;
  baseline?: FormConfigRecord;
  raw?: unknown;
}

export function FcJsonTab({ formData, baseline, raw }: FcJsonTabProps) {
  const name = formData.title ? formData.title.toLowerCase().replace(/\s+/g, "-") : "form";

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
      filename={`${name}.config.json`}
    />
  );
}
