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
        "flex min-h-55 w-full flex-col items-center justify-center rounded-md border border-dashed border-border/70 p-6 text-center animate-in fade-in-50",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-muted-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-3 mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
