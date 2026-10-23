"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { FormRenderer } from "@/features/form-engine";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";

export interface McPreviewTabProps {
  formData: ModelConfigRecord;
}

export function McPreviewTab({ formData }: McPreviewTabProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});

  // Initialize default values from model properties
  React.useEffect(() => {
    const defaults: Record<string, unknown> = {};
    for (const p of formData.properties || []) {
      if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== "") {
        defaults[p.name] = p.defaultValue;
      }
    }
    setFormValues(defaults);
  }, [formData.properties]);

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  // Compile unified canonical form presentation using cbs-form-spec compiler
  const spec = React.useMemo(() => {
    return compileFormSpec(formData, null);
  }, [formData]);

  return (
    <div className="h-full flex-1 overflow-y-auto pr-1">
      <div className="space-y-4 pb-8">
        {/* Informative Preview Header matching fc-preview-tab */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
              {formData.recordId || formData.tableName}
            </Badge>
            <span className="text-xs font-semibold text-foreground">
              {formData.description || formData.tableName}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {spec.fields.length} active fields
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/40">
            <Sparkles className="size-3 text-primary" />
            <span>Unified Form Engine Preview</span>
          </div>
        </div>

        {/* Unified Form Engine Execution */}
        <FormRenderer
          presentation={spec.presentation}
          values={formValues}
          onChange={handleInputChange}
          mode={CbsRecordFunction.INPUT}
        />
      </div>
    </div>
  );
}
