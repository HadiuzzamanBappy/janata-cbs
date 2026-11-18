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
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { FormElement } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import {
  DROPDOWN_LOCAL_SECTION,
  DROPDOWN_LOOKUP_SECTION,
  DROPDOWN_OPTIONS_SECTION,
  DROPDOWN_SOURCE_SELECTOR_SECTION,
} from "../../../fields/fc-lookup-fields";

export interface InspectorLookupConfigProps {
  selectedField: FormElement;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
  modelName?: string;
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
  modelName = "",
}: InspectorLookupConfigProps) {
  const cleanModel = modelName.trim();
  const hasModel = Boolean(cleanModel);
  const param = (selectedField.PARAMETER || {}) as Record<string, unknown>;
  const paramType = hasModel ? "M" : (param.type as string) || "O";

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      // Invariant: Model columns cannot change their source away from Model (M)
      // or change their physical Target Model
      if (hasModel) {
        if (fieldKey === "PARAMETER.type" && value !== "M") return;
        if (fieldKey === "PARAMETER.modelName" && value !== cleanModel) return;
      }
      const updated = setFieldValue(selectedField as Record<string, unknown>, fieldKey, value);
      onUpdateField({
        PARAMETER: updated.PARAMETER as FormElement["PARAMETER"],
      });
    },
    [selectedField, onUpdateField, hasModel, cleanModel],
  );

  const sourceSection = React.useMemo(() => {
    if (!hasModel) return DROPDOWN_SOURCE_SELECTOR_SECTION;
    return {
      ...DROPDOWN_SOURCE_SELECTOR_SECTION,
      fields: DROPDOWN_SOURCE_SELECTOR_SECTION.fields.map((f) => ({
        ...f,
        DISABLED: true,
        ENRICHTEXT: `Dropdown source locked to Model for ${cleanModel}.`,
      })),
    };
  }, [hasModel, cleanModel]);

  const activeSection = React.useMemo(() => {
    if (hasModel) {
      return {
        ...DROPDOWN_LOOKUP_SECTION,
        fields: DROPDOWN_LOOKUP_SECTION.fields.map((f) => {
          if (f.NAME === "PARAMETER.modelName") {
            return {
              ...f,
              DISABLED: true,
              ENRICHTEXT: `Target Model is defined by database schema (${cleanModel}) and cannot be changed here.`,
            };
          }
          return f;
        }),
      };
    }
    return paramType === "O"
      ? DROPDOWN_OPTIONS_SECTION
      : paramType === "L"
        ? DROPDOWN_LOCAL_SECTION
        : DROPDOWN_LOOKUP_SECTION;
  }, [hasModel, paramType, cleanModel]);

  const effectiveValues = React.useMemo(() => {
    if (!hasModel) return selectedField as Record<string, unknown>;
    const currentParam = (selectedField.PARAMETER || {}) as Record<string, unknown>;
    if (currentParam.type === "M" && currentParam.modelName === cleanModel) {
      return selectedField as Record<string, unknown>;
    }
    return {
      ...selectedField,
      PARAMETER: {
        ...currentParam,
        type: "M",
        modelName: cleanModel,
      },
    };
  }, [selectedField, hasModel, cleanModel]);

  return (
    <div className="space-y-2">
      <FormRenderer
        frmElements={{ sections: [sourceSection, activeSection] }}
        values={effectiveValues}
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
