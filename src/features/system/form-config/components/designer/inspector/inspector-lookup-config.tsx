"use client";

import { Database, ListOrdered } from "lucide-react";
import * as React from "react";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import {
  DROPDOWN_LOOKUP_SECTION,
  DROPDOWN_OPTIONS_SECTION,
} from "@/features/system/model-config/fields/mc-lookup-fields";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { CbsRecordFunction } from "@/types";

export interface InspectorLookupConfigProps {
  selectedField: FormElement;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

/**
 * InspectorLookupConfig: Configures static options lists (O) or model lookups (M)
 * for dropdown, radio-group, and segmented selectors in a flat, high-density layout.
 */
export function InspectorLookupConfig({
  selectedField,
  onUpdateField,
  disabled,
}: InspectorLookupConfigProps) {
  const param = (selectedField.PARAMETER || {}) as Record<string, unknown>;
  const paramType = (param.type as string) || "O";

  const handleSetType = (t: "O" | "M") => {
    onUpdateField({
      PARAMETER: {
        ...param,
        type: t,
        data: t === "O" ? (Array.isArray(param.data) ? param.data : []) : [],
      },
    });
  };

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const updated = setFieldValue(selectedField as Record<string, unknown>, fieldKey, value);
      onUpdateField({
        PARAMETER: updated.PARAMETER as FormElement["PARAMETER"],
      });
    },
    [selectedField, onUpdateField],
  );

  const activeSection = paramType === "O" ? DROPDOWN_OPTIONS_SECTION : DROPDOWN_LOOKUP_SECTION;

  return (
    <div className="pt-2.5 border-t border-border/50 space-y-2 select-none text-xs">
      {/* Header Label & Active Type */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground">Dropdown Source</span>
        <span className="text-[10px] font-mono font-bold text-primary uppercase">
          {paramType === "O" ? "Static List" : "Model Lookup"}
        </span>
      </div>

      {/* Segmented Source Selector */}
      <div className="grid grid-cols-2 gap-1 p-0.5 rounded bg-muted/30 border border-border/60">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSetType("O")}
          className={cn(
            "h-6 px-2 text-[10px] font-medium rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            paramType === "O"
              ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
          )}
        >
          <ListOrdered className="size-3" />
          <span>Options List</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSetType("M")}
          className={cn(
            "h-6 px-2 text-[10px] font-medium rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            paramType === "M"
              ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
          )}
        >
          <Database className="size-3" />
          <span>Model Lookup</span>
        </button>
      </div>

      {/* Dynamic Sub-Fields (Rendered via FormEngine in stacked mobile-style view) */}
      <FormRenderer
        frmElements={{ sections: [activeSection] }}
        values={selectedField as Record<string, unknown>}
        onChange={handleFieldChange}
        disabled={disabled}
        mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        hideHeader
        layout="stacked"
      />
    </div>
  );
}
