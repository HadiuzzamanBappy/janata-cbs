"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

interface McInspectorHeaderProps {
  property: ModelProperty;
  isReadOnly: boolean;
  isCommitted: boolean;
  onDelete: (sn: string, forceHardDelete?: boolean) => void;
}

export function McInspectorHeader({
  property,
  isReadOnly,
  isCommitted,
  onDelete,
}: McInspectorHeaderProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  return (
    <>
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            SN #{property.SN}
          </Badge>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {property.NAME || "<UNNAMED_FIELD>"}
          </span>
          {property.LABEL && (
            <span className="text-xs text-muted-foreground truncate">— {property.LABEL}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isCommitted ? (
            <Badge
              variant="outline"
              className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/10"
            >
              Draft (New)
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-emerald-600 border-emerald-600/30 bg-emerald-600/10 dark:text-emerald-400"
            >
              Active
            </Badge>
          )}

          <Badge
            variant="outline"
            className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-muted-foreground"
          >
            {property.TYPE} • {property.STRUCTURE === "M" ? "Multi" : "Single"}
          </Badge>

          {!isReadOnly && !isCommitted && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-6.5 text-xs rounded gap-1 px-2 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Draft</span>
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Draft Field?"
        description={
          <span className="text-xs text-muted-foreground leading-relaxed block">
            Permanently delete draft field #{property.SN} ({property.NAME || "UNNAMED"})? Since this
            field has not been saved or committed yet, it will be removed entirely.
          </span>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => onDelete(property.SN)}
      />
    </>
  );
}
