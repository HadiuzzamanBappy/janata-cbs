"use client";

import { ArrowLeft, Trash2, X } from "lucide-react";
import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { MenuAction, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";
import { CbsRecordFunction } from "@/types";
import { NODE_INSPECTOR_SECTIONS } from "../../fields/md-inspector-fields";

export interface NodeInspectorProps {
  selectedNode: MenuTreeNode;
  onUpdateNode: (id: string, patch: Partial<MenuTreeNode>) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
  disabled?: boolean;
  className?: string;
}

export function NodeInspector({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onClose,
  disabled = false,
  className,
}: NodeInspectorProps) {
  const isFolder = Boolean(
    !selectedNode.command || (selectedNode.children && selectedNode.children.length > 0),
  );

  // Form values strictly verbatim from response
  const formValues = React.useMemo<Record<string, unknown>>(() => {
    return {
      ...selectedNode,
      isFolder,
      command: selectedNode.command ?? "",
      menuType: selectedNode.menuType ?? "",
      label: selectedNode.label ?? "",
      menuAction: selectedNode.menuAction ?? "",
      isVisible: selectedNode.isVisible !== false,
    };
  }, [selectedNode, isFolder]);

  const handleFieldChange = React.useCallback(
    (fieldKey: string, val: unknown) => {
      if (fieldKey === "label") {
        onUpdateNode(selectedNode.id, { label: String(val) });
      } else if (fieldKey === "menuAction") {
        onUpdateNode(selectedNode.id, { menuAction: val as MenuAction });
      } else if (fieldKey === "isVisible") {
        onUpdateNode(selectedNode.id, { isVisible: Boolean(val) });
      }
    },
    [selectedNode.id, onUpdateNode],
  );

  return (
    <aside
      aria-label="Node Inspector"
      className={cn("flex flex-col h-full select-none text-xs overflow-hidden bg-card", className)}
    >
      {/* 1. Header Bar: [←] Title + Badge + [X] */}
      <div className="h-9 px-3 border-b border-border/60 bg-muted/25 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            title="Back / Close"
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <span className="font-semibold text-xs text-foreground truncate">
            {selectedNode.label || selectedNode.id}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] font-mono h-4.5 px-1.5 shrink-0 uppercase"
          >
            {selectedNode.menuType || (isFolder ? "FOLDER" : "ITEM")}
          </Badge>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            title="Close Inspector"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Declarative FormRenderer Body (Ghost Container) */}
      <div className="flex-1 overflow-y-auto p-3">
        <FormRenderer
          frmElements={{ sections: NODE_INSPECTOR_SECTIONS }}
          values={formValues}
          onChange={handleFieldChange}
          disabled={disabled}
          mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          hideHeader
          layout="stacked"
          className="overflow-visible"
        />
      </div>

      {/* 3. Footer Delete Action */}
      {!disabled && (
        <footer className="p-2.5 border-t border-border/70 shrink-0 bg-muted/10">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full h-7 text-xs gap-1.5"
          >
            <Trash2 className="size-3" />
            Delete Node
          </Button>
        </footer>
      )}
    </aside>
  );
}
