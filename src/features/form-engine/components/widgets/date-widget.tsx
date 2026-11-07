import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface DateWidgetProps extends BaseWidgetProps {
  type?: "date" | "datetime-local";
}

export function DateWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  className,
  type = "date",
}: DateWidgetProps) {
  const strVal = String(value ?? "");
  const isDateTime = type === "datetime-local";

  return (
    <div className={cn("flex items-center gap-1.5 flex-1 w-full min-w-0 max-w-full", className)}>
      <Input
        type={type}
        id={id}
        disabled={disabled}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 w-full rounded text-xs bg-background border-border/80 font-mono scheme-light dark:scheme-dark",
          error && "border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
        )}
      />
      {Boolean(strVal) && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded cursor-pointer"
          title={`Clear ${isDateTime ? "date & time" : "date"}`}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
