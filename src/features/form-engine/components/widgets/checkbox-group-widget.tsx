import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps, WidgetOption } from "../../types";

export interface CheckboxGroupWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
}

export function CheckboxGroupWidget({
  value,
  onChange,
  disabled = false,
  options,
  className,
}: CheckboxGroupWidgetProps) {
  const currentArr: string[] = Array.isArray(value) ? (value as string[]) : [];

  const handleToggle = (code: string, checked: boolean) => {
    const next = checked ? [...currentArr, code] : currentArr.filter((item) => item !== code);
    onChange(next);
  };

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
