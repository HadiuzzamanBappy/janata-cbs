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
    <div className={cn("flex items-center gap-3", className)}>
      {options.map((opt) => (
        <label key={opt.code} className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="radio"
            name={id}
            value={opt.code}
            disabled={disabled}
            checked={String(value) === opt.code}
            onChange={() => onChange(opt.code)}
            className="size-3.5 text-primary focus:ring-primary/40 border-border disabled:opacity-60 disabled:cursor-default"
          />
          <span className="text-foreground">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
