"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ColumnHeaderProps {
  label: string;
  columnId: string;
  align?: "left" | "center" | "right";
  sortDirection?: "asc" | "desc" | null;
  onSort?: (columnId: string) => void;
  className?: string;
}

export function ColumnHeader({
  label,
  columnId,
  align = "left",
  sortDirection,
  onSort,
  className = "",
}: ColumnHeaderProps) {
  if (!onSort) {
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
        {label}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(columnId)}
      className={`h-7 px-1.5 -ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-1 ${
        align === "right" ? "ml-auto" : align === "center" ? "mx-auto" : ""
      } ${className}`}
    >
      <span>{label}</span>
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
