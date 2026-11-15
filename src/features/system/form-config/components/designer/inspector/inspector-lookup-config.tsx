/**
 * @fileoverview Lookup and options configuration sub-panel for Form Designer.
 * Supports Static Options lists (O), Model Entity Lookups (M), and Local Catalogs (L).
 * Rendered purely through Form Engine using standard JSON specifications.
 *
 * @module features/system/form-config/components/designer/inspector/inspector-lookup-config
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import {
  DROPDOWN_LOCAL_SECTION,
  DROPDOWN_LOOKUP_SECTION,
  DROPDOWN_OPTIONS_SECTION,
  DROPDOWN_SOURCE_SELECTOR_SECTION,
} from "@/features/system/form-config/fields/fc-lookup-fields";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormElement } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";

export interface InspectorLookupConfigProps {
  selectedField: FormElement;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

/**
 * InspectorLookupConfig: Configures static options lists (O), model lookups (M),
 * or local CBS catalog tables (L) for dropdown, radio-group, and segmented selectors.
 * Fully managed through Form Engine schemas with multi-object repeating support.
 */
export function InspectorLookupConfig({
  selectedField,
  onUpdateField,
  disabled = false,
}: InspectorLookupConfigProps) {
  const param = (selectedField.PARAMETER || {}) as Record<string, unknown>;
  const paramType = (param.type as string) || "O";

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const updated = setFieldValue(selectedField as Record<string, unknown>, fieldKey, value);
      onUpdateField({
        PARAMETER: updated.PARAMETER as FormElement["PARAMETER"],
      });
    },
    [selectedField, onUpdateField],
  );

  const activeSection =
    paramType === "O"
      ? DROPDOWN_OPTIONS_SECTION
      : paramType === "L"
        ? DROPDOWN_LOCAL_SECTION
        : DROPDOWN_LOOKUP_SECTION;

  return (
    <div className="space-y-2">
      <FormRenderer
        frmElements={{ sections: [DROPDOWN_SOURCE_SELECTOR_SECTION, activeSection] }}
        values={selectedField as Record<string, unknown>}
        onChange={handleFieldChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
        className="overflow-visible"
      />
    </div>
  );
}
