"use client";

import { LayoutGrid, Plus, Table2, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { ViewDefItem } from "@/lib/data-schemas/model-config-schema";

interface McViewListProps {
  views: ViewDefItem[];
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
  isReadOnly: boolean;
  onAddView: () => void;
  onDeleteView: (idx: number) => void;
}

export function McViewList({
  views,
  selectedIdx,
  onSelectIdx,
  isReadOnly,
  onAddView,
  onDeleteView,
}: McViewListProps) {
  // Stable identity mapping for React rendering without relying on array index as key
  const viewKeyMapRef = React.useRef(new WeakMap<ViewDefItem, string>());
  const nextIdRef = React.useRef(1);

  const getViewKey = React.useCallback((view: ViewDefItem): string => {
    let key = viewKeyMapRef.current.get(view);
    if (!key) {
      key = `view_${nextIdRef.current++}`;
      viewKeyMapRef.current.set(view, key);
    }
    return key;
  }, []);

  return (
    <div className="w-80 sm:w-96 border-r border-border/70 flex flex-col bg-muted/10 shrink-0 min-h-0">
      {/* Top Header Bar */}
      <div className="p-2 border-b border-border/70 flex items-center justify-between gap-1.5 shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LayoutGrid className="size-3" />
          </div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
            Views (VIEWDEF)
          </span>
          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold border border-primary/20">
            {views.length}
          </span>
        </div>

        {!isReadOnly && (
          <Button
            type="button"
            size="sm"
            onClick={onAddView}
            className="h-7 text-xs gap-1 px-2.5 font-medium rounded shadow-xs shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add View</span>
          </Button>
        )}
      </div>

      {/* Views List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/20">
        {views.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground select-none space-y-2">
            <Table2 className="size-8 mx-auto text-muted-foreground/40" />
            <p>No database views configured</p>
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddView}
                className="h-7 text-xs rounded mt-2"
              >
                Create First View
              </Button>
            )}
          </div>
        ) : (
          views.map((view, idx) => {
            const isSelected = idx === selectedIdx;
            const fieldCount = view.FIELDS?.length || 0;
            const viewKey = getViewKey(view);

            return (
              <div
                key={viewKey}
                className={cn(
                  "flex items-center justify-between w-full py-1.5 px-2.5 transition-colors select-none group",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted/40 text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectIdx(idx)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none"
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1 py-0.5 rounded shrink-0",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                        : "bg-muted text-muted-foreground font-medium",
                    )}
                  >
                    #{idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate font-medium">
                      {view.VIEWNAME || "<UNNAMED_VIEW>"}
                    </div>
                    {view.DESCRIPTION && (
                      <div
                        className={cn(
                          "text-[10px] truncate leading-tight",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {view.DESCRIPTION}
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider",
                      isSelected
                        ? "border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground"
                        : "text-muted-foreground border-border/70",
                    )}
                  >
                    {fieldCount} {fieldCount === 1 ? "col" : "cols"}
                  </Badge>

                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteView(idx);
                      }}
                      className={cn(
                        "size-5 p-0 rounded transition-opacity",
                        isSelected
                          ? "text-primary-foreground hover:bg-destructive hover:text-destructive-foreground"
                          : "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100",
                      )}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
