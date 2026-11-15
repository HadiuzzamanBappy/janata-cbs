"use client";

import { ChevronsDownUp, ChevronsUpDown, PanelLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface CanvasToolbarProps {
  nodesCount: number;
  viewMode: "designer" | "preview";
  onViewModeChange: (mode: "designer" | "preview") => void;
  onSelectRoot?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onToggleCatalog?: () => void;
  onToggleInspector?: () => void;
  showCatalogToggle?: boolean;
  showInspectorToggle?: boolean;
}

export function CanvasToolbar({
  nodesCount,
  viewMode,
  onViewModeChange,
  onSelectRoot,
  onExpandAll,
  onCollapseAll,
  onToggleCatalog,
  onToggleInspector,
  showCatalogToggle = false,
  showInspectorToggle = false,
}: CanvasToolbarProps) {
  return (
    <div className="px-3 py-1.5 border-b border-border/80 flex items-center justify-between bg-card/60 gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 min-w-0">
        {showCatalogToggle && onToggleCatalog && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCatalog}
            className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="Toggle Action Catalog"
          >
            <PanelLeft className="size-3.5" />
          </Button>
        )}

        <button
          type="button"
          onClick={onSelectRoot}
          className="flex items-center gap-1.5 hover:text-primary transition-colors text-left min-w-0"
          title="Click to view root tree container properties"
        >
          <span className="text-xs font-semibold text-foreground truncate">Hierarchy Canvas</span>
        </button>
        <span className="text-[11px] text-muted-foreground font-mono shrink-0">({nodesCount})</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Mode Segmented Toggle: Designer vs Preview */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded border border-border/60">
          <button
            type="button"
            onClick={() => onViewModeChange("designer")}
            className={`h-6 px-2.5 text-xs font-medium rounded transition-all cursor-pointer ${
              viewMode === "designer"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Designer
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("preview")}
            className={`h-6 px-2.5 text-xs font-medium rounded transition-all cursor-pointer ${
              viewMode === "preview"
                ? "bg-background text-primary shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Live Preview
          </button>
        </div>

        {/* Icon Button Group for Expand / Collapse */}
        <div className="flex items-center bg-muted/40 p-0.5 rounded border border-border/60">
          {onExpandAll && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={onExpandAll}
                    className="size-6 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                  >
                    <ChevronsUpDown className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom" className="text-xs">
                Expand All Folders
              </TooltipContent>
            </Tooltip>
          )}
          {onCollapseAll && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={onCollapseAll}
                    className="size-6 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                  >
                    <ChevronsDownUp className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom" className="text-xs">
                Collapse All Folders
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {showInspectorToggle && onToggleInspector && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onToggleInspector}
            className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer rounded border border-border/60"
            title="Toggle Properties Inspector"
          >
            <SlidersHorizontal className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
