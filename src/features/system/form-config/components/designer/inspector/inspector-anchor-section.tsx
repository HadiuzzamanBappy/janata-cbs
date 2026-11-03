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

export function InspectorAnchorSection({
  selectedField,
  matchedModelProp,
  baseType,
}: InspectorAnchorSectionProps) {
  return (
    <div className="p-2.5 rounded-md border border-border/80 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Database className="size-3 text-primary" />
          <span>Physical Model Anchor</span>
        </span>
        <Badge
          variant="outline"
          className="text-[9px] font-mono h-3.5 px-1 uppercase tracking-wider text-muted-foreground border-border/80 bg-background"
        >
          BASE: {baseType}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Column Key (NAME)
          </span>
          <span className="font-mono font-bold text-foreground truncate block select-all">
            {selectedField.NAME}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Sequence (SN)
          </span>
          <span className="font-mono font-bold text-primary block">#{selectedField.SN}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
        <div>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Physical Type
          </span>
          <span className="font-mono text-foreground block">
            {matchedModelProp?.TYPE || selectedField.TYPE || "Text"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Structure
          </span>
          <span className="font-mono text-foreground block">
            {selectedField.STRUCTURE === "M" ? "Multi-Value (M)" : "Single (S)"}
          </span>
        </div>
      </div>
    </div>
  );
}
