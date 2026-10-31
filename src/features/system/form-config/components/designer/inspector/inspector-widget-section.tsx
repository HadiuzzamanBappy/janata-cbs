"use client";

import { Type } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core-utils";
import type { FormElement, FormWidgetType } from "@/lib/data-schemas/form-config-schema";
import { InspectorLookupConfig } from "./inspector-lookup-config";
import { InspectorRow } from "./inspector-row";

export interface InspectorWidgetSectionProps {
  selectedField: FormElement;
  baseType: "TEXT" | "NUMBER" | "DATE";
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

export function InspectorWidgetSection({
  selectedField,
  baseType,
  onUpdateField,
  disabled,
}: InspectorWidgetSectionProps) {
  const ALL_SYSTEM_WIDGETS: Array<{
    value: FormWidgetType;
    label: string;
    description: string;
    supportedBases: Array<"TEXT" | "NUMBER" | "DATE">;
  }> = React.useMemo(
    () => [
      {
        value: "text",
        label: "Text (Standard Input)",
        description: "Single-line alphanumeric input with casing/masking.",
        supportedBases: ["TEXT"],
      },
      {
        value: "number",
        label: "Number (Standard Numeric)",
        description: "Integer or standard numeric counter/input.",
        supportedBases: ["NUMBER"],
      },
      {
        value: "amount",
        label: "Amount (Financial Currency)",
        description: "Monetary amount with currency prefix & decimals.",
        supportedBases: ["NUMBER"],
      },
      {
        value: "date",
        label: "Date Picker (CBS Calendar)",
        description: "CBS calendar date selector.",
        supportedBases: ["DATE"],
      },
      {
        value: "select",
        label: "Select / Dropdown (Lookup)",
        description: "Model lookup or static key-value options.",
        supportedBases: ["TEXT", "NUMBER"],
      },
      {
        value: "radio-group",
        label: "Radio Group (Option Pills)",
        description: "Inline radio options.",
        supportedBases: ["TEXT", "NUMBER"],
      },
      {
        value: "switch",
        label: "Switch (Boolean Toggle)",
        description: "On/Off boolean switcher.",
        supportedBases: ["TEXT", "NUMBER"],
      },
      {
        value: "checkbox",
        label: "Checkbox (Checkmark)",
        description: "Single or multi-select checkbox item.",
        supportedBases: ["TEXT", "NUMBER"],
      },
    ],
    [],
  );

  const widgetSelectItems = React.useMemo(() => {
    return ALL_SYSTEM_WIDGETS.map((w) => ({
      ...w,
      isEligible: w.supportedBases.includes(baseType),
    }));
  }, [ALL_SYSTEM_WIDGETS, baseType]);

  return (
    <div className="p-2.5 rounded-md border border-primary/20 bg-primary/5 space-y-3 pt-2">
      <div className="flex items-center justify-between border-b border-primary/20 pb-1.5">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Type className="size-3" />
          <span>UI Presentation Widget</span>
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">Eligible for {baseType}</span>
      </div>

      <InspectorRow
        label="Selected Widget"
        description={`Presentation widget on the banking form. Types incompatible with physical ${baseType} are disabled.`}
      >
        <Select
          disabled={disabled}
          value={
            widgetSelectItems.some((w) => w.isEligible && w.value === selectedField.WIDGET)
              ? selectedField.WIDGET
              : widgetSelectItems.find((w) => w.isEligible)?.value || "text"
          }
          onValueChange={(val: string | null) => {
            const chosen = widgetSelectItems.find((w) => w.value === val);
            if (!chosen?.isEligible) return;

            const widget = chosen.value;
            let type = selectedField.TYPE;
            if (widget === "amount" || widget === "number") type = "Number";
            else if (widget === "date") type = "Date";
            else if (widget === "select" || widget === "radio-group") type = "Select";
            else if (widget === "switch" || widget === "checkbox") type = "Boolean";
            else type = "Text";

            onUpdateField({
              WIDGET: widget,
              TYPE: type,
            });
          }}
        >
          <SelectTrigger className="w-full h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs">
            {widgetSelectItems.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                disabled={!item.isEligible}
                className={cn(
                  "flex items-center justify-between text-xs",
                  !item.isEligible && "opacity-45 cursor-not-allowed text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn(item.isEligible ? "font-medium" : "line-through")}>
                    {item.label}
                  </span>
                </div>
                {!item.isEligible && (
                  <span className="text-[9px] font-mono text-muted-foreground/70 uppercase shrink-0">
                    (Req {item.supportedBases.join("/")})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InspectorRow>

      {/* Dynamic Type Config: Text / Masking */}
      {baseType === "TEXT" && (selectedField.WIDGET === "text" || !selectedField.WIDGET) && (
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

      {/* Dynamic Type Config: Boolean & Switch */}
      {(selectedField.WIDGET === "switch" || selectedField.WIDGET === "checkbox") && (
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
                      widgetStyle: (selectedField.WIDGET as "switch" | "checkbox") || "switch",
                      trueValue: e.target.value,
                      falseValue: selectedField.BOOLEAN_CONFIG?.falseValue ?? "N",
                      activeLabel: selectedField.BOOLEAN_CONFIG?.activeLabel ?? "Enabled",
                      inactiveLabel: selectedField.BOOLEAN_CONFIG?.inactiveLabel ?? "Disabled",
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
                      widgetStyle: (selectedField.WIDGET as "switch" | "checkbox") || "switch",
                      trueValue: selectedField.BOOLEAN_CONFIG?.trueValue ?? "Y",
                      falseValue: e.target.value,
                      activeLabel: selectedField.BOOLEAN_CONFIG?.activeLabel ?? "Enabled",
                      inactiveLabel: selectedField.BOOLEAN_CONFIG?.inactiveLabel ?? "Disabled",
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
      {(selectedField.WIDGET === "amount" ||
        (baseType === "NUMBER" && selectedField.WIDGET === "number")) && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="grid grid-cols-2 gap-1.5">
            <InspectorRow label="Decimals" description="Decimal precision">
              <Input
                type="number"
                disabled={disabled}
                value={
                  selectedField.NUMBER_CONFIG?.decimals ??
                  (selectedField.WIDGET === "amount" ? 2 : 0)
                }
                onChange={(e) =>
                  onUpdateField({
                    NUMBER_CONFIG: {
                      ...selectedField.NUMBER_CONFIG,
                      isCurrency: selectedField.WIDGET === "amount",
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
      {(selectedField.WIDGET === "select" || selectedField.WIDGET === "radio-group") && (
        <InspectorLookupConfig
          selectedField={selectedField}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
      )}
    </div>
  );
}
