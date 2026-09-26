"use client";

import { XCircle } from "lucide-react";
import * as React from "react";
import { TabItem } from "@/components/layout/components/tab-item";
import { TabWindowMenu } from "@/components/layout/components/tab-window-menu";
import { useAlertStore } from "@/components/providers/alert-provider";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppTabBar() {
  const { tabs, activeTabId, closeAllTabs } = useWorkbenchStore();
  const { confirm } = useAlertStore();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const isMouseDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasMovedRef = React.useRef(false);

  // Global Mouse Drag Listeners for 100% Reliable Drag-to-Scroll
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !scrollRef.current) return;
      const dx = e.clientX - startXRef.current;
      if (Math.abs(dx) > 3) {
        hasMovedRef.current = true;
      }
      scrollRef.current.scrollLeft = scrollLeftRef.current - dx * 1.2;
    };

    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

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

  // Mouse Drag-to-Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    if ((e.target as HTMLElement).closest("button")) return;

    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    setIsDragging(true);
  };

  // Convert Vertical Wheel Scroll to Horizontal Tab Scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="h-10 border-b border-border/60 bg-muted/30 flex items-center justify-between select-none relative overflow-hidden w-full max-w-full min-w-0 shrink-0">
      {/* Left Section: Scrollable & Draggable Tabs Strip */}
      <section
        ref={scrollRef}
        aria-label="Tab list scroll container"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className={cn(
          "flex-1 min-w-0 flex items-center gap-1 overflow-x-auto py-1 px-2 no-scrollbar h-full select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            index={index}
            isActive={tab.id === activeTabId}
            hasMovedRef={hasMovedRef}
          />
        ))}
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
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
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
