"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps, WidgetOption } from "../../types";

export interface RadioWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
  variant?: "standard" | "group";
}

export function RadioWidget({
  id,
  value,
  onChange,
  disabled = false,
  options,
  variant = "standard",
  className,
}: RadioWidgetProps) {
  if (variant === "group") {
    return (
      <div
        className={cn(
          "inline-flex rounded border border-border/80 p-0.5 bg-muted/30 gap-0.5",
          className,
        )}
      >
        {options.map((opt) => {
          const isSelected = String(value) === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.code)}
              className={cn(
                "px-2.5 py-0.5 text-xs rounded transition-all cursor-pointer font-medium border-0",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50 bg-transparent",
                disabled && "cursor-default opacity-80",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <RadioGroup
      value={value ? String(value) : ""}
      onValueChange={(val: string) => onChange(val)}
      disabled={disabled}
      className={cn("flex items-center gap-5", className)}
    >
      {options.map((opt) => {
        const radioId = `${id}-${opt.code}`;
        const isSelected = String(value || "").toUpperCase() === opt.code.toUpperCase();
        return (
          <div key={opt.code} className="flex items-center gap-1.5">
            <RadioGroupItem
              id={radioId}
              value={opt.code}
              disabled={disabled}
              className="size-3.5"
            />
            <Label
              htmlFor={radioId}
              className={cn(
                "text-xs font-medium cursor-pointer select-none",
                isSelected ? "text-foreground font-semibold" : "text-muted-foreground",
                disabled && "cursor-default opacity-85",
              )}
            >
              {opt.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
