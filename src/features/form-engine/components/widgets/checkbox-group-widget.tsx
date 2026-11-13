"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps, WidgetOption } from "../../types";

export interface CheckboxGroupWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
  variant?: "standard" | "badge";
}

export function CheckboxGroupWidget({
  id,
  value,
  onChange,
  disabled = false,
  options,
  variant = "standard",
  className,
}: CheckboxGroupWidgetProps) {
  const currentArr: string[] = Array.isArray(value) ? (value as string[]) : [];

  const handleToggle = (code: string, checked: boolean) => {
    const next = checked ? [...currentArr, code] : currentArr.filter((item) => item !== code);
    onChange(next);
  };

  if (variant === "badge") {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {options.map((opt) => {
          const isChecked = currentArr.includes(opt.code);
          return (
            <label
              key={opt.code}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors select-none",
                isChecked
                  ? disabled
                    ? "border-muted-foreground/30 bg-muted/60 text-muted-foreground font-medium"
                    : "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40",
                disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={isChecked}
                onChange={(e) => handleToggle(opt.code, e.target.checked)}
                className="sr-only"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 flex-wrap flex-1 min-w-0", className)}>
      {options.map((opt) => {
        const isChecked = currentArr.includes(opt.code);
        const optId = `${id}-${opt.code}`;
        return (
          <label
            key={opt.code}
            htmlFor={optId}
            className={cn(
              "flex items-center gap-1.5 select-none",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <Checkbox
              id={optId}
              checked={isChecked}
              disabled={disabled}
              onCheckedChange={(checked: boolean) => handleToggle(opt.code, Boolean(checked))}
              className={cn(
                "rounded",
                "dark:data-checked:text-primary-foreground",
                disabled &&
                  (isChecked
                    ? "bg-muted/70! border-border! text-muted-foreground!"
                    : "bg-input/40! border-border/60!"),
              )}
            />
            <span
              className={cn(
                "text-xs font-mono font-normal transition-colors",
                disabled ? "text-muted-foreground/85" : "text-foreground",
              )}
            >
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
