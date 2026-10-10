"use client";

import { CheckSquare, ListChecks, Search, Square } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { MenuRef } from "@/lib/data-schemas/user-group-schema";

interface MenuPermissionPanelProps {
  menus: MenuRef[];
  selectedMenuIds: string[];
  onToggleMenu: (menuId: string) => void;
  onSetMenusBulk: (menuIds: string[], select: boolean) => void;
  isReadOnly?: boolean;
}

export function MenuPermissionPanel({
  menus,
  selectedMenuIds,
  onToggleMenu,
  onSetMenusBulk,
  isReadOnly,
}: MenuPermissionPanelProps) {
  const [filter, setFilter] = React.useState("");

  const filteredMenus = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return menus;
    return menus.filter(
      (m) =>
        m.menuId.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        m.command.toLowerCase().includes(q),
    );
  }, [menus, filter]);

  const selectedIdSet = React.useMemo(() => new Set(selectedMenuIds), [selectedMenuIds]);

  return (
    <div className="flex-1 border border-border/80 rounded-lg bg-card/40 flex flex-col overflow-hidden min-h-0">
      {/* Panel Header */}
      <div className="p-2.5 border-b border-border/80 flex items-center justify-between gap-2 bg-card/60 shrink-0">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Authorized Menus
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {selectedMenuIds.length} of {menus.length} selected
          </Badge>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onSetMenusBulk(
                  filteredMenus.map((m) => m.menuId),
                  true,
                )
              }
              className="h-6 text-[10px] px-2 gap-1 text-primary hover:text-primary"
            >
              <CheckSquare className="size-3" /> Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onSetMenusBulk(
                  filteredMenus.map((m) => m.menuId),
                  false,
                )
              }
              className="h-6 text-[10px] px-2 gap-1 text-muted-foreground"
            >
              <Square className="size-3" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-border/60 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search menu by ID, label, or command..."
            className="pl-8 h-7 text-xs bg-background/60"
          />
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredMenus.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No navigation menu items match query.
          </div>
        ) : (
          <ul className="space-y-1 list-none p-0 m-0">
            {filteredMenus.map((m) => {
              const isChecked = selectedIdSet.has(m.menuId);
              return (
                <li key={m.menuId}>
                  <label
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-all border select-none",
                      isChecked
                        ? "bg-primary/5 border-primary/30 text-foreground"
                        : "border-transparent hover:bg-muted/40 text-muted-foreground",
                      isReadOnly && "cursor-default",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isReadOnly}
                      onChange={() => onToggleMenu(m.menuId)}
                      className="size-3.5 rounded accent-primary shrink-0 cursor-pointer disabled:cursor-default"
                    />
                    <span className="font-mono font-bold text-primary w-8 shrink-0">
                      #{m.menuId}
                    </span>
                    <span className="font-medium text-foreground truncate flex-1">{m.label}</span>
                    {m.command && (
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded truncate shrink-0">
                        {m.command}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
