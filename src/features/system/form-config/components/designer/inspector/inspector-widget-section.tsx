"use client";

import { Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPATIBLE_WIDGETS_FOR_TYPE,
  type FormElement,
  type FormWidgetType,
  isWidgetCompatibleWithType,
} from "@/lib/data-schemas/form-engine-schema";
import { InspectorLookupConfig } from "./inspector-lookup-config";
import { InspectorRow } from "./inspector-row";

export interface InspectorWidgetSectionProps {
  selectedField: FormElement;
  baseType: "TEXT" | "NUMBER" | "DATE";
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

const WIDGET_METADATA: Record<FormWidgetType, { label: string; description: string }> = {
  text: {
    label: "Text (Standard Input)",
    description: "Single-line alphanumeric input with casing/masking.",
  },
  textarea: {
    label: "Textarea (Multi-line)",
    description: "Multi-line narrative text box.",
  },
  number: {
    label: "Number (Standard Numeric)",
    description: "Integer or standard numeric counter/input.",
  },
  amount: {
    label: "Amount (Financial Currency)",
    description: "Monetary amount with currency prefix & decimals.",
  },
  rate: {
    label: "Rate (Interest / Exchange)",
    description: "Financial rate or percentage with precision decimals.",
  },
  date: {
    label: "Date Picker (CBS Calendar)",
    description: "CBS calendar date selector.",
  },
  datetime: {
    label: "Date & Time Picker (CBS Timestamp)",
    description: "CBS calendar date and time timestamp selector.",
  },
  select: {
    label: "Select / Dropdown (Lookup)",
    description: "Model lookup or static key-value options.",
  },
  "radio-group": {
    label: "Radio Group (Option Pills)",
    description: "Inline radio options.",
  },
  segmented: {
    label: "Segmented Control",
    description: "Horizontal segment toggle selector.",
  },
  checkbox: {
    label: "Checkbox (Checkmark / Yes-No)",
    description: "CBS standard checkbox with status indicator.",
  },
  "checkbox-group": {
    label: "Checkbox Group",
    description: "Multiple selectable checkboxes.",
  },
  switch: {
    label: "Switch (Boolean Toggle)",
    description: "On/Off boolean switcher.",
  },
};

export function InspectorWidgetSection({
  selectedField,
  baseType,
  onUpdateField,
  disabled,
}: InspectorWidgetSectionProps) {
  // Physical Property Type from model config, fallback based on baseType
  const physicalType =
    selectedField.TYPE ||
    (baseType === "NUMBER" ? "Number" : baseType === "DATE" ? "Date" : "Text");

  // Authorized widgets from the canonical platform constraint matrix
  const allowedWidgets = COMPATIBLE_WIDGETS_FOR_TYPE[physicalType] || ["text"];

  const currentWidget = isWidgetCompatibleWithType(physicalType, selectedField.WIDGET || "text")
    ? selectedField.WIDGET || "text"
    : allowedWidgets[0] || "text";

  return (
    <div className="p-2.5 rounded-md border border-primary/20 bg-primary/5 space-y-3 pt-2">
      <div className="flex items-center justify-between border-b border-primary/20 pb-1.5">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Type className="size-3" />
          <span>UI Presentation Widget</span>
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          Physical: {physicalType}
        </span>
      </div>

      <InspectorRow
        label="Selected Widget"
        description={`Presentation widget on the banking form constrained by physical ${physicalType} schema.`}
      >
        <Select
          disabled={disabled}
          value={currentWidget}
          onValueChange={(val: string | null) => {
            if (!val || !isWidgetCompatibleWithType(physicalType, val)) return;
            onUpdateField({ WIDGET: val as FormWidgetType });
          }}
        >
          <SelectTrigger className="w-full h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs">
            {allowedWidgets.map((widgetKey) => {
              const meta = WIDGET_METADATA[widgetKey] || {
                label: widgetKey,
                description: "",
              };
              return (
                <SelectItem key={widgetKey} value={widgetKey} className="text-xs font-medium">
                  {meta.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </InspectorRow>

      {/* Dynamic Type Config: Text / Masking */}
      {(currentWidget === "text" || currentWidget === "textarea") && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <InspectorRow label="Text Transform" description="Enforce casing on user input">
            <Select
              disabled={disabled}
              value={selectedField.TEXT_CONFIG?.textTransform || "uppercase"}
              onValueChange={(val: string | null) =>
                onUpdateField({
                  TEXT_CONFIG: {
                    ...selectedField.TEXT_CONFIG,
                    autoTrim: selectedField.TEXT_CONFIG?.autoTrim ?? true,
                    maskPattern: selectedField.TEXT_CONFIG?.maskPattern || "",
                    textTransform: (val || "uppercase") as "uppercase" | "lowercase" | "none",
                  },
                })
              }
            >
              <SelectTrigger className="w-full h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="uppercase">UPPERCASE (CBS Standard)</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="none">None (Standard)</SelectItem>
              </SelectContent>
            </Select>
          </InspectorRow>
          <InspectorRow label="Input Mask Pattern" description="e.g. 9999-9999-9999, SWIFT">
            <Input
              disabled={disabled}
              placeholder="e.g. 9999-9999-9999"
              value={selectedField.TEXT_CONFIG?.maskPattern || ""}
              onChange={(e) =>
                onUpdateField({
                  TEXT_CONFIG: {
                    ...selectedField.TEXT_CONFIG,
                    textTransform: selectedField.TEXT_CONFIG?.textTransform || "uppercase",
                    autoTrim: selectedField.TEXT_CONFIG?.autoTrim ?? true,
                    maskPattern: e.target.value,
                  },
                })
              }
              className="h-7 text-xs bg-background font-mono"
            />
          </InspectorRow>
        </div>
      )}

      {/* Dynamic Type Config: Boolean & Checkbox */}
      {(currentWidget === "checkbox" || currentWidget === "switch") && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorRow label="True Value" description="Value stored in DB when active">
              <Input
                disabled={disabled}
                value={selectedField.BOOLEAN_CONFIG?.trueValue ?? "Y"}
                onChange={(e) =>
                  onUpdateField({
                    BOOLEAN_CONFIG: {
                      ...selectedField.BOOLEAN_CONFIG,
                      widgetStyle: (currentWidget as "switch" | "checkbox") || "checkbox",
                      trueValue: e.target.value,
                      falseValue: selectedField.BOOLEAN_CONFIG?.falseValue ?? "N",
                      activeLabel: selectedField.BOOLEAN_CONFIG?.activeLabel ?? "Yes",
                      inactiveLabel: selectedField.BOOLEAN_CONFIG?.inactiveLabel ?? "No",
                    },
                  })
                }
                className="h-6 text-[10px] bg-background font-mono"
              />
            </InspectorRow>
            <InspectorRow label="False Value" description="Value stored in DB when inactive">
              <Input
                disabled={disabled}
                value={selectedField.BOOLEAN_CONFIG?.falseValue ?? "N"}
                onChange={(e) =>
                  onUpdateField({
                    BOOLEAN_CONFIG: {
                      ...selectedField.BOOLEAN_CONFIG,
                      widgetStyle: (currentWidget as "switch" | "checkbox") || "checkbox",
                      trueValue: selectedField.BOOLEAN_CONFIG?.trueValue ?? "Y",
                      falseValue: e.target.value,
                      activeLabel: selectedField.BOOLEAN_CONFIG?.activeLabel ?? "Yes",
                      inactiveLabel: selectedField.BOOLEAN_CONFIG?.inactiveLabel ?? "No",
                    },
                  })
                }
                className="h-6 text-[10px] bg-background font-mono"
              />
            </InspectorRow>
          </div>
        </div>
      )}

      {/* Dynamic Type Config: Amount & Currency */}
      {(currentWidget === "amount" || currentWidget === "number") && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorRow label="Decimals" description="Decimal precision">
              <Input
                type="number"
                disabled={disabled}
                value={
                  selectedField.NUMBER_CONFIG?.decimals ?? (currentWidget === "amount" ? 2 : 0)
                }
                onChange={(e) =>
                  onUpdateField({
                    NUMBER_CONFIG: {
                      ...selectedField.NUMBER_CONFIG,
                      isCurrency: currentWidget === "amount",
                      currencyCode: selectedField.NUMBER_CONFIG?.currencyCode ?? "",
                      allowNegative: selectedField.NUMBER_CONFIG?.allowNegative ?? false,
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
                value={selectedField.NUMBER_CONFIG?.currencyCode ?? ""}
                onChange={(e) =>
                  onUpdateField({
                    NUMBER_CONFIG: {
                      ...selectedField.NUMBER_CONFIG,
                      isCurrency: true,
                      decimals: selectedField.NUMBER_CONFIG?.decimals ?? 2,
                      allowNegative: selectedField.NUMBER_CONFIG?.allowNegative ?? false,
                      currencyCode: e.target.value.toUpperCase(),
                    },
                  })
                }
                className="h-6 text-[10px] bg-background font-mono uppercase"
              />
            </InspectorRow>
          </div>
        </div>
      )}

      {/* Dynamic Type Config: Lookup / Options */}
      {(currentWidget === "select" ||
        currentWidget === "radio-group" ||
        currentWidget === "segmented" ||
        currentWidget === "checkbox-group") && (
        <InspectorLookupConfig
          selectedField={selectedField}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
      )}
    </div>
  );
}
