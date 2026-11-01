"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface CheckboxWidgetProps extends BaseWidgetProps {}

export function CheckboxWidget({
  id,
  value,
  onChange,
  disabled = false,
  className,
}: CheckboxWidgetProps) {
  const isChecked = Boolean(value);

  return (
    <div className={cn("flex items-center gap-2 max-w-md flex-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-2 select-none",
          disabled ? "cursor-default opacity-85" : "cursor-pointer",
        )}
      >
        <Checkbox
          id={id}
          checked={isChecked}
          disabled={disabled}
          onCheckedChange={(val: boolean) => onChange(Boolean(val))}
          className={cn("rounded", disabled && "disabled:opacity-90 disabled:cursor-default")}
        />
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
            isChecked
              ? "bg-primary/10 text-primary border-primary/25"
              : "bg-muted text-muted-foreground border-border/40",
          )}
        >
          {isChecked ? "Yes" : "No"}
        </span>
      </label>
    </div>
  );
}
