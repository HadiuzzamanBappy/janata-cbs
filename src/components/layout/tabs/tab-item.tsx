"use client";

import { MoreHorizontal, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkbenchTab } from "@/store";
import { useAlertStore, useWorkbenchStore } from "@/store";
import { TabMenuItems } from "./tab-menu-items";

interface TabItemProps {
  tab: WorkbenchTab;
  index: number;
  isActive: boolean;
  showSeparator?: boolean;
  isDraggingThis?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export function TabItem({
  tab,
  index,
  isActive,
  showSeparator,
  isDraggingThis,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TabItemProps) {
  const { setActiveTab, removeTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const universalTabNumber = index + 1;

  const handleCloseTab = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Non-input modes (See, Authorize, Reverse, Delete, History, Idle) NEVER show a confirmation dialog
    if (tab.screenMode !== "I") {
      removeTab(tab.id);
      return;
    }

    // In Input (I) mode, only confirm if the user has actually modified/typed changes
    const isDirty =
      tab.isDirty === true ||
      (tab.formData &&
        Object.values(tab.formData).some((v) => v !== undefined && v !== null && v !== ""));

    if (isDirty) {
      confirm({
        title: `Close "${tab.title}"?`,
        message: "You have unsaved changes in this tab. Closing it will discard your edits.",
        variant: "destructive",
        confirmText: "Discard & Close",
        onConfirm: () => removeTab(tab.id),
      });
    } else {
      removeTab(tab.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab(tab.id);
              }
            }}
            data-tab-id={tab.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", tab.id);
              e.dataTransfer.effectAllowed = "move";
              onDragStart?.();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              onDragOver?.(e);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop?.();
            }}
            onDragEnd={onDragEnd}
            className={cn(
              "group relative flex items-center text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 select-none cursor-pointer h-9",
              isActive
                ? "bg-background text-foreground font-semibold rounded-t z-20 border-t border-l border-r border-border/80 border-b-0 shadow-xs overflow-hidden after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:rounded-t"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground rounded-t border border-transparent",
              isDraggingThis && "opacity-40 scale-[0.98] ring-1 ring-primary/40",
              isDragOver && !isDraggingThis && "border-primary/60 bg-primary/10 shadow-inner",
            )}
          />
        }
      >
        {/* Primary Tab Select Button */}
        <button
          type="button"
          onClick={() => {
            setActiveTab(tab.id);
          }}
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onMouseUp={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
              handleCloseTab(e);
            }
          }}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
              handleCloseTab(e);
            }
          }}
          className="flex items-center gap-2 pl-3 pr-1.5 py-1 h-full text-left truncate cursor-pointer bg-transparent border-0 outline-none"
        >
          <span className="truncate max-w-[160px] text-xs flex items-center gap-1.5">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "h-4 min-w-[16px] px-1 rounded-xs text-[10px] font-mono flex items-center justify-center transition-opacity",
                isActive
                  ? "bg-primary/15 text-primary border-transparent font-semibold"
                  : "opacity-70 border-transparent",
                isDropdownOpen ? "opacity-0" : "group-hover:opacity-0",
              )}
            >
              {universalTabNumber}
            </Badge>
            {tab.title}
          </span>
        </button>

        {/* More Actions (...) Button - Replaces number badge on hover */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={cn(
                  "absolute left-3 size-4 rounded-xs items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer z-10",
                  isDropdownOpen ? "flex" : "hidden group-hover:flex",
                )}
                title={`Options for ${tab.title}`}
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-52 text-xs rounded border border-border/80"
          >
            <TabMenuItems
              tab={tab}
              ItemComponent={DropdownMenuItem}
              LabelComponent={DropdownMenuLabel}
              SeparatorComponent={DropdownMenuSeparator}
              ShortcutComponent={DropdownMenuShortcut}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tab Close Action - Always Visible */}
        <div className="flex items-center pr-2 pl-0.5">
          <button
            type="button"
            onClick={(e) => {
              handleCloseTab(e);
            }}
            className={cn(
              "size-4 rounded flex items-center justify-center transition-colors shrink-0 cursor-pointer",
              isActive
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 group-hover:text-muted-foreground",
            )}
            aria-label={`Close tab ${tab.title}`}
          >
            <X className="size-3" />
          </button>
        </div>

        {/* Vertical Separator between inactive tabs (never around active tab) */}
        {showSeparator && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-[1px] bg-border/60 pointer-events-none"
          />
        )}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 text-xs rounded border border-border/80">
        <TabMenuItems
          tab={tab}
          ItemComponent={ContextMenuItem}
          LabelComponent={ContextMenuLabel}
          SeparatorComponent={ContextMenuSeparator}
          ShortcutComponent={ContextMenuShortcut}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
