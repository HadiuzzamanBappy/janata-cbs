"use client";

import * as React from "react";
import { type FormField } from "@/lib/schema/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

export interface FieldFactoryProps {
  field: FormField;
  value: any;
  onChange: (name: string, value: any) => void;
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

  const widthClass =
    field.width === "xs"
      ? "col-span-12 sm:col-span-3"
      : field.width === "sm"
      ? "col-span-12 sm:col-span-4"
      : field.width === "lg"
      ? "col-span-12 sm:col-span-12"
      : "col-span-12 sm:col-span-6";

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.name, e.target.value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(field.name, val === "" ? "" : Number(val));
  };

  const handleDateChange = (selectedDate?: Date) => {
    onChange(field.name, selectedDate ? selectedDate.toISOString().split("T")[0] : "");
  };

  const handleSelectChange = (selectedValue: string | null) => {
    if (selectedValue !== null) {
      onChange(field.name, selectedValue);
    }
  };

  const parseDateValue = (val: any): Date | undefined => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  };

  return (
    <div className={cn("flex flex-col gap-1.5", widthClass)}>
      <Label htmlFor={field.name} className="text-xs font-medium flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-destructive font-bold">*</span>}
      </Label>

      {field.type === "select" ? (
        <Select
          disabled={isReadOnly}
          value={String(value ?? "")}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id={field.name} className="h-9 text-xs">
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
        />
      ) : field.type === "number" ? (
        <Input
          id={field.name}
          type="number"
          disabled={isReadOnly}
          value={value ?? ""}
          onChange={handleNumberChange}
          placeholder={`Enter ${field.label}`}
          className="h-9 text-xs"
        />
      ) : (
        <Input
          id={field.name}
          type="text"
          disabled={isReadOnly}
          value={value ?? ""}
          onChange={handleTextChange}
          placeholder={`Enter ${field.label}`}
          className="h-9 text-xs"
        />
      )}

      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}
