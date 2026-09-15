"use client";

import * as React from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";
import { useWorkbenchStore } from "@/store/workbench-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function TabBar() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { tabs, activeTabId, setActiveTab, removeTab, closeAllTabs } =
    useWorkbenchStore();

  if (tabs.length === 0) {
    return null;
  }

  const handleConfirmCloseAll = () => {
    closeAllTabs();
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="h-10 border-b border-border/60 bg-muted/40 px-2 flex items-center justify-between gap-2 overflow-x-auto select-none no-scrollbar">
        {/* Scrollable Tabs Container */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const universalTabNumber = index + 1;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 border whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-background text-foreground border-border shadow-xs"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {/* Universal Tab Position Badge on left side */}
                <span
                  className={cn(
                    "size-4 rounded-xs text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border leading-none",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/80 text-muted-foreground border-border/60"
                  )}
                >
                  {universalTabNumber}
                </span>

                <span className="truncate max-w-[150px]">{tab.title}</span>

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
                  onClick={() => setConfirmOpen(true)}
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

      {/* Close All Tabs Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md p-5 rounded-xl border border-border/80">
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              <DialogTitle className="text-base font-semibold">Close All Active Tabs?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to close all {tabs.length} open workspace window tabs? Any unsaved form progress will be discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCloseAll}
              className="text-xs h-8 gap-1.5"
            >
              <XCircle className="size-3.5" />
              Close All Tabs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
