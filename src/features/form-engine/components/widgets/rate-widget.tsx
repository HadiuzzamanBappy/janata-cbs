import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface RateWidgetProps extends BaseWidgetProps {
  suffix?: string;
}

export function RateWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  placeholder = "0.0000",
  className,
  suffix = "%",
}: RateWidgetProps) {
  return (
    <div className={cn("relative flex items-center w-full min-w-0", className)}>
      <Input
        type="number"
        step="any"
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 text-xs font-mono bg-background rounded border-border/80 w-full pr-6 focus-visible:ring-0 focus-visible:border-foreground/50",
          error && "border-destructive focus-visible:border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
        )}
      />
      <span className="absolute right-2 text-[11px] font-mono font-semibold text-muted-foreground select-none pointer-events-none">
        {suffix}
      </span>
    </div>
  );
}
