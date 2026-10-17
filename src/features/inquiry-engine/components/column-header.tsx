"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ColumnHeaderProps {
  title: string;
  isSortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  align?: "left" | "center" | "right";
  className?: string;
}

export function ColumnHeader({
  title,
  isSortable = true,
  sortDirection,
  onSort,
  align = "left",
  className = "",
}: ColumnHeaderProps) {
  if (!isSortable) {
    return (
      <span
        className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
          align === "right"
            ? "text-right block w-full"
            : align === "center"
              ? "text-center block w-full"
              : "text-left"
        } ${className}`}
      >
        {title}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSort}
      className={`h-7 px-1.5 -ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-1 ${
        align === "right" ? "ml-auto" : align === "center" ? "mx-auto" : ""
      } ${className}`}
    >
      <span>{title}</span>
      {sortDirection === "asc" ? (
        <ArrowUp className="size-3 text-primary" />
      ) : sortDirection === "desc" ? (
        <ArrowDown className="size-3 text-primary" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
      )}
    </Button>
  );
}
