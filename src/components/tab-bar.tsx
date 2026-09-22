"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Layers,
  Search,
  X,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbench-store";

export function TabBar() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [tabSearch, setTabSearch] = React.useState("");
  const { tabs, activeTabId, setActiveTab, removeTab, closeAllTabs } =
    useWorkbenchStore();

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
      const activeEl = scrollRef.current.querySelector(
        `[data-tab-id="${activeTabId}"]`,
      );
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

  const handleConfirmCloseAll = () => {
    closeAllTabs();
    setConfirmOpen(false);
  };

  const filteredTabs = tabs.filter((t) =>
    t.title.toLowerCase().includes(tabSearch.trim().toLowerCase()),
  );

  return (
    <>
      <div className="h-10 border-b border-border/60 bg-muted/30 flex items-center justify-between select-none relative overflow-hidden w-full max-w-full min-w-0 shrink-0">
        {/* Left Section: Scrollable & Draggable Tabs Strip */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          className={cn(
            "flex-1 min-w-0 flex items-center gap-1 overflow-x-auto py-1 px-2 no-scrollbar h-full select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const universalTabNumber = index + 1;
            return (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                onClick={(e) => {
                  if (hasMovedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "group relative flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border whitespace-nowrap shrink-0 h-8 cursor-pointer select-none",
                  isActive
                    ? "bg-background text-foreground border-border shadow-2xs font-semibold"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {/* Subtle Tab Number & Title */}
                <span className="truncate max-w-[160px] text-xs flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="h-4 min-w-[16px] px-1 rounded-sm text-[10px] font-mono flex items-center justify-center opacity-70 border-transparent"
                  >
                    {universalTabNumber}
                  </Badge>
                  {tab.title}
                </span>

                {/* Close Tab Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  className={cn(
                    "size-4 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0",
                    !isActive && "opacity-60 group-hover:opacity-100",
                  )}
                  aria-label={`Close tab ${tab.title}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Section: Fixed Hug-Content Action Bar */}
        <div className="shrink-0 flex items-center gap-1.5 px-2 border-l border-border/50 bg-background/50 h-full z-10">
          {/* Tab Count Window Switcher Dropdown CTA */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 gap-1.5 px-2 text-xs font-mono font-medium bg-background border-border/80 hover:bg-accent hover:text-accent-foreground shrink-0 shadow-2xs"
                />
              }
            >
              <Layers className="size-3.5 text-primary shrink-0" />
              <span>
                {tabs.length} {tabs.length === 1 ? "Tab" : "Tabs"}
              </span>
              <ChevronDown className="size-3 text-muted-foreground ml-0.5 shrink-0 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 sm:w-80 p-0 overflow-hidden"
            >
              {/* Header: Search Open Tabs */}
              {tabs.length > 3 && (
                <div className="p-2 border-b border-border/60 bg-muted/30 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={tabSearch}
                    onChange={(e) => setTabSearch(e.target.value)}
                    placeholder="Search opened windows..."
                    className="pl-8 h-8 text-xs bg-background border-border/70 focus-visible:ring-1"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground border-b border-border/40 uppercase tracking-wider bg-muted/20">
                Opened Windows ({tabs.length})
              </div>

              <DropdownMenuGroup className="max-h-64 overflow-y-auto p-1">
                {filteredTabs.length > 0 ? (
                  filteredTabs.map((tab) => {
                    const originalIndex = tabs.findIndex(
                      (t) => t.id === tab.id,
                    );
                    const isActive = tab.id === activeTabId;
                    return (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center justify-between py-2 px-2.5 cursor-pointer rounded-sm text-xs gap-2 group hover:bg-accent hover:text-accent-foreground",
                          isActive &&
                            "bg-accent text-accent-foreground font-semibold",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="truncate flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className="h-4 min-w-[16px] px-1 rounded-sm text-[10px] font-mono flex items-center justify-center opacity-70 border-transparent"
                            >
                              {originalIndex + 1}
                            </Badge>
                            {tab.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && (
                            <Check className="size-3.5 text-primary shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTab(tab.id);
                            }}
                            className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100"
                            title="Close Window"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </DropdownMenuItem>
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

          {/* Close All CTA Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setConfirmOpen(true)}
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

      {/* Close All Tabs Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md p-5 rounded-xl border border-border/80"
        >
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              <DialogTitle className="text-base font-semibold">
                Close All Active Tabs?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to close all {tabs.length} open workspace
              window tabs? Any unsaved form progress will be discarded.
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
