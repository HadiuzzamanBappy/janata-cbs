"use client";

import { XCircle } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAlertStore, useWorkbenchStore } from "@/store";
import { TabItem } from "./tabs/tab-item";
import { TabWindowMenu } from "./tabs/tab-window-menu";

export function AppTabBar() {
  const { tabs, activeTabId, closeAllTabs, reorderTabs } = useWorkbenchStore();
  const { confirm } = useAlertStore();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  // Auto-scroll active tab into view when activeTabId changes
  React.useEffect(() => {
    if (activeTabId && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) {
    return null;
  }

  // Convert Vertical Wheel Scroll to Horizontal Tab Scroll and lock vertical movement
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      scrollRef.current.scrollTop = 0;
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      if (typeof reorderTabs === "function") {
        reorderTabs(draggedIndex, index);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="h-10 border-b border-border/60 bg-muted/40 flex items-end justify-between select-none relative w-full max-w-full min-w-0 shrink-0 overflow-hidden">
      {/* Left Section: Scrollable Tabs Strip */}
      <section
        ref={scrollRef}
        aria-label="Tab list scroll container"
        onWheel={handleWheel}
        className="flex-1 min-w-0 flex items-end gap-0 overflow-x-auto overflow-y-hidden pt-1 px-0 no-scrollbar h-full select-none cursor-default"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const nextTab = tabs[index + 1];
          // Show separator between inactive tab and next inactive tab (never around active tab)
          const showSeparator = !isActive && Boolean(nextTab && nextTab.id !== activeTabId);

          return (
            <TabItem
              key={tab.id}
              tab={tab}
              index={index}
              isActive={isActive}
              showSeparator={showSeparator}
              isDraggingThis={draggedIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </section>

      {/* Right Section: Fixed Hug-Content Action Bar */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 border-l border-border/50 bg-background/50 h-full z-10">
        {/* Tab Count Window Switcher Dropdown CTA */}
        <TabWindowMenu />

        {/* Close All CTA Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() =>
                  confirm({
                    title: "Close All Active Tabs?",
                    message: `Are you sure you want to close all ${tabs.length} open workspace window tabs? Any unsaved form progress will be discarded.`,
                    variant: "destructive",
                    confirmText: "Close All Tabs",
                    onConfirm: () => closeAllTabs(),
                  })
                }
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded"
                aria-label="Close all open tabs"
              />
            }
          >
            <XCircle className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Close all open tabs
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
