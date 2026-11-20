/**
 * @fileoverview High-Density Text & Number Input Widget
 * @module form-engine/widgets/text-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Casing and whitespace come from the field's TRANSFORM (applied by FormRenderer); `trim`
 *   is applied here on blur so the operator can type spaces between words.
 * - Compact banking typography (h-7, text-xs, monospace for numbers).
 */

import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps } from "../../types";

export interface TextWidgetProps extends BaseWidgetProps {
  type?: "text" | "number";
  /** Trims leading and trailing whitespace when the input loses focus (TRANSFORM `trim`). */
  trimOnBlur?: boolean;
}

export function TextWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  className,
  type = "text",
  trimOnBlur = false,
}: TextWidgetProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(type === "number" ? (raw === "" ? "" : Number(raw)) : raw);
  };

  const handleBlur = () => {
    if (trimOnBlur && typeof value === "string" && value.trim() !== value) {
      onChange(value.trim());
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
          error && "border-destructive focus-visible:border-destructive",
          disabled &&
            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
        )}
      />
    </div>
  );
}
