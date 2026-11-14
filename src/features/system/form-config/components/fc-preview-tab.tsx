/**
 * @fileoverview Form Configuration Live Preview Tab.
 * Renders the designed form layout interactively with client-side mock data.
 *
 * @module features/system/form-config/components/fc-preview-tab
 */

"use client";

import { FormPreview } from "@/features/form-engine";
import type { FormConfigRecord } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
  mode?: CbsScreenMode;
}

export function FcPreviewTab({ formData, mode }: FcPreviewTabProps) {
  return (
    <FormPreview
      frmElements={formData.frmElements}
      mode={mode}
      emptyTitle="No Layout Designed Yet"
      emptyDescription="The preview displays exclusively what you have designed in the Form Designer tab. Add sections and fields to view them here."
    />
  );
}
