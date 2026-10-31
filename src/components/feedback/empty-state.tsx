import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/core-utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "w-full h-full min-h-75 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border/50 p-8 text-center bg-muted/10 select-none animate-in fade-in-50",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex size-11 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-primary shadow-2xs mb-3">
        <Icon className="size-5.5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
