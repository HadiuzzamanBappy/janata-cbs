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
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40",
                disabled && "opacity-80 cursor-default",
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
              disabled ? "cursor-default opacity-85" : "cursor-pointer",
            )}
          >
            <Checkbox
              id={optId}
              checked={isChecked}
              disabled={disabled}
              onCheckedChange={(checked: boolean) => handleToggle(opt.code, Boolean(checked))}
              className={cn("rounded", disabled && "disabled:opacity-90 disabled:cursor-default")}
            />
            <span className="text-xs font-mono font-normal text-foreground">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
