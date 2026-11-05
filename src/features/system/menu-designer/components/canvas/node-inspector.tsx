"use client";

import { Eye, EyeOff, Folder, Info, Lock, Network, Terminal, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SwitchWidget } from "@/features/form-engine/components/widgets/switch-widget";
import type { MenuTreeNode, MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";

export interface NodeInspectorProps {
  selectedNode: MenuTreeNode | null;
  formData: MenuTreeRecord;
  onUpdateFormData?: React.Dispatch<React.SetStateAction<MenuTreeRecord>>;
  onUpdateNode: (id: string, patch: Partial<MenuTreeNode>) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

interface InspectorFieldRowProps {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}

function InspectorFieldRow({ label, tooltip, children }: InspectorFieldRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs select-none">
        <Label className="text-[11px] font-medium text-muted-foreground flex items-center">
          {label}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center text-muted-foreground/60 hover:text-foreground cursor-help p-0.5 transition-colors">
                  <Info className="size-3" />
                </span>
              }
            />
            <TooltipContent side="left" className="text-xs max-w-56 z-50">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

export function NodeInspector({
  selectedNode,
  formData,
  onUpdateNode,
  onDeleteNode,
  onClose,
  disabled = false,
}: NodeInspectorProps) {
  // If NO node is selected, show the Hierarchy Tree Container Properties!
  if (!selectedNode) {
    const totalNodesCount = (nodes: MenuTreeNode[]): number => {
      let count = 0;
      for (const n of nodes) {
        count += 1;
        if (n.children?.length > 0) count += totalNodesCount(n.children);
      }
      return count;
    };

    const totalCount = totalNodesCount(formData.menuTree || []);
    const rootGroupsCount = (formData.menuTree || []).length;

    return (
      <aside
        aria-label="Tree Container Properties"
        className="w-68 shrink-0 border-l border-border/70 bg-card flex flex-col h-full overflow-hidden"
      >
        {/* Container Header */}
        <header className="px-3 py-2 border-b border-border/70 flex items-center justify-between gap-2 shrink-0 bg-muted/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <Network className="size-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs font-semibold truncate leading-tight">Tree Container</h3>
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {formData.recordId || "NEW.TREE"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono h-4.5 px-1.5 shrink-0">
            CONTAINER
          </Badge>
        </header>

        {/* Container Properties Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          {/* Container Metrics Card */}
          <div className="p-2.5 rounded border border-border/50 bg-muted/15 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tree Title:</span>
              <span className="font-medium text-foreground truncate max-w-36 text-right">
                {formData.treeDescription || "Untitled Tree"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lifecycle State:</span>
              <span className="font-mono text-xs">
                {formData.isActive !== false ? (
                  <span className="text-emerald-500 font-semibold">ACTIVE</span>
                ) : (
                  <span className="text-muted-foreground font-semibold">INACTIVE</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Root Categories:</span>
              <span className="font-semibold text-foreground font-mono">{rootGroupsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Elements in Tree:</span>
              <span className="font-semibold text-foreground font-mono">{totalCount}</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // A folder/group has no command or has children
  const isFolder =
    !selectedNode.command || (selectedNode.children && selectedNode.children.length > 0);

  return (
    <aside
      aria-label="Tree Node Properties"
      className="w-68 shrink-0 border-l border-border/70 bg-card flex flex-col h-full overflow-hidden"
    >
      {/* Compact Header */}
      <header className="px-3 py-2 border-b border-border/70 flex items-center justify-between gap-2 shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          {isFolder ? (
            <Folder className="size-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
          ) : (
            <Terminal className="size-3.5 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-xs font-semibold truncate leading-tight">
              {isFolder ? "Folder Properties" : "Menu Item Properties"}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {selectedNode.id}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="size-5.5 text-muted-foreground hover:text-foreground shrink-0"
          title="Deselect to Container Properties"
        >
          <X className="size-3.5" />
        </Button>
      </header>

      {/* Compact Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Element Kind Pill */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-border/50 bg-muted/15">
          <span className="text-[11px] text-muted-foreground font-medium">Kind:</span>
          <div className="flex items-center gap-1.5">
            <Badge
              variant={isFolder ? "secondary" : "outline"}
              className="text-[10px] font-mono h-4.5 px-1.5"
            >
              {isFolder ? "FOLDER GROUP" : `MENU #${selectedNode.menuId || "N/A"}`}
            </Badge>
            <span
              title="Catalog Definition Linked"
              className="inline-flex items-center text-muted-foreground/60"
            >
              <Lock className="size-2.5" />
            </span>
          </div>
        </div>

        {/* Target Command Code (Leaf Items Only) - FIXED / INHERITED */}
        {!isFolder && (
          <InspectorFieldRow
            label="Target Command Code"
            tooltip="Fixed by SC_MENU catalog definition. The execution target cannot be changed directly in the navigation tree."
          >
            <div className="relative">
              <Input
                id="node-cmd"
                value={selectedNode.command || ""}
                disabled
                className="h-7.5 text-xs font-mono font-medium uppercase bg-muted/30 text-muted-foreground/80 cursor-not-allowed pr-6"
                placeholder="N/A"
              />
              <Lock className="size-3 text-muted-foreground/50 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </InspectorFieldRow>
        )}

        {/* Menu Item Type - FIXED / INHERITED */}
        <InspectorFieldRow
          label="Functional Menu Type"
          tooltip="Fixed by SC_MENU catalog definition: GROUP, INQUIRY, FORM, or REPORT."
        >
          <div className="relative">
            <Input
              id="node-menu-type"
              value={isFolder ? "GROUP (Folder)" : selectedNode.menuType || "FORM"}
              disabled
              className="h-7.5 text-xs font-medium uppercase bg-muted/30 text-muted-foreground/80 cursor-not-allowed pr-6"
            />
            <Lock className="size-3 text-muted-foreground/50 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </InspectorFieldRow>

        {/* Display Label - EDITABLE OVERRIDE */}
        <InspectorFieldRow
          label="Display Label"
          tooltip="Contextual persona override. You can customize this label specifically for this menu tree layout."
        >
          <Input
            id="node-label"
            value={selectedNode.label}
            disabled={disabled}
            onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
            className="h-7.5 text-xs font-medium"
            placeholder="e.g. Account Maintenance"
          />
        </InspectorFieldRow>

        {/* Target Window Action Mode (Leaf Items Only) - EDITABLE OVERRIDE */}
        {!isFolder && (
          <InspectorFieldRow
            label="Display Window Action"
            tooltip="Contextual window override: opens as an integrated Workspace Tab (SCREEN) or detached multi-monitor window (POPUP)."
          >
            <Select
              value={selectedNode.menuAction || "SCREEN"}
              disabled={disabled}
              onValueChange={(val) => {
                if (val === "SCREEN" || val === "POPUP") {
                  onUpdateNode(selectedNode.id, { menuAction: val });
                }
              }}
            >
              <SelectTrigger id="node-menu-action" className="w-full h-7.5 text-xs">
                <SelectValue placeholder="Select target mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCREEN" className="text-xs">
                  SCREEN (Tab)
                </SelectItem>
                <SelectItem value="POPUP" className="text-xs">
                  POPUP (Detached)
                </SelectItem>
              </SelectContent>
            </Select>
          </InspectorFieldRow>
        )}

        {/* Visibility Switch - EDITABLE OVERRIDE */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded border border-border/60 bg-muted/5">
          <Label
            htmlFor="node-visible"
            className="text-[11px] font-medium cursor-pointer flex items-center gap-1.5 text-foreground"
          >
            {selectedNode.isVisible !== false ? (
              <Eye className="size-3.5 text-emerald-500" />
            ) : (
              <EyeOff className="size-3.5 text-muted-foreground" />
            )}
            Visible in Navigation
          </Label>
          <div className="flex items-center gap-1.5">
            {isFolder && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex items-center text-muted-foreground/60 hover:text-foreground cursor-help p-0.5">
                      <Info className="size-3" />
                    </span>
                  }
                />
                <TooltipContent side="left" className="text-xs max-w-52 z-50">
                  Toggling off hides this folder and all its nested sub-items.
                </TooltipContent>
              </Tooltip>
            )}
            <SwitchWidget
              id="node-visible"
              fieldKey="isVisible"
              value={selectedNode.isVisible !== false}
              disabled={disabled}
              onChange={(checked) => onUpdateNode(selectedNode.id, { isVisible: Boolean(checked) })}
            />
          </div>
        </div>

        {/* Nesting Entitlement Hint */}
        <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-muted/20 text-muted-foreground border border-border/40">
          <span>Nesting:</span>
          <span className="font-medium text-foreground/80">
            {isFolder
              ? `${selectedNode.children?.length || 0} child item(s)`
              : "Leaf item (no children)"}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
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
