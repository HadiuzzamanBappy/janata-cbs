"use client";

import { Layout } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { FormRenderer } from "@/features/form-engine";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";

export interface FormPreviewProps {
  frmElements?: FormConfigRecord["frmElements"];
  emptyTitle?: string;
  emptyDescription?: string;
  hideHeader?: boolean;
  mode?: CbsScreenMode;
  values?: Record<string, unknown>;
}

/**
 * Single, authoritative, shared form preview component.
 * Used by MODEL.CONFIG, CONFIG.FORM, and custom screens.
 * Zero duplicate preview code, zero fallback shims.
 */
export function FormPreview({
  frmElements,
  emptyTitle = "No Layout Designed Yet",
  emptyDescription = "There are no sections or fields to preview.",
  hideHeader = false,
  mode = CbsRecordFunction.INPUT,
  values: initialValues,
}: FormPreviewProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>(initialValues || {});

  React.useEffect(() => {
    if (initialValues) {
      setFormValues(initialValues);
    }
  }, [initialValues]);

  const handleInputChange = React.useCallback((key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const sections = frmElements?.sections || [];
  const totalFields = sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0);
  const hasFields = sections.length > 0 && totalFields > 0;

  if (!hasFields) {
    return (
      <div className="h-full w-full flex-1">
        <EmptyState icon={Layout} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 overflow-y-auto pr-1">
      <FormRenderer
        frmElements={frmElements}
        values={formValues}
        onChange={handleInputChange}
        mode={mode}
        hideHeader={hideHeader}
        auditData={{
          recStatus: "AU",
          recCurrNumber: 1,
          recInputter: "DEV.USER_01",
          recInputTime: "2602121545",
          recAuthorizer: "AUTH.USER_01",
          recAuthTime: "2602121546",
          recBranchCode: "JB0001",
        }}
        showAuditSection
      />
    </div>
  );
}
