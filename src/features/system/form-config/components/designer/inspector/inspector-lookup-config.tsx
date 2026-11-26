/**
 * @fileoverview Lookup and options configuration sub-panel for Form Designer.
 * Minimal, unified FormRenderer implementation for Static Options (O) and Lookup (M)
 * with a clean in-form choice between Flat List and Array List.
 *
 * @module features/system/form-config/components/designer/inspector/inspector-lookup-config
 */

"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { setFieldValue } from "@/lib/cbs-form-spec";
import {
  CBS_PARAMETER_TYPE,
  type FormElement,
  type FormSection,
  isArrayLookup,
  isLookupParameter,
} from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import {
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
 * InspectorLookupConfig: Simple, unified inspector with an inline Flat List vs Array List selector.
 */
export function InspectorLookupConfig({
  selectedField,
  onUpdateField,
  disabled = false,
  modelName = "",
}: InspectorLookupConfigProps) {
  const cleanModel = modelName.trim();
  const hasModel = Boolean(cleanModel);
  // Source: a field with a model is locked to a lookup; otherwise fixed options or a lookup
  const sourceMode =
    hasModel || isLookupParameter(selectedField.PARAMETER)
      ? CBS_PARAMETER_TYPE.MODEL
      : CBS_PARAMETER_TYPE.OPTIONS;
  // Lookup type, Flat List vs Array List, is the parameter type itself
  const lookupType = isArrayLookup(selectedField.PARAMETER) ? "array" : "flat";

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      // Invariant: Model columns cannot change away from Model (M)
      if (hasModel) {
        if (fieldKey === "PARAMETER.type" && value !== CBS_PARAMETER_TYPE.MODEL) return;
        if (fieldKey === "PARAMETER.modelName" && value !== cleanModel) return;
      }

      // Inline choice: Flat List vs Array List
      if (fieldKey === "_lookupType") {
        const nextType = value === "array" ? "array" : "flat";

        const currentParam = (selectedField.PARAMETER || {}) as Record<string, unknown>;
        const existingData = Array.isArray(currentParam.data) ? currentParam.data : [];

        onUpdateField({
          PARAMETER: {
            ...currentParam,
            type: nextType === "array" ? CBS_PARAMETER_TYPE.ARRAY : CBS_PARAMETER_TYPE.MODEL,
            data: existingData,
            modelName: hasModel ? cleanModel : (currentParam.modelName as string) || "",
            // Retain condition across both flat and array modes
            condition: (currentParam.condition as string) || "",
            recordId: nextType === "array" ? (currentParam.recordId as string) || "" : undefined,
            arrayField:
              nextType === "array" ? (currentParam.arrayField as string) || "" : undefined,
          },
        });
        return;
      }

      // Switching source between Static (O) and Lookup (M)
      if (fieldKey === "PARAMETER.type") {
        const currentParam = (selectedField.PARAMETER || {}) as Record<string, unknown>;
        const existingData = Array.isArray(currentParam.data) ? currentParam.data : [];

        if (value === CBS_PARAMETER_TYPE.MODEL) {
          onUpdateField({
            PARAMETER: {
              ...currentParam,
              type: lookupType === "array" ? CBS_PARAMETER_TYPE.ARRAY : CBS_PARAMETER_TYPE.MODEL,
              data: existingData,
              modelName: hasModel ? cleanModel : (currentParam.modelName as string) || "",
            },
          });
          return;
        }

        onUpdateField({
          PARAMETER: {
            ...currentParam,
            type: CBS_PARAMETER_TYPE.OPTIONS,
            data: existingData,
          },
        });
        return;
      }

      const updated = setFieldValue(selectedField as Record<string, unknown>, fieldKey, value);
      onUpdateField({
        PARAMETER: updated.PARAMETER as FormElement["PARAMETER"],
      });
    },
    [selectedField, onUpdateField, hasModel, cleanModel, lookupType],
  );

  const sourceSection = React.useMemo(() => {
    if (!hasModel) return DROPDOWN_SOURCE_SELECTOR_SECTION;
    return {
      ...DROPDOWN_SOURCE_SELECTOR_SECTION,
      fields: DROPDOWN_SOURCE_SELECTOR_SECTION.fields.map((f) => ({
        ...f,
        DISABLED: true,
        ENRICHTEXT: `Locked to Model for ${cleanModel}.`,
      })),
    };
  }, [hasModel, cleanModel]);

  const activeSection = React.useMemo<FormSection>(() => {
    if (sourceMode === CBS_PARAMETER_TYPE.OPTIONS) {
      return DROPDOWN_OPTIONS_SECTION;
    }

    if (hasModel) {
      return {
        ...DROPDOWN_LOOKUP_SECTION,
        fields: DROPDOWN_LOOKUP_SECTION.fields.map((f) => {
          if (f.NAME === "PARAMETER.modelName") {
            return {
              ...f,
              DISABLED: true,
              ENRICHTEXT: `Model is defined by database schema (${cleanModel}).`,
            };
          }
          return f;
        }),
      };
    }

    return DROPDOWN_LOOKUP_SECTION;
  }, [sourceMode, hasModel, cleanModel]);

  const effectiveValues = React.useMemo(() => {
    const currentParam = (selectedField.PARAMETER || {}) as Record<string, unknown>;
    const effectiveParam = { ...currentParam };

    if (hasModel) {
      effectiveParam.modelName = cleanModel;
    }

    // The source selector offers O and M: an array lookup (A) shows as M, no parameter as O
    effectiveParam.type = sourceMode;

    return {
      ...selectedField,
      _lookupType: lookupType,
      PARAMETER: effectiveParam,
    };
  }, [selectedField, hasModel, cleanModel, sourceMode, lookupType]);

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
