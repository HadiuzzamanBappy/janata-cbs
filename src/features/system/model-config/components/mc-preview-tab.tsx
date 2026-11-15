/**
 * @fileoverview Live Form Engine preview tab for MODEL.CONFIG editor.
 * Renders interactive form preview for the configured model schema.
 *
 * @module features/system/model-config/components/mc-preview-tab
 */

"use client";

import { FormPreview } from "@/components/cbs-form-engine";
import type { ModelConfigRecord } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";

export interface McPreviewTabProps {
  formData: ModelConfigRecord;
  mode?: CbsScreenMode;
}

export function McPreviewTab({ formData, mode }: McPreviewTabProps) {
  return (
    <FormPreview
      modelRecord={formData}
      mode={mode}
      emptyTitle="No Fields in Model Configuration"
      emptyDescription="This model has no properties defined yet. Switch to the Properties tab to add columns before previewing."
    />
  );
}
