"use client";

import { useDraggable } from "@dnd-kit/core";
import { Plus, Search, Terminal } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MenuCatalogActionItem } from "@/lib/schemas/menu-designer-schema";
import { cn } from "@/lib/utils";

interface DraggableCatalogCardProps {
  item: MenuCatalogActionItem;
  disabled?: boolean;
  onAddItem: (item: MenuCatalogActionItem) => void;
}

function DraggableCatalogCard({ item, disabled, onAddItem }: DraggableCatalogCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${item.id}`,
    data: { item },
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      draggable={!disabled}
      onDragStart={(e) => {
        // Native fallback drag transfer
        e.dataTransfer.setData("application/json", JSON.stringify(item));
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "group p-2 rounded-md border border-border/70 bg-card hover:border-primary/50 hover:bg-accent/40 transition-all flex items-start justify-between gap-2 select-none",
        !disabled ? "cursor-grab active:cursor-grabbing" : "opacity-60 cursor-not-allowed",
        isDragging && "opacity-40 border-primary ring-1 ring-primary",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground truncate">
            {item.label}
          </span>
          {item.menuType && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-mono text-muted-foreground border-border/60">
              {item.menuType}
            </Badge>
          )}
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

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onAddItem(item);
        }}
        title="Add to Canvas Root"
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 h-6 w-6 rounded hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all shrink-0 disabled:opacity-0"
      >
        <Plus className="size-3.5" />
      </Button>
    </li>
  );
}

interface MenuCatalogSidebarProps {
  items: MenuCatalogActionItem[];
  loading?: boolean;
  onAddItem: (item: MenuCatalogActionItem) => void;
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
        (item.command && item.command.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <aside className="w-72 border-r border-border bg-card/40 flex flex-col h-full shrink-0 select-none">
      <div className="p-2.5 border-b border-border/80 space-y-2">
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
              <DraggableCatalogCard
                key={item.id}
                item={item}
                disabled={disabled}
                onAddItem={onAddItem}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
