"use client";

import { Database, ListOrdered } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/features/form-engine/utils/path-utils";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { DROPDOWN_LOOKUP_SECTION, DROPDOWN_OPTIONS_SECTION } from "../../fields";

export interface McLookupConfigProps {
  property: ModelProperty;
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  disabled?: boolean;
}

export function McLookupConfig({ property, onUpdate, disabled }: McLookupConfigProps) {
  const param = (property.PARAMETER || {}) as Record<string, unknown>;
  const paramType = (param.type as string) || "O";

  const handleSetType = (t: "O" | "M") => {
    onUpdate(property.SN, {
      PARAMETER: {
        ...param,
        type: t,
        data: t === "O" ? (Array.isArray(param.data) ? param.data : []) : [],
      },
    });
  };

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const updated = setFieldValue(property as Record<string, unknown>, fieldKey, value);
      onUpdate(property.SN, {
        PARAMETER: updated.PARAMETER as ModelProperty["PARAMETER"],
      });
    },
    [property, onUpdate],
  );

  const activeSection = paramType === "O" ? DROPDOWN_OPTIONS_SECTION : DROPDOWN_LOOKUP_SECTION;

  return (
    <div className="rounded border border-border/80 bg-card overflow-hidden shadow-2xs">
      {/* Header with Type Selector */}
      <div className="px-3 py-2 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider text-primary border-primary/30 bg-primary/10"
          >
            Dropdown Source
          </Badge>
          <span className="text-xs font-semibold text-foreground truncate">
            Options & Lookup Configuration
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={paramType === "O" ? "default" : "outline"}
            disabled={disabled}
            onClick={() => handleSetType("O")}
            className="h-6 px-2 text-[10px] font-mono gap-1 rounded"
          >
            <ListOrdered className="size-3" />
            <span>Options List (O)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={paramType === "M" ? "default" : "outline"}
            disabled={disabled}
            onClick={() => handleSetType("M")}
            className="h-6 px-2 text-[10px] font-mono gap-1 rounded"
          >
            <Database className="size-3" />
            <span>Model Lookup (M)</span>
          </Button>
        </div>
      </div>

      <div className="p-3">
        <FormRenderer
          frmElements={{ sections: [activeSection] }}
          values={property as Record<string, unknown>}
          onChange={handleFieldChange}
          disabled={disabled}
          mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
        />
      </div>
    </div>
  );
}
