"use client";

import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface InspectorAnchorSectionProps {
  selectedField: FormElement;
  matchedModelProp: ModelProperty | null;
  baseType: "TEXT" | "NUMBER" | "DATE";
}

/**
 * InspectorAnchorSection: Displays physical database column binding and metadata
 * formatted identically to the canonical CBS Form View Mode scanlines.
 */
export function InspectorAnchorSection({
  selectedField,
  matchedModelProp,
  baseType,
}: InspectorAnchorSectionProps) {
  const physicalType = matchedModelProp?.TYPE || selectedField.TYPE || "Text";
  const structure = selectedField.STRUCTURE === "M" ? "Multi-Value (M)" : "Single (S)";

  return (
    <div className="pb-3 border-b border-border/50 space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-border/30">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Database className="size-3 text-primary" />
          <span>Physical Model Anchor</span>
        </span>
        <Badge
          variant="outline"
          className="text-[9px] font-mono h-4 px-1.5 uppercase tracking-wider text-muted-foreground border-border/80 bg-background/60"
        >
          BASE: {baseType}
        </Badge>
      </div>

      {/* View-Mode Scanlines (Matching CBS Form View Mode) */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 text-muted-foreground truncate">Column Key</span>
          <span className="text-muted-foreground/60 font-mono select-none">:</span>
          <span className="font-mono font-bold text-foreground truncate select-all">
            {selectedField.NAME}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 text-muted-foreground truncate">Sequence (SN)</span>
          <span className="text-muted-foreground/60 font-mono select-none">:</span>
          <span className="font-mono font-bold text-primary">#{selectedField.SN}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 text-muted-foreground truncate">Physical Type</span>
          <span className="text-muted-foreground/60 font-mono select-none">:</span>
          <span className="font-mono font-medium text-foreground">{physicalType}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 text-muted-foreground truncate">Structure</span>
          <span className="text-muted-foreground/60 font-mono select-none">:</span>
          <span className="font-mono font-medium text-foreground">{structure}</span>
        </div>
      </div>
    </div>
  );
}
