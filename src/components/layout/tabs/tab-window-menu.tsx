"use client";

import { ChevronDown, GripVertical, Layers, MoreHorizontal, Search, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { WorkbenchTab } from "@/store";
import { useAlertStore, useWorkbenchStore } from "@/store";
import { TabMenuItems } from "./tab-menu-items";

function TabWindowMenuItem({
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
}: {
  tab: WorkbenchTab;
  originalIndex: number;
  isActive: boolean;
  isSearching: boolean;
  draggedMenuIndex: number | null;
  dragOverMenuIndex: number | null;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const { setActiveTab, removeTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();
  const [isItemMenuOpen, setIsItemMenuOpen] = React.useState(false);

  const isDraggingThis = draggedMenuIndex === originalIndex;
  const isDragOverThis = dragOverMenuIndex === originalIndex;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hasUserInput =
      tab.formData &&
      Object.values(tab.formData).some((v) => v !== undefined && v !== null && v !== "");

    if (hasUserInput) {
      confirm({
        title: `Close "${tab.title}"?`,
        message: "You have unsaved typed inputs in this tab. Closing it will discard your changes.",
        variant: "destructive",
        confirmText: "Discard & Close",
        onConfirm: () => removeTab(tab.id),
      });
    } else {
      removeTab(tab.id);
    }
  };

  return (
    <li
      draggable={!isSearching}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "list-none transition-all duration-150 rounded mb-0.5 relative",
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
                "w-full text-left relative flex items-center justify-between py-1.5 px-2 cursor-pointer rounded text-xs gap-2 group transition-colors select-none",
                "hover:bg-accent/70 hover:text-accent-foreground",
                isActive
                  ? "bg-accent/80 text-accent-foreground font-semibold pl-2.5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-primary before:rounded-full"
                  : "text-foreground/90",
              )}
            />
          }
        >
          {/* Left Side: Grip + Tab Number + Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {!isSearching && (
              <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
            )}
            <span className="truncate flex items-center gap-1.5 min-w-0">
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "h-4 min-w-[16px] px-1 rounded-xs text-[10px] font-mono flex items-center justify-center border-transparent shrink-0",
                  isActive ? "bg-primary/20 text-primary font-bold" : "opacity-70",
                )}
              >
                {originalIndex + 1}
              </Badge>
              <span className="truncate font-normal">{tab.title}</span>
            </span>
          </div>

          {/* Right Side: Options Dots Button + Close Button */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Options Dots (...) Button */}
            <DropdownMenu open={isItemMenuOpen} onOpenChange={setIsItemMenuOpen}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className={cn(
                      "size-5 rounded items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer",
                      isItemMenuOpen
                        ? "flex text-foreground bg-muted/80"
                        : "hidden group-hover:flex",
                    )}
                    title={`Options for ${tab.title}`}
                  />
                }
              >
                <MoreHorizontal className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={4}
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

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
              title="Close Window"
            >
              <X className="size-3" />
            </button>
          </div>
        </ContextMenuTrigger>

        {/* Right-click Context Menu */}
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
    </li>
  );
}

export function TabWindowMenu() {
  const [tabSearch, setTabSearch] = React.useState("");
  const { tabs, activeTabId, reorderTabs } = useWorkbenchStore();

  const [draggedMenuIndex, setDraggedMenuIndex] = React.useState<number | null>(null);
  const [dragOverMenuIndex, setDragOverMenuIndex] = React.useState<number | null>(null);

  const isSearching = tabSearch.trim().length > 0;
  const filteredTabs = tabs.filter((t) =>
    t.title.toLowerCase().includes(tabSearch.trim().toLowerCase()),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="xs"
            className="h-7 gap-1.5 px-2 text-xs font-mono font-medium bg-background border-border/80 hover:bg-accent hover:text-accent-foreground shrink-0 rounded shadow-2xs"
          />
        }
      >
        <Layers className="size-3.5 text-primary shrink-0" />
        <span>{tabs.length}</span>
        <ChevronDown className="size-3 text-muted-foreground ml-0.5 shrink-0 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 sm:w-80 p-0 overflow-hidden rounded border border-border/80 shadow-md"
      >
        {/* Header: Search Open Tabs */}
        {tabs.length > 3 && (
          <div className="p-2 border-b border-border/60 bg-muted/30 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={tabSearch}
              onChange={(e) => setTabSearch(e.target.value)}
              placeholder="Search opened windows..."
              className="pl-8 h-7 text-xs bg-background rounded border-border/80 focus-visible:ring-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="px-2.5 py-1.5 text-[10px] font-mono text-muted-foreground border-b border-border/60 uppercase tracking-wider bg-muted/30 flex items-center justify-between select-none">
          <span>Opened Windows ({tabs.length})</span>
          {!isSearching && tabs.length > 1 && (
            <span className="text-[9px] text-muted-foreground/70 normal-case font-mono">
              Drag to reorder
            </span>
          )}
        </div>

        <DropdownMenuGroup className="max-h-64 overflow-y-auto p-1 divide-y-0">
          {filteredTabs.length > 0 ? (
            filteredTabs.map((tab) => {
              const originalIndex = tabs.findIndex((t) => t.id === tab.id);
              const isActive = tab.id === activeTabId;

              return (
                <TabWindowMenuItem
                  key={tab.id}
                  tab={tab}
                  originalIndex={originalIndex}
                  isActive={isActive}
                  isSearching={isSearching}
                  draggedMenuIndex={draggedMenuIndex}
                  dragOverMenuIndex={dragOverMenuIndex}
                  onDragStart={(e) => {
                    if (isSearching) return;
                    e.dataTransfer.setData("text/plain", String(originalIndex));
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedMenuIndex(originalIndex);
                  }}
                  onDragOver={(e) => {
                    if (isSearching) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverMenuIndex !== originalIndex) {
                      setDragOverMenuIndex(originalIndex);
                    }
                  }}
                  onDrop={(e) => {
                    if (isSearching) return;
                    e.preventDefault();
                    if (draggedMenuIndex !== null && draggedMenuIndex !== originalIndex) {
                      if (typeof reorderTabs === "function") {
                        reorderTabs(draggedMenuIndex, originalIndex);
                      }
                    }
                    setDraggedMenuIndex(null);
                    setDragOverMenuIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedMenuIndex(null);
                    setDragOverMenuIndex(null);
                  }}
                />
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching open windows found.
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
