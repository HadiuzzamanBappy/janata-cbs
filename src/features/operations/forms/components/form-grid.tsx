import { STATIC_FORM_CONFIGS } from "@fixtures";
import * as React from "react";
import { FormRenderer } from "@/features/form-engine";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import type { FormSchema } from "@/lib/data-schemas";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";

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
  // 1. Check if a rich custom visual presentation exists in STATIC_FORM_CONFIGS or by screen code
  const customConfig: FormConfigRecord | undefined =
    STATIC_FORM_CONFIGS[schema.code] ||
    STATIC_FORM_CONFIGS[`FC.${schema.code}`] ||
    Object.values(STATIC_FORM_CONFIGS as Record<string, FormConfigRecord>).find(
      (cfg) => cfg.targetModel === schema.code,
    );

  const presentation = React.useMemo(() => {
    if (customConfig?.presentation) {
      return customConfig.presentation;
    }

    // 2. Default Dynamic 12-Column Layout generated from GMC schema
    const defaultSection: FormSection = {
      id: "sec_default",
      title: schema.title || schema.code || "Transaction Attributes",
      description: "Default layout",
      type: "standard",
      zone: "standard",
      layoutStyle: "card",
      columns: 2,
      collapsible: false,
      isCollapsed: false,
      fields: (schema.fields || []).map((f) => ({
        id: `f_${f.name}`,
        fieldKey: f.name,
        label: f.label || f.name,
        widget:
          f.type === "select"
            ? "select"
            : f.type === "date"
              ? "date"
              : f.type === "number"
                ? "number"
                : "text",
        colSpan: f.width === "xs" ? 3 : f.width === "sm" ? 4 : f.width === "lg" ? 12 : 6,
        required: f.required,
        readOnly: f.readOnly,
        options: f.options,
        placeholder: f.placeholder,
      })),
    };

    return {
      archetype: "scanline" as const,
      density: "compact" as const,
      steps: [],
      sections: [defaultSection],
    };
  }, [schema, customConfig]);

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
