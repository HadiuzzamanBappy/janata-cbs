"use client";

import { useDroppable } from "@dnd-kit/core";
import { FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeDropZoneProps {
  parentId?: string | null;
  label?: string;
  isReadOnly?: boolean;
}

export function TreeDropZone({
  parentId = null,
  label = "Drop action here to add to root",
  isReadOnly,
}: TreeDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${parentId || "root"}`,
    data: { parentId },
    disabled: isReadOnly,
  });

  if (isReadOnly) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border/60 bg-muted/10 text-muted-foreground text-xs transition-all",
        isOver && "border-primary bg-primary/10 text-primary scale-[1.01]",
      )}
    >
      <FolderPlus className="size-4 opacity-70" />
      <span>{label}</span>
    </div>
  );
}
