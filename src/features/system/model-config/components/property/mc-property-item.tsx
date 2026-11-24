"use client";

import { Trash2 } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import { CBS_PROPERTY_STRUCTURE, type ModelProperty } from "@/lib/data-schemas";
import type { ModelValidationErrorItem } from "../../hooks/mc-validation";

interface McPropertyItemProps {
  prop: ModelProperty;
  isSelected: boolean;
  isReadOnly: boolean;
  isCommitted: boolean;
  validationErrors: ModelValidationErrorItem[];
  onSelect: (sn: string) => void;
  onDelete?: (sn: string) => void;
  isSub?: boolean;
}

/** Renders a top-level column or nested Array sub-property row in the property list. */
export function McPropertyItem({
  prop,
  isSelected,
  isReadOnly,
  isCommitted,
  validationErrors,
  onSelect,
  onDelete,
  isSub = false,
}: McPropertyItemProps) {
  const hasError = validationErrors.some((err) => err.sn === prop.SN);
  const typeLabel =
    prop.STRUCTURE === CBS_PROPERTY_STRUCTURE.MULTI ? `${prop.TYPE} (M)` : prop.TYPE;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between w-full transition-colors group select-none",
        isSub ? "py-1 px-2" : "py-1.5 px-2.5",
        hasError && !isSelected && "bg-destructive/5 hover:bg-destructive/10",
        isSelected
          ? hasError
            ? cn(
                "bg-destructive/15 text-destructive border-l-destructive",
                isSub ? "border-l-2" : "border-l-3",
              )
            : cn(
                "text-foreground font-semibold border-l-primary",
                isSub ? "bg-primary/15 border-l-2" : "bg-primary/10 border-l-3",
              )
          : hasError
            ? cn("text-foreground border-l-destructive/80", isSub ? "border-l-2" : "border-l-3")
            : cn(
                "hover:bg-muted/40 text-foreground border-l-transparent",
                isSub ? "border-l-2" : "border-l-3",
              ),
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(prop.SN)}
        data-node-id={prop.SN}
        className={cn(
          "flex items-center min-w-0 flex-1 text-left bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none",
          isSub ? "gap-1.5" : "gap-2",
        )}
      >
        <span
          className={cn(
            "font-mono text-3xs px-1 rounded shrink-0",
            isSub ? "py-0.2" : "py-0.5",
            isSelected && !isSub
              ? "bg-primary/15 text-primary font-bold border border-primary/25"
              : "bg-muted text-muted-foreground font-medium",
          )}
        >
          {prop.SN}
        </span>

        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          <span
            className={cn(
              "truncate font-mono font-medium",
              isSub ? "text-2xs" : "text-xs",
              isSelected && !isSub ? "text-foreground font-semibold" : "text-foreground",
            )}
          >
            {prop.NAME || (isSub ? "<Unnamed Subfield>" : "<Unnamed>")}
          </span>
          {prop.REQUIRED && (
            <span
              className="text-destructive font-bold text-3xs leading-none"
              title="Mandatory Column"
            >
              *
            </span>
          )}
        </div>
      </button>

      <div className={cn("flex items-center shrink-0", isSub ? "gap-1 ml-1" : "gap-1.5 ml-2")}>
        {prop.MODELNAME && (
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-3xs rounded uppercase tracking-wider",
              isSub ? "h-4 px-1" : "h-4.5 px-1.5",
              isSelected && !isSub
                ? "border-primary/40 bg-primary/20 text-primary font-bold"
                : "border-primary/30 bg-primary/5 text-primary",
            )}
            title={`References ${prop.MODELNAME}`}
          >
            {prop.MODELNAME}
          </Badge>
        )}

        <Badge
          variant="outline"
          className={cn(
            "font-mono text-3xs rounded uppercase tracking-wider",
            isSub ? "h-4 px-1" : "h-4.5 px-1.5",
            isSelected && !isSub
              ? "border-primary/30 bg-primary/10 text-primary font-medium"
              : "text-muted-foreground border-border/70",
          )}
        >
          {typeLabel}
        </Badge>

        {!isReadOnly && onDelete && !isCommitted && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={isSub ? "Delete subfield" : "Delete draft column"}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(prop.SN);
            }}
            className={cn(
              "p-0 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors",
              isSub ? "size-4" : "size-5",
            )}
          >
            <Trash2 className={isSub ? "size-2.5" : "size-3"} />
          </Button>
        )}
      </div>
    </div>
  );
}
