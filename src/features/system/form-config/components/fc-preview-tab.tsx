"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { FormRenderer } from "@/features/form-engine";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
}

export function FcPreviewTab({ formData }: FcPreviewTabProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({
    accountType: "SAVINGS",
    currency: "BDT",
    initialDeposit: "25000",
    interestRate: "7.5",
  });

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-4">
      {/* Informative Preview Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
            {formData.recordId}
          </Badge>
          <span className="text-xs font-semibold text-foreground">{formData.title}</span>
          <span className="text-xs text-muted-foreground font-mono">
            v{formData.version || "1.0.0"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/40">
          <Sparkles className="size-3 text-primary" />
          <span>Live Form Engine Preview</span>
        </div>
      </div>

      {/* Unified Form Engine Execution */}
      <FormRenderer
        presentation={formData.presentation}
        values={formValues}
        onChange={handleInputChange}
        mode="I"
      />
    </div>
  );
}
