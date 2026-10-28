import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface TextWidgetProps extends BaseWidgetProps {
  type?: "text" | "number";
}

export function TextWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  style,
  className,
  type = "text",
}: TextWidgetProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      const val = e.target.value;
      onChange(val === "" ? "" : Number(val));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div style={style} className={className}>
      <Input
        type={type}
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={handleChange}
        className={cn(
          "h-7 text-xs bg-background rounded border-border/80 w-full",
          type === "number" && "font-mono",
          error && "border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
        )}
      />
    </div>
  );
}
