/**
 * @fileoverview Shared preview harness for dynamic CBS forms.
 * Used by MODEL.CONFIG, FORM.CONFIG, and custom screens to provide a live interactive
 * preview of dynamic form element schemas with zero duplicate preview code.
 *
 * @module features/form-engine/components/form-preview
 */

"use client";

import { Layout } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { FormRenderer } from "@/features/form-engine";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import { sanitizeModelConfigRecord } from "@/lib/data-parsers";
import type { FormConfigRecord, ModelConfigRecord } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";

export interface FormPreviewProps {
  frmElements?: FormConfigRecord["frmElements"];
  modelRecord?: ModelConfigRecord | null;
  emptyTitle?: string;
  emptyDescription?: string;
  hideHeader?: boolean;
  mode?: CbsScreenMode;
  values?: Record<string, unknown>;
}

/**
 * Single, authoritative, shared form preview component.
 * Supports both pre-compiled layout structures (frmElements) and raw physical models (modelRecord).
 * Zero duplicate preview code, zero fallback shims.
 */
export function FormPreview({
  frmElements,
  modelRecord,
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

  const effectiveFrmElements = React.useMemo(() => {
    if (frmElements) return frmElements;
    if (modelRecord) {
      const cleanData = sanitizeModelConfigRecord(modelRecord) ?? modelRecord;
      return compileFormSpec(cleanData, null).frmElements;
    }
    return undefined;
  }, [frmElements, modelRecord]);

  const sections = effectiveFrmElements?.sections || [];
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
        frmElements={effectiveFrmElements}
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
