"use client";

import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface McObjectPropsCardProps {
  property: ModelProperty;
  onSelectSubField?: (sn: string) => void;
  onAddSubField?: (parentSn: string) => string;
  onDeleteSubField?: (sn: string) => void;
  disabled?: boolean;
}

export function McObjectPropsCard({
  property,
  onSelectSubField,
  onAddSubField,
  onDeleteSubField,
  disabled,
}: McObjectPropsCardProps) {
  const children = property.PROP || [];

  return (
    <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
      {/* Section Header matching Column Definition */}
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nested Sub-Properties (PROP)
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
            {children.length}
          </span>
        </div>

        {!disabled && onAddSubField && (
          <Button
            type="button"
            size="xs"
            onClick={() => {
              const newSn = onAddSubField(property.SN);
              if (newSn && onSelectSubField) onSelectSubField(newSn);
            }}
            className="h-6 px-2 text-xs font-mono gap-1 rounded"
          >
            <Plus className="size-3" />
            <span>Add Sub-Property</span>
          </Button>
        )}
      </div>

      {/* Sub-item Table UI */}
      <div>
        {children.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed border-border/60 rounded">
            No sub-properties defined for this Object yet. Click "Add Sub-Property" above to add
            nested child attributes.
          </div>
        ) : (
          <div className="rounded border border-border/60 overflow-hidden divide-y divide-border/40">
            <div className="grid grid-cols-12 bg-muted/40 px-2.5 py-1 text-[10px] font-mono font-semibold text-muted-foreground uppercase">
              <span className="col-span-2">SN</span>
              <span className="col-span-8">Field Name</span>
              <span className="col-span-2 text-right">Type</span>
            </div>

            {children.map((sub) => (
              <div
                key={sub.SN}
                className="grid grid-cols-12 items-center px-2.5 py-1.5 text-xs hover:bg-primary/5 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => onSelectSubField?.(sub.SN)}
                  className="col-span-10 grid grid-cols-10 items-center text-left bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none"
                >
                  <span className="col-span-2 font-mono font-bold text-primary text-[11px]">
                    #{sub.SN}
                  </span>
                  <span className="col-span-8 font-mono font-medium text-foreground truncate">
                    {sub.NAME || "<Unnamed>"}
                  </span>
                </button>
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] h-4 px-1 rounded uppercase tracking-wider text-muted-foreground"
                  >
                    {sub.STRUCTURE === "M" ? `${sub.TYPE} (M)` : sub.TYPE}
                  </Badge>
                  {!disabled && onDeleteSubField && (
                    <button
                      type="button"
                      title="Delete subfield"
                      onClick={() => onDeleteSubField(sub.SN)}
                      className="size-4.5 inline-flex items-center justify-center rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
