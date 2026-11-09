"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  FolderMinus,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/core-utils";

export interface TreeNodeActionsProps {
  nodeId: string;
  isVisible: boolean;
  isFolder: boolean;
  isFolderNode: boolean;
  canIndent?: boolean;
  canOutdent?: boolean;
  isReadOnly?: boolean;
  onUpdate: (id: string, patch: { isVisible: boolean }) => void;
  onDelete: (id: string) => void;
  onUngroup?: (id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
}

export function TreeNodeActions({
  nodeId,
  isVisible,
  isFolder,
  isFolderNode,
  canIndent = false,
  canOutdent = false,
  isReadOnly = false,
  onUpdate,
  onDelete,
  onUngroup,
  onIndent,
  onOutdent,
  onMoveOrder,
}: TreeNodeActionsProps) {
  if (isReadOnly) return null;

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {/* Mobile (< sm): Clean 3-dots Dropdown Menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Actions"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuItem
              onClick={() => onUpdate(nodeId, { isVisible: !isVisible })}
              className="gap-2"
            >
              {isVisible ? (
                <EyeOff className="size-3.5 text-muted-foreground" />
              ) : (
                <Eye className="size-3.5 text-emerald-500" />
              )}
              <span>{isVisible ? "Hide Node" : "Show Node"}</span>
            </DropdownMenuItem>

            {canIndent && onIndent && (
              <DropdownMenuItem onClick={() => onIndent(nodeId)} className="gap-2">
                <ArrowRight className="size-3.5" />
                <span>Indent (Nest)</span>
              </DropdownMenuItem>
            )}

            {canOutdent && onOutdent && (
              <DropdownMenuItem onClick={() => onOutdent(nodeId)} className="gap-2">
                <ArrowLeft className="size-3.5" />
                <span>Outdent</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => onMoveOrder(nodeId, -1)} className="gap-2">
              <ArrowUp className="size-3.5" />
              <span>Move Up</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onMoveOrder(nodeId, 1)} className="gap-2">
              <ArrowDown className="size-3.5" />
              <span>Move Down</span>
            </DropdownMenuItem>

            {isFolderNode && isFolder && onUngroup && (
              <DropdownMenuItem onClick={() => onUngroup(nodeId)} className="gap-2 text-amber-500">
                <FolderMinus className="size-3.5" />
                <span>Ungroup</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDelete(nodeId)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop (>= sm): Full Inline Action Buttons */}
      <div className="hidden sm:flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(nodeId, { isVisible: !isVisible });
          }}
          className={cn(
            "h-6 w-6 transition-colors",
            isVisible
              ? "text-emerald-500 hover:text-emerald-600"
              : "text-muted-foreground hover:text-foreground",
          )}
          title={isVisible ? "Visible (Click to hide)" : "Hidden (Click to show)"}
        >
          {isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </Button>

        {isFolderNode && isFolder && onUngroup && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onUngroup(nodeId)}
            className="h-6 w-6 text-muted-foreground hover:text-amber-500"
            title="Ungroup folder (promote all children up)"
          >
            <FolderMinus className="size-3.5" />
          </Button>
        )}

        {canOutdent && onOutdent && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onOutdent(nodeId)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Outdent (Move out of current group)"
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        )}

        {canIndent && onIndent && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onIndent(nodeId)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Indent (Nest into previous sibling group)"
          >
            <ArrowRight className="size-3.5" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMoveOrder(nodeId, -1)}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Move Up"
        >
          <ArrowUp className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMoveOrder(nodeId, 1)}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Move Down"
        >
          <ArrowDown className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(nodeId)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          title="Delete node from tree"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
