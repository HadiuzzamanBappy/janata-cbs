"use client";

import type * as React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormField } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export interface FieldFactoryProps {
  field: FormField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  mode?: "IDLE" | "CREATE" | "EDIT" | "VIEW";
}

export function FieldFactory({
  field,
  value,
  onChange,
  error,
  disabled = false,
  mode = "EDIT",
}: FieldFactoryProps) {
  const isViewMode = mode === "VIEW";
  const isReadOnly = disabled || field.readOnly || isViewMode;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.name, e.target.value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(field.name, val === "" ? "" : Number(val));
  };

  const handleDateChange = (selectedDate?: Date) => {
    if (!selectedDate) {
      onChange(field.name, "");
      return;
    }
    // Format YYYY-MM-DD using local date to prevent UTC timezone shifts
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    onChange(field.name, `${year}-${month}-${day}`);
  };

  const handleSelectChange = (selectedValue: string | null) => {
    if (selectedValue !== null) {
      onChange(field.name, selectedValue);
    }
  };

  const parseDateValue = (val: unknown): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const parts = val.split("-");
      if (parts.length === 3) {
        const year = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1;
        const day = Number.parseInt(parts[2], 10);
        if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
          return new Date(year, month, day);
        }
      }
    }
    const d = new Date(val as string | number);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  // Width matching system screen standard: compact (w-28), number (w-28), default (max-w-md flex-1)
  const inputWidth =
    field.width === "xs"
      ? "w-28"
      : field.width === "sm"
        ? "w-36"
        : field.type === "number"
          ? "w-28"
          : field.width === "lg"
            ? "max-w-xl flex-1"
            : "max-w-md flex-1";

  const placeholderText = field.placeholder || `e.g. ${field.label}`;

  return (
    <div className="space-y-1">
      {/* Exact scan-line row: Label (w-32) + Colon (:) + Input */}
      <div className="flex items-center gap-2">
        <Label
          htmlFor={field.name}
          className={cn(
            "w-32 shrink-0 text-xs select-none",
            error
              ? "text-destructive font-semibold"
              : field.required
                ? "text-foreground font-medium"
                : "text-muted-foreground",
          )}
        >
          {field.label}
          {field.required && !isViewMode && (
            <span className="text-destructive font-bold ml-1">*</span>
          )}
        </Label>

        <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

        {isViewMode ? (
          <div
            className={cn(
              "h-7 flex items-center px-2 rounded text-xs bg-muted/15 border border-border/80 font-mono text-foreground font-medium select-text",
              inputWidth,
            )}
          >
            {value !== undefined && value !== null && value !== "" ? (
              <span>{String(value)}</span>
            ) : (
              <span className="text-muted-foreground/50 italic text-[11px]">Not specified</span>
            )}
          </div>
        ) : field.type === "select" ? (
          <Select
            disabled={isReadOnly}
            value={String(value ?? "")}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger
              id={field.name}
              className={cn(
                "h-7 text-xs bg-background rounded border-border/80",
                error && "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
                isReadOnly && "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15",
                inputWidth,
              )}
            >
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent className="z-50 text-xs font-sans">
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "date" ? (
          <div className={inputWidth}>
            <DatePicker
              disabled={isReadOnly}
              date={parseDateValue(value)}
              onSelect={handleDateChange}
              placeholder={`Select ${field.label}`}
              className={cn(
                "h-7 text-xs bg-background rounded border-border/80 w-full",
                error && "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
                isReadOnly && "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15",
              )}
            />
          </div>
        ) : field.type === "number" ? (
          <Input
            id={field.name}
            type="number"
            disabled={isReadOnly}
            value={(value as string | number) ?? ""}
            onChange={handleNumberChange}
            placeholder={placeholderText}
            title={error || undefined}
            className={cn(
              "h-7 rounded text-xs bg-background border-border/80 font-mono",
              error && "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
              isReadOnly &&
                "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
              inputWidth,
            )}
          />
        ) : (
          <Input
            id={field.name}
            type="text"
            disabled={isReadOnly}
            value={(value as string | number) ?? ""}
            onChange={handleTextChange}
            placeholder={placeholderText}
            title={error || undefined}
            className={cn(
              "h-7 rounded text-xs bg-background border-border/80",
              error && "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
              isReadOnly &&
                "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
              inputWidth,
            )}
          />
        )}
      </div>
    </div>
  );
}
