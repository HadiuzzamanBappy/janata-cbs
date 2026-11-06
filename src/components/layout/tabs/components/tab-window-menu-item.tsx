"use client";

import { GripVertical, X } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/core-utils";
import { useAlertStore, useWorkbenchStore } from "@/store";
import type { TabWindowMenuItemProps } from "../types";
import { promptCloseTab } from "../utils";
import { TabMenuItems } from "./tab-menu-items";

export type { TabWindowMenuItemProps };

export function TabWindowMenuItem({
  tab,
  originalIndex,
  isActive,
  isSearching,
  draggedMenuIndex,
  dragOverMenuIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TabWindowMenuItemProps) {
  const { setActiveTab, removeTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();

  const isDraggingThis = draggedMenuIndex === originalIndex;
  const isDragOverThis = dragOverMenuIndex === originalIndex;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    promptCloseTab(tab, () => removeTab(tab.id), confirm);
  };

  return (
    <li
      draggable={!isSearching}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "list-none transition-all duration-150 rounded-sm mb-0.5 relative",
        isDraggingThis && "opacity-40 scale-[0.98]",
        isDragOverThis && !isDraggingThis && "bg-primary/10 ring-1 ring-primary/50",
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <button
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left relative flex items-center justify-between py-1.5 px-2 cursor-pointer rounded-sm text-xs gap-2 group transition-colors select-none",
                "hover:bg-accent/70 hover:text-accent-foreground",
                isActive
                  ? "bg-accent/80 text-accent-foreground font-semibold pl-2.5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.75 before:bg-primary before:rounded-full"
                  : "text-foreground/90",
              )}
            />
          }
        >
          {/* Left Side: Grip + Tab Number + Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-6">
            {!isSearching && (
              <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
            )}
            <span className="truncate flex items-center gap-1.5 min-w-0">
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "h-4 min-w-4 px-1 rounded-xs text-[10px] font-mono flex items-center justify-center border-transparent shrink-0",
                  isActive ? "bg-primary/20 text-primary font-bold" : "opacity-70",
                )}
              >
                {originalIndex + 1}
              </Badge>
              <span className="truncate font-normal">{tab.title}</span>
            </span>
          </div>
        </ContextMenuTrigger>

        {/* Right-click Context Menu */}
        <ContextMenuContent className="w-52 text-xs border border-border/80">
          <TabMenuItems
            tab={tab}
            GroupComponent={ContextMenuGroup}
            ItemComponent={ContextMenuItem}
            LabelComponent={ContextMenuLabel}
            SeparatorComponent={ContextMenuSeparator}
            ShortcutComponent={ContextMenuShortcut}
          />
        </ContextMenuContent>
      </ContextMenu>

      {/* Sibling Close Button on the right side */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10 pr-1">
        <button
          type="button"
          onClick={handleClose}
          className="size-5 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
          title="Close Window"
        >
          <X className="size-3" />
        </button>
      </div>
    </li>
  );
}
