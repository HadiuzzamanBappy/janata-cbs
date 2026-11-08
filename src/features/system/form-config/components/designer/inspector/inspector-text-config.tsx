"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { InspectorRow } from "./inspector-row";

export interface InspectorTextConfigProps {
  selectedField: FormElement;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

/**
 * Modular Sub-Inspector for Text/Textarea widget configuration.
 * Handles text transform casing and input mask pattern.
 */
export function InspectorTextConfig({
  selectedField,
  onUpdateField,
  disabled,
}: InspectorTextConfigProps) {
  return (
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
  );
}
