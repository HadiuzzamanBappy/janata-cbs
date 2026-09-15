"use client";

import { X, Layers, XCircle } from "lucide-react";
import { useWorkbenchStore } from "@/store/workbench-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, closeAllTabs } =
    useWorkbenchStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="h-10 border-b border-border/60 bg-muted/40 px-2 flex items-center justify-between gap-2 overflow-x-auto select-none no-scrollbar">
      {/* Scrollable Tabs Container */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 border whitespace-nowrap shrink-0",
                isActive
                  ? "bg-background text-foreground border-border shadow-xs"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Layers className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate max-w-[140px]">{tab.title}</span>

              {/* Close Tab Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
                className={cn(
                  "size-4 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                  !isActive && "opacity-60 group-hover:opacity-100"
                )}
                aria-label={`Close tab ${tab.title}`}
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-[10px] font-mono font-normal">
          {tabs.length} {tabs.length === 1 ? "tab" : "tabs"}
        </Badge>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                onClick={closeAllTabs}
                className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
              />
            }
          >
            <XCircle className="size-3.5" />
            <span className="hidden sm:inline">Close All</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Close all open tabs
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
