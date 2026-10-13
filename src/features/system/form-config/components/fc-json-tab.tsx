"use client";

import { CbsJsonViewerTab } from "@/components/cbs-screen";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export function FcJsonTab({ formData }: { formData: FormConfigRecord }) {
  return <CbsJsonViewerTab data={formData} title="Form Layout Presentation Specification (JSON)" />;
}
