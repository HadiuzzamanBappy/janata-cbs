"use client";

import { Plus, Search, Terminal } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MenuCatalogItem } from "../types";

interface MenuCatalogSidebarProps {
  items: MenuCatalogItem[];
  loading?: boolean;
  onAddItem: (item: MenuCatalogItem) => void;
  disabled?: boolean;
}

export function MenuCatalogSidebar({
  items,
  loading,
  onAddItem,
  disabled,
}: MenuCatalogSidebarProps) {
  const [search, setSearch] = React.useState("");

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.command.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <aside className="w-72 border-r border-border bg-card/40 flex flex-col h-full shrink-0 select-none">
      <div className="p-3 border-b border-border/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Action Catalog (MENU)
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            {filteredItems.length} items
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or command..."
            className="pl-8 h-7 text-xs bg-background/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Loading catalog actions...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No catalog items found.
          </div>
        ) : (
          <ul className="space-y-1.5 list-none p-0 m-0">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                draggable={!disabled}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(item));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group p-2 rounded-md border border-border/60 bg-background/80 hover:bg-accent/60 hover:border-border transition-all flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">
                      {item.label}
                    </span>
                  </div>
                  {item.command && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Terminal className="size-2.5 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                        {item.command}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAddItem(item)}
                  title="Add to Tree Root"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 size-6 rounded hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-all shrink-0 disabled:opacity-0"
                >
                  <Plus className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
