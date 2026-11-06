"use client";

import { ChevronDown, Layers, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useWorkbenchStore } from "@/store";
import { TabWindowMenuItem } from "../components/tab-window-menu-item";

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
            className="h-7 gap-1.5 px-2 text-xs font-mono font-medium bg-background border-border/80 hover:bg-accent hover:text-accent-foreground shrink-0 shadow-2xs"
          />
        }
      >
        <Layers className="size-3.5 text-primary shrink-0" />
        <span>{tabs.length}</span>
        <ChevronDown className="size-3 text-muted-foreground ml-0.5 shrink-0 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 sm:w-80 p-0 overflow-hidden border border-border/80 shadow-md"
      >
        {/* Header: Search Open Tabs */}
        {tabs.length > 3 && (
          <div className="p-2 border-b border-border/60 bg-muted/30 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={tabSearch}
              onChange={(e) => setTabSearch(e.target.value)}
              placeholder="Search opened windows..."
              className="pl-8 h-7 text-xs bg-background border-border/80 focus-visible:ring-1"
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
