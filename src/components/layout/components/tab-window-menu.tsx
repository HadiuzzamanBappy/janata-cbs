"use client";

import { Check, ChevronDown, Layers, Search, X } from "lucide-react";
import * as React from "react";
import { useAlertStore } from "@/components/providers/alert-provider";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TabWindowMenu() {
  const [tabSearch, setTabSearch] = React.useState("");
  const { tabs, activeTabId, setActiveTab, removeTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();

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
              const originalIndex = tabs.findIndex((t) => t.id === tab.id);
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
                        const hasUserInput =
                          tab.formData &&
                          Object.values(tab.formData).some(
                            (v) => v !== undefined && v !== null && v !== "",
                          );

                        if (hasUserInput) {
                          confirm({
                            title: `Close "${tab.title}"?`,
                            message:
                              "You have unsaved typed inputs in this tab. Closing it will discard your changes.",
                            variant: "destructive",
                            confirmText: "Discard & Close",
                            onConfirm: () => removeTab(tab.id),
                          });
                        } else {
                          removeTab(tab.id);
                        }
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
  );
}
