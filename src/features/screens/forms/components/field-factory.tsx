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
import { cn } from "@/lib/utils";
import type { FormField } from "../types";

export interface FieldFactoryProps {
  field: FormField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldFactory({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: FieldFactoryProps) {
  const isReadOnly = disabled || field.readOnly;

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
      // Parse YYYY-MM-DD as local midnight to avoid UTC parsing offsets
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

  return (
    <div className="col-span-12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {/* Horizontal Left Label (Required Sign) */}
      <div className="w-full sm:w-64 shrink-0 flex items-center gap-1">
        <Label
          htmlFor={field.name}
          className="text-xs font-medium text-foreground flex items-center gap-1 leading-none select-none"
        >
          {field.label}
          {field.required && <span className="text-destructive font-bold text-xs">*</span>}
        </Label>
      </div>

      {/* Horizontal Right Input Field (With Colon Separator Right Before Input) */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="hidden sm:inline text-muted-foreground/60 font-mono text-xs shrink-0">
          :
        </span>
        <div className="flex-1 min-w-0 space-y-1">
          {field.type === "select" ? (
            <Select
              disabled={isReadOnly}
              value={String(value ?? "")}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger
                id={field.name}
                className={cn(
                  "h-8 text-xs md:text-xs",
                  field.width === "lg"
                    ? "w-full max-w-2xl"
                    : field.width === "md"
                      ? "w-full max-w-md"
                      : "w-full max-w-xs",
                )}
              >
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent className="z-50">
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "date" ? (
            <DatePicker
              disabled={isReadOnly}
              date={parseDateValue(value)}
              onSelect={handleDateChange}
              placeholder={`Select ${field.label}`}
              className={cn(
                "h-8 text-xs md:text-xs",
                field.width === "lg"
                  ? "w-full max-w-2xl"
                  : field.width === "md"
                    ? "w-full max-w-md"
                    : "w-full max-w-xs",
              )}
            />
          ) : field.type === "number" ? (
            <Input
              id={field.name}
              type="number"
              disabled={isReadOnly}
              value={(value as string | number) ?? ""}
              onChange={handleNumberChange}
              placeholder={`Enter ${field.label}`}
              className={cn(
                "h-8 text-xs md:text-xs",
                field.width === "lg"
                  ? "w-full max-w-2xl"
                  : field.width === "md"
                    ? "w-full max-w-md"
                    : "w-full max-w-xs",
              )}
            />
          ) : (
            <Input
              id={field.name}
              type="text"
              disabled={isReadOnly}
              value={(value as string | number) ?? ""}
              onChange={handleTextChange}
              placeholder={`Enter ${field.label}`}
              className={cn(
                "h-8 text-xs md:text-xs",
                field.width === "lg"
                  ? "w-full max-w-2xl"
                  : field.width === "md"
                    ? "w-full max-w-md"
                    : "w-full max-w-xs",
              )}
            />
          )}

          {error && (
            <p className="text-[10px] font-medium text-destructive leading-tight">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
