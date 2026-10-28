import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { FieldAtom } from "../field-atom";
import { UnifiedFieldFactory } from "../field-factory";
import { getFieldColSpanClass, getGridColsClass } from "./section-utils";

export interface StandardGridSectionProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  numCols: number;
  hasKernel: boolean;
}

export function StandardGridSection({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  numCols,
  hasKernel,
}: StandardGridSectionProps) {
  return (
    <div className={cn("grid gap-x-4 gap-y-2.5 text-xs pt-1", getGridColsClass(numCols))}>
      {section.fields.map((field) => (
        <div key={field.SN} className={getFieldColSpanClass(numCols, field.WIDTH)}>
          {hasKernel ? (
            <FieldAtom field={field} disabled={disabled} mode={mode} />
          ) : (
            <UnifiedFieldFactory
              field={field}
              value={values[field.NAME]}
              onChange={onChange}
              error={errors[field.NAME]}
              disabled={disabled}
              mode={mode}
            />
          )}
        </div>
      ))}
    </div>
  );
}
