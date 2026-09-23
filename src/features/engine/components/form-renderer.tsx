"use client";

import type { FormSchema } from "../types";
import { FieldFactory } from "./field-factory";

export interface FormRendererProps {
  schema: FormSchema;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function FormRenderer({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
}: FormRendererProps) {
  if (!schema.fields || schema.fields.length === 0) {
    return (
      <div className="p-4 text-xs text-muted-foreground text-center border border-dashed rounded-md">
        No form fields defined for schema &quot;{schema.title}&quot;.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-background rounded-md border border-border/60">
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
