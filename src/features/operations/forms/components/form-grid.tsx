import type { CbsScreenMode } from "@/lib/cbs-screen";
import type { FormSchema } from "@/lib/schemas";
import { FieldFactory } from "./field-factory";

export interface FormGridProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

export function FormGrid({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: FormGridProps) {
  if (!schema.fields || schema.fields.length === 0) {
    return (
      <div className="p-4 text-xs text-muted-foreground text-center border border-dashed rounded-md">
        No form fields defined for schema &quot;{schema.title}&quot;.
      </div>
    );
  }

  // Group fields if they have an explicit group property or group into a primary card
  const title = schema.title || schema.code || "Transaction Details";

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="max-w-3xl space-y-3">
        {/* 1:1 System Screen Card Container */}
        <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
          {/* Card Header: 1:1 with Model Config & User Group */}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
            {title} &bull; General Attributes
          </div>

          {/* Form Fields: Stacked vertically with compact 8px gap */}
          <div className="space-y-2 text-xs">
            {schema.fields.map((field) => (
              <FieldFactory
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={onChange}
                error={errors[field.name]}
                disabled={disabled}
                mode={mode}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
