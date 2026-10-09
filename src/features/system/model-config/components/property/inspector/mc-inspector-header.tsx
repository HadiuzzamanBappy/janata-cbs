"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModelProperty } from "@/lib/schemas/model-config-schema";
import { cn } from "@/lib/utils";

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
  const isArchived = property.status === "ARCHIVED";

  return (
    <>
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            SN #{property.sn}
          </Badge>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {property.name || "<UNNAMED_FIELD>"}
          </span>
          {property.label && (
            <span className="text-xs text-muted-foreground truncate">— {property.label}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isArchived ? (
            <Badge
              variant="destructive"
              className="font-mono text-[10px] h-5 rounded uppercase tracking-wider"
            >
              Archived
            </Badge>
          ) : !isCommitted ? (
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
            {property.type} • {property.structure === "M" ? "Multi" : "Single"}
          </Badge>

          {!isReadOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className={cn(
                "h-6.5 text-xs rounded gap-1 px-2 ml-1",
                isArchived
                  ? "text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  : !isCommitted
                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                    : "text-amber-600 hover:text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
              )}
            >
              {!isCommitted ? (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </>
              ) : isArchived ? (
                <>
                  <ArchiveRestore className="size-3.5" />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <Archive className="size-3.5" />
                  <span>Archive</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={
          !isCommitted ? "Delete Draft Field?" : isArchived ? "Restore Field?" : "Archive Field?"
        }
        description={
          <span className="text-xs text-muted-foreground leading-relaxed block space-y-1">
            <span>
              {!isCommitted
                ? `Permanently delete field #${property.sn} (${property.name})? Since this field has not been saved or committed yet, it will be removed entirely.`
                : isArchived
                  ? `Restore field #${property.sn} (${property.name}) back to active status?`
                  : `In Core Banking, committed field #${property.sn} (${property.name}) will be marked ARCHIVED. Its historical data mapping and physical column position are permanently preserved.`}
            </span>
          </span>
        }
        confirmText={!isCommitted ? "Delete" : isArchived ? "Restore" : "Archive"}
        cancelText="Cancel"
        variant={!isCommitted || !isArchived ? "destructive" : "default"}
        onConfirm={() => onDelete(property.sn)}
      />
    </>
  );
}
