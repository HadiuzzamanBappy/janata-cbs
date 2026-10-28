import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps, WidgetOption } from "../../types";

export interface SelectWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
  loading?: boolean;
  isNumeric?: boolean;
  label?: string;
}

export function SelectWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  style,
  className,
  options,
  loading = false,
  isNumeric = false,
  label = "Select",
}: SelectWidgetProps) {
  const handleValueChange = (val: string | null) => {
    if (val === null) {
      onChange("");
      return;
    }
    if (isNumeric) {
      const num = Number(val);
      onChange(Number.isNaN(num) ? val : num);
    } else {
      onChange(val);
    }
  };

  return (
    <div style={style} className={cn("min-w-32", className)}>
      <Select
        disabled={disabled || loading}
        value={String(value ?? "")}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "h-7 text-xs bg-background rounded border-border/80 w-full",
            error && "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
            disabled && "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15",
          )}
        >
          <SelectValue placeholder={loading ? "Loading..." : placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="z-50 text-xs font-sans">
          {options.map((opt) => (
            <SelectItem key={opt.code} value={opt.code} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
