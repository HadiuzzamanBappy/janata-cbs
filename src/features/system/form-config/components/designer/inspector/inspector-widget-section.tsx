"use client";

import { Type } from "lucide-react";
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
import { InspectorBooleanConfig } from "./inspector-boolean-config";
import { InspectorLookupConfig } from "./inspector-lookup-config";
import { InspectorNumberConfig } from "./inspector-number-config";
import { InspectorRow } from "./inspector-row";
import { InspectorTextConfig } from "./inspector-text-config";

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

/**
 * Modular Presentation Widget Inspector.
 * Coordinates widget selection and delegates sub-configuration
 * to dedicated sub-inspectors (Text, Boolean, Number, Lookup).
 */
export function InspectorWidgetSection({
  selectedField,
  baseType,
  onUpdateField,
  disabled,
}: InspectorWidgetSectionProps) {
  const physicalType =
    selectedField.TYPE ||
    (baseType === "NUMBER" ? "Number" : baseType === "DATE" ? "Date" : "Text");

  const allowedWidgets = COMPATIBLE_WIDGETS_FOR_TYPE[physicalType] || ["text"];

  const currentWidget: FormWidgetType = isWidgetCompatibleWithType(
    physicalType,
    selectedField.WIDGET || "text",
  )
    ? (selectedField.WIDGET as FormWidgetType) || "text"
    : (allowedWidgets[0] as FormWidgetType) || "text";

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
        <InspectorTextConfig
          selectedField={selectedField}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
      )}

      {/* Dynamic Type Config: Boolean & Checkbox */}
      {(currentWidget === "checkbox" || currentWidget === "switch") && (
        <InspectorBooleanConfig
          selectedField={selectedField}
          currentWidget={currentWidget}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
      )}

      {/* Dynamic Type Config: Amount & Currency */}
      {(currentWidget === "amount" || currentWidget === "number" || currentWidget === "rate") && (
        <InspectorNumberConfig
          selectedField={selectedField}
          currentWidget={currentWidget}
          onUpdateField={onUpdateField}
          disabled={disabled}
        />
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
