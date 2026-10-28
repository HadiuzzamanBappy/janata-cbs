"use client";

import { FormRenderer } from "@/features/form-engine";
import type { CompiledFormSpec } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";

export interface FormGridProps {
  presentation?: CompiledFormSpec["frmElements"];
  frmElements?: CompiledFormSpec["frmElements"];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

export function FormGrid({
  presentation,
  frmElements,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
}: FormGridProps) {
  return (
    <FormRenderer
      frmElements={frmElements || presentation}
      values={values}
      onChange={onChange}
      errors={errors}
      disabled={disabled}
      mode={mode}
    />
  );
}
