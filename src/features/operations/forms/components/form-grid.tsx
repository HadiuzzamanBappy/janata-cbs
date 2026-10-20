"use client";

import { FormRenderer } from "@/features/form-engine";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import type { CompiledFormSpec } from "@/lib/data-schemas";

export interface FormGridProps {
  presentation: CompiledFormSpec["presentation"];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

export function FormGrid({
  presentation,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: FormGridProps) {
  return (
    <FormRenderer
      presentation={presentation}
      values={values}
      onChange={onChange}
      errors={errors}
      disabled={disabled}
      mode={mode}
    />
  );
}
