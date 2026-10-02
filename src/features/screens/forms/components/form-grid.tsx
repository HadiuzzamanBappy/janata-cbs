"use client";

import type { FormSchema } from "@/lib/schemas";
import { FieldFactory } from "./field-factory";

export interface FormGridProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function FormGrid({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
}: FormGridProps) {
  if (!schema.fields || schema.fields.length === 0) {
    return (
      <div className="p-4 text-xs text-muted-foreground text-center border border-dashed rounded-md">
        No form fields defined for schema &quot;{schema.title}&quot;.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-3 p-3 bg-card rounded-lg border border-border/60 shadow-xs">
      {schema.fields.map((field) => (
        <FieldFactory
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={onChange}
          error={errors[field.name]}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
