import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { TextWidgetConfig } from "@/lib/data-schemas/form-engine-schema";
import type { BaseWidgetProps } from "../../types";

export interface TextWidgetProps extends BaseWidgetProps {
  type?: "text" | "number";
  config?: TextWidgetConfig;
}

export function TextWidget({
  id,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  className,
  type = "text",
  config,
}: TextWidgetProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (type === "number") {
      onChange(raw === "" ? "" : Number(raw));
      return;
    }

    if (config?.textTransform === "uppercase") {
      raw = raw.toUpperCase();
    } else if (config?.textTransform === "lowercase") {
      raw = raw.toLowerCase();
    }

    onChange(raw);
  };

  const handleBlur = () => {
    if (config?.autoTrim && typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== value) {
        onChange(trimmed);
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Input
        type={type}
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={String(value ?? "")}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "h-7 text-xs bg-background rounded border-border/80 w-full focus-visible:ring-0 focus-visible:border-foreground/50",
          type === "number" && "font-mono",
          config?.textTransform === "uppercase" && "uppercase",
          config?.textTransform === "lowercase" && "lowercase",
          error && "border-destructive focus-visible:border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
        )}
      />
    </div>
  );
}
