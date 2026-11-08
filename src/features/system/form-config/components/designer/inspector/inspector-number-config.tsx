"use client";

import { Input } from "@/components/ui/input";
import type { FormElement, FormWidgetType } from "@/lib/data-schemas/form-engine-schema";
import { InspectorRow } from "./inspector-row";

export interface InspectorNumberConfigProps {
  selectedField: FormElement;
  currentWidget: FormWidgetType;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

/**
 * Modular Sub-Inspector for Number/Amount/Rate widget configuration.
 * Handles decimal precision and financial currency prefix.
 */
export function InspectorNumberConfig({
  selectedField,
  currentWidget,
  onUpdateField,
  disabled,
}: InspectorNumberConfigProps) {
  const numberConfig = selectedField.NUMBER_CONFIG;

  return (
    <div className="space-y-2 pt-1 border-t border-border/50">
      <div className="grid grid-cols-2 gap-1.5">
        <InspectorRow label="Decimals" description="Decimal precision">
          <Input
            type="number"
            disabled={disabled}
            value={numberConfig?.decimals ?? (currentWidget === "amount" ? 2 : 0)}
            onChange={(e) =>
              onUpdateField({
                NUMBER_CONFIG: {
                  ...numberConfig,
                  isCurrency: currentWidget === "amount",
                  currencyCode: numberConfig?.currencyCode ?? "",
                  allowNegative: numberConfig?.allowNegative ?? false,
                  decimals: Number(e.target.value) || 0,
                },
              })
            }
            className="h-6 text-[10px] bg-background font-mono"
          />
        </InspectorRow>

        <InspectorRow label="Currency Prefix" description="e.g. BDT, USD">
          <Input
            disabled={disabled}
            placeholder="e.g. BDT"
            value={numberConfig?.currencyCode ?? ""}
            onChange={(e) =>
              onUpdateField({
                NUMBER_CONFIG: {
                  ...numberConfig,
                  isCurrency: true,
                  decimals: numberConfig?.decimals ?? 2,
                  allowNegative: numberConfig?.allowNegative ?? false,
                  currencyCode: e.target.value.toUpperCase(),
                },
              })
            }
            className="h-6 text-[10px] bg-background font-mono uppercase"
          />
        </InspectorRow>
      </div>
    </div>
  );
}
