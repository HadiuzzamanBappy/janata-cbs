"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { FormRenderer } from "@/features/form-engine";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
  targetModelRecord?: ModelConfigRecord | null;
}

export function FcPreviewTab({ formData, targetModelRecord }: FcPreviewTabProps) {
  // If no target model is loaded, a form presentation has nothing to bind to
  if (!targetModelRecord) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/10">
        <AlertCircle className="size-8 mb-2 opacity-50 text-amber-500" />
        <p className="text-sm font-semibold text-foreground">No Target Model Bound</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          A Form Layout is purely the presentation for a schema. Please select a valid Target Model
          in the General tab to preview this layout.
        </p>
      </div>
    );
  }

  // Compile real target model + presentation layout into canonical Form Spec
  const spec = compileFormSpec(targetModelRecord, formData);

  return <FcPreviewContent formData={formData} targetModelRecord={targetModelRecord} spec={spec} />;
}

interface FcPreviewContentProps {
  formData: FormConfigRecord;
  targetModelRecord: ModelConfigRecord;
  spec: ReturnType<typeof compileFormSpec>;
}

function FcPreviewContent({ formData, targetModelRecord, spec }: FcPreviewContentProps) {
  // Seed default values directly from model properties
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const p of targetModelRecord.properties || []) {
      if (p.defaultValue !== undefined && p.defaultValue !== "") {
        initial[p.name] = p.defaultValue;
      }
    }
    return initial;
  });

  // Re-seed when target model changes
  React.useEffect(() => {
    setFormValues((prev) => {
      const next = { ...prev };
      for (const p of targetModelRecord.properties || []) {
        if (p.defaultValue !== undefined && next[p.name] === undefined) {
          next[p.name] = p.defaultValue;
        }
      }
      return next;
    });
  }, [targetModelRecord]);

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="h-full flex-1 overflow-y-auto pr-1">
      <div className="space-y-4 pb-8">
        {/* Informative Preview Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
              {String(formData.recordId || targetModelRecord.tableName || "PREVIEW")}
            </Badge>
            {Boolean(formData.title) && (
              <span className="text-xs font-semibold text-foreground">{String(formData.title)}</span>
            )}
            {Boolean(formData.version) && (
              <span className="text-xs text-muted-foreground font-mono">
                v{String(formData.version)}
              </span>
            )}
            <Badge variant="secondary" className="text-[10px] font-mono">
              Model: {targetModelRecord.tableName || targetModelRecord.recordId}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/40">
            <Sparkles className="size-3 text-primary" />
            <span>Live Form Engine Preview ({spec.fields.length} active fields)</span>
          </div>
        </div>

        {/* Unified Form Engine Execution */}
        <FormRenderer
          presentation={spec.presentation}
          values={formValues}
          onChange={handleInputChange}
          mode="I"
        />
      </div>
    </div>
  );
}
