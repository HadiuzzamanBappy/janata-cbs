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
  hasMovedRef: React.RefObject<boolean>;
}

export function TabItem({ tab, index, isActive, hasMovedRef }: TabItemProps) {
  const { setActiveTab, removeTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const universalTabNumber = index + 1;

  const handleCloseTab = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // VIEW mode tabs or IDLE mode tabs NEVER show a confirmation dialog
    if (tab.screenMode === "VIEW" || tab.screenMode === "IDLE") {
      removeTab(tab.id);
      return;
    }

    // In EDIT or CREATE mode, only confirm if the user has actually modified/typed changes
    const isDirty =
      tab.isDirty === true ||
      (tab.screenMode === "CREATE" &&
        tab.formData &&
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
            data-tab-id={tab.id}
            className={cn(
              "group relative flex items-center rounded-md text-xs font-medium transition-all duration-150 border whitespace-nowrap shrink-0 h-8 select-none",
              isActive
                ? "bg-background text-foreground border-border shadow-2xs font-semibold ring-1 ring-border/50"
                : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/80 hover:text-foreground hover:border-border/60",
            )}
          />
        }
      >
        {/* Primary Tab Select Button */}
        <button
          type="button"
          onClick={(e) => {
            if (hasMovedRef.current) {
              e.preventDefault();
              return;
            }
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
          className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 h-full text-left truncate cursor-pointer bg-transparent border-0 outline-none"
        >
          <span className="truncate max-w-[160px] text-xs flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className={cn(
                "h-4 min-w-[16px] px-1 rounded-sm text-[10px] font-mono flex items-center justify-center opacity-70 border-transparent transition-opacity",
                isDropdownOpen || "group-hover:opacity-0",
              )}
            >
              {universalTabNumber}
            </Badge>
            {tab.title}
          </span>
        </button>

        {/* More Actions (...) Button */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={cn(
                  "absolute left-2.5 size-4 rounded-xs items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 m-auto cursor-pointer",
                  isDropdownOpen ? "flex" : "hidden group-hover:flex",
                )}
                title={`Options for ${tab.title}`}
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6} className="w-52 text-xs">
            <TabMenuItems
              tab={tab}
              ItemComponent={DropdownMenuItem}
              LabelComponent={DropdownMenuLabel}
              SeparatorComponent={DropdownMenuSeparator}
              ShortcutComponent={DropdownMenuShortcut}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tab Actions */}
        <div
          className={cn(
            "flex items-center pr-1.5",
            !isActive && "opacity-60 group-hover:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              handleCloseTab(e);
            }}
            className="size-4 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
            aria-label={`Close tab ${tab.title}`}
          >
            <X className="size-3" />
          </button>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 text-xs">
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
