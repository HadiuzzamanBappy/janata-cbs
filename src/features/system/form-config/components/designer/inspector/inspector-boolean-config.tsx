"use client";

import { Input } from "@/components/ui/input";
import type { FormElement, FormWidgetType } from "@/lib/data-schemas/form-engine-schema";
import { InspectorRow } from "./inspector-row";

export interface InspectorBooleanConfigProps {
  selectedField: FormElement;
  currentWidget: FormWidgetType;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

/**
 * Modular Sub-Inspector for Boolean/Switch/Checkbox widget configuration.
 * Handles trueValue and falseValue representation stored in core database.
 */
export function InspectorBooleanConfig({
  selectedField,
  currentWidget,
  onUpdateField,
  disabled,
}: InspectorBooleanConfigProps) {
  const booleanConfig = selectedField.BOOLEAN_CONFIG;

  return (
    <div className="space-y-2 pt-1 border-t border-border/50">
      <div className="grid grid-cols-2 gap-1.5">
        <InspectorRow label="True Value" description="Value stored in DB when active">
          <Input
            disabled={disabled}
            value={booleanConfig?.trueValue ?? "Y"}
            onChange={(e) =>
              onUpdateField({
                BOOLEAN_CONFIG: {
                  ...booleanConfig,
                  widgetStyle: (currentWidget as "switch" | "checkbox") || "checkbox",
                  trueValue: e.target.value,
                  falseValue: booleanConfig?.falseValue ?? "N",
                  activeLabel: booleanConfig?.activeLabel ?? "Yes",
                  inactiveLabel: booleanConfig?.inactiveLabel ?? "No",
                },
              })
            }
            className="h-6 text-[10px] bg-background font-mono"
          />
        </InspectorRow>

        <InspectorRow label="False Value" description="Value stored in DB when inactive">
          <Input
            disabled={disabled}
            value={booleanConfig?.falseValue ?? "N"}
            onChange={(e) =>
              onUpdateField({
                BOOLEAN_CONFIG: {
                  ...booleanConfig,
                  widgetStyle: (currentWidget as "switch" | "checkbox") || "checkbox",
                  trueValue: booleanConfig?.trueValue ?? "Y",
                  falseValue: e.target.value,
                  activeLabel: booleanConfig?.activeLabel ?? "Yes",
                  inactiveLabel: booleanConfig?.inactiveLabel ?? "No",
                },
              })
            }
            className="h-6 text-[10px] bg-background font-mono"
          />
        </InspectorRow>
      </div>
    </div>
  );
}
