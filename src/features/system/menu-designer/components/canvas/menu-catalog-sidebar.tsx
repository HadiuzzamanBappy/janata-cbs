"use client";

import { useDraggable } from "@dnd-kit/core";
import { Pin, Plus, Search, Terminal } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { MenuCatalogActionItem } from "@/lib/data-schemas/menu-designer-schema";

interface DraggableCatalogCardProps {
  item: MenuCatalogActionItem;
  isAdded?: boolean;
  disabled?: boolean;
  onAddItem: (item: MenuCatalogActionItem) => void;
}

function DraggableCatalogCard({ item, isAdded, disabled, onAddItem }: DraggableCatalogCardProps) {
  const isDragDisabled = disabled || isAdded;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${item.id}`,
    data: { item },
    disabled: isDragDisabled,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      draggable={!isDragDisabled}
      onDragStart={(e) => {
        if (isDragDisabled) {
          e.preventDefault();
          return;
        }
        // Native fallback drag transfer
        e.dataTransfer.setData("application/json", JSON.stringify(item));
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "group relative p-2 rounded-md border transition-all flex items-start justify-between gap-2 select-none",
        isAdded
          ? "border-emerald-500/30 bg-emerald-500/5 opacity-80 cursor-default"
          : "border-border/70 bg-card hover:border-primary/50 hover:bg-accent/40",
        !isDragDisabled && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 border-primary ring-1 ring-primary",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "text-xs font-medium truncate",
              isAdded ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-foreground",
            )}
          >
            {item.label}
          </span>
          {item.menuType && (
            <span className="text-[9px] px-1 py-0.5 rounded font-mono text-muted-foreground/80 bg-muted/50 border border-border/40 leading-none">
              {item.menuType}
            </span>
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

      {isAdded ? (
        <div
          title="Already added to menu hierarchy"
          className="flex items-center justify-center h-6 w-6 rounded text-emerald-600 dark:text-emerald-400 shrink-0"
        >
          <Pin className="size-3.5 fill-current rotate-45" />
        </div>
      ) : (
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
          className="h-6 w-6 rounded transition-all shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0"
        >
          <Plus className="size-3.5" />
        </Button>
      )}
    </li>
  );
}

interface MenuCatalogSidebarProps {
  items: MenuCatalogActionItem[];
  loading?: boolean;
  addedMenuIds?: Set<string>;
  addedCommands?: Set<string>;
  onAddItem: (item: MenuCatalogActionItem) => void;
  disabled?: boolean;
}

export function MenuCatalogSidebar({
  items,
  loading,
  addedMenuIds,
  addedCommands,
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
        item.command?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [items, search]);

  const addedCount = React.useMemo(() => {
    if (!addedMenuIds && !addedCommands) return 0;
    return items.filter((item) => {
      const matchId = addedMenuIds?.has(String(item.id));
      const matchCmd = item.command && addedCommands?.has(item.command.trim().toUpperCase());
      return Boolean(matchId || matchCmd);
    }).length;
  }, [items, addedMenuIds, addedCommands]);

  return (
    <aside className="w-72 border-r border-border bg-card/40 flex flex-col h-full shrink-0 select-none">
      <div className="p-2.5 border-b border-border/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider truncate">
            Catalog (MENU)
          </span>
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">
            {addedCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {addedCount} pinned
              </span>
            )}
            {addedCount > 0 && <span className="text-border">/</span>}
            <span>{filteredItems.length} total</span>
          </div>
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
            {filteredItems.map((item) => {
              const isAdded = Boolean(
                addedMenuIds?.has(String(item.id)) ||
                  (item.command && addedCommands?.has(item.command.trim().toUpperCase())),
              );
              return (
                <DraggableCatalogCard
                  key={item.id}
                  item={item}
                  isAdded={isAdded}
                  disabled={disabled}
                  onAddItem={onAddItem}
                />
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
