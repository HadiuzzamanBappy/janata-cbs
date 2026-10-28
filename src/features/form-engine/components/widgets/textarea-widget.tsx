import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface TextareaWidgetProps extends BaseWidgetProps {
  rows?: number;
}

export function TextareaWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  style,
  className,
  rows = 2,
}: TextareaWidgetProps) {
  return (
    <div style={style} className={className}>
      <Textarea
        rows={rows}
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full text-xs bg-background rounded border-border/80 p-2 font-sans focus-visible:ring-1 focus-visible:ring-ring min-h-14 resize-y",
          error && "border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
        )}
      />
    </div>
  );
}
