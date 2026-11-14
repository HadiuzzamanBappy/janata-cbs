"use client";

import { Trash2 } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { ModelValidationErrorItem } from "../../hooks/mc-validation";

interface McSubPropertyItemProps {
  sub: ModelProperty;
  isSelected: boolean;
  isReadOnly: boolean;
  isCommitted: boolean;
  validationErrors: ModelValidationErrorItem[];
  onSelect: (sn: string) => void;
  onDelete?: (sn: string) => void;
}

export function McSubPropertyItem({
  sub,
  isSelected,
  isReadOnly,
  isCommitted,
  validationErrors,
  onSelect,
  onDelete,
}: McSubPropertyItemProps) {
  const subErrors = validationErrors.filter((err) => err.sn === sub.SN);
  const hasSubError = subErrors.length > 0;
  const subBadge = sub.STRUCTURE === "M" ? `${sub.TYPE} (M)` : sub.TYPE;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between w-full py-1 px-2 transition-colors select-none",
        hasSubError && !isSelected && "bg-destructive/5",
        isSelected
          ? "bg-primary/15 text-foreground font-semibold border-l-2 border-l-primary"
          : "hover:bg-muted/40 text-foreground border-l-2 border-l-transparent",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(sub.SN)}
        className="flex items-center gap-1.5 min-w-0 flex-1 text-left bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none"
      >
        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
          {sub.SN}
        </span>
        <span className="text-[11px] truncate font-mono font-medium">
          {sub.NAME || "<Unnamed Subfield>"}
        </span>
      </button>
      <div className="flex items-center gap-1 shrink-0 ml-1">
        <Badge
          variant="outline"
          className="font-mono text-[9px] h-4 px-1 rounded uppercase tracking-wider text-muted-foreground"
        >
          {subBadge}
        </Badge>
        {!isReadOnly && onDelete && !isCommitted && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Delete subfield"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(sub.SN);
            }}
            className="size-4 p-0 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-2.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
