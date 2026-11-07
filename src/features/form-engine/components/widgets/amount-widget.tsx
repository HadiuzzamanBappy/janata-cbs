import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface AmountWidgetProps extends BaseWidgetProps {
  currencyPrefix?: string;
}

export function AmountWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  className,
  currencyPrefix,
}: AmountWidgetProps) {
  return (
    <div className={cn("relative flex items-center min-w-0 w-full", className)}>
      {currencyPrefix && (
        <span className="absolute left-2 text-[10px] font-mono text-muted-foreground select-none">
          {currencyPrefix}
        </span>
      )}
      <Input
        type="text"
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 text-xs font-mono bg-background rounded border-border/80 w-full focus-visible:ring-0 focus-visible:border-foreground/50",
          currencyPrefix && "pl-9",
          error && "border-destructive focus-visible:border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
        )}
      />
    </div>
  );
}
