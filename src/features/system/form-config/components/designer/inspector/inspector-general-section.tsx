"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { InspectorRow } from "./inspector-row";

const WIDTH_PRESETS = [
  { label: "120", value: 120, title: "XS (120px)" },
  { label: "180", value: 180, title: "SM (180px)" },
  { label: "280", value: 280, title: "MD (280px)" },
  { label: "450", value: 450, title: "LG (450px)" },
  { label: "600", value: 600, title: "XL (600px)" },
  { label: "FULL", value: 1000, title: "Full Row (1000px)" },
] as const;

export interface InspectorGeneralSectionProps {
  selectedField: FormElement;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

export function InspectorGeneralSection({
  selectedField,
  onUpdateField,
  disabled,
}: InspectorGeneralSectionProps) {
  return (
    <div className="space-y-3 pt-1">
      {/* Display Label */}
      <InspectorRow
        label="Display Label"
        required
        description="User-facing label rendered on form scanlines."
      >
        <Input
          disabled={disabled}
          value={selectedField.LABEL || ""}
          onChange={(e) => onUpdateField({ LABEL: e.target.value })}
          className="h-7 text-xs bg-background"
          placeholder="Field label"
        />
      </InspectorRow>

      {/* Display Width: Numerical Presets or Custom Pixels */}
      <InspectorRow
        label="Display Width"
        description="Field display width in pixels (120, 180, 280, 450, 600, 1000) or custom px."
      >
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 flex-1 flex-wrap">
            {WIDTH_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                title={preset.title}
                variant={selectedField.WIDTH === preset.value ? "default" : "outline"}
                size="sm"
                disabled={disabled || selectedField.TYPE === "Date"}
                onClick={() => onUpdateField({ WIDTH: preset.value })}
                className="h-6 px-1.5 text-[10px] rounded flex-1 uppercase font-mono"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 w-20 shrink-0">
            <Input
              type="number"
              placeholder="px"
              disabled={disabled || selectedField.TYPE === "Date"}
              value={typeof selectedField.WIDTH === "number" ? selectedField.WIDTH : ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                onUpdateField({ WIDTH: val });
              }}
              className="h-6 text-[10px] font-mono px-1.5 bg-background text-right"
            />
            <span className="text-[10px] text-muted-foreground font-mono">px</span>
          </div>
        </div>
      </InspectorRow>

      {/* Constraints: Required & Readonly */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
        <label
          htmlFor={`field-req-${selectedField.SN}`}
          className={cn(
            "flex items-center gap-2 select-none",
            disabled ? "cursor-default opacity-85" : "cursor-pointer",
          )}
        >
          <Checkbox
            id={`field-req-${selectedField.SN}`}
            checked={Boolean(selectedField.REQUIRED)}
            disabled={disabled}
            onCheckedChange={(val: boolean) => onUpdateField({ REQUIRED: Boolean(val) })}
            className="rounded"
          />
          <span className="text-xs text-foreground font-medium">Required</span>
        </label>

        <label
          htmlFor={`field-dis-${selectedField.SN}`}
          className={cn(
            "flex items-center gap-2 select-none",
            disabled ? "cursor-default opacity-85" : "cursor-pointer",
          )}
        >
          <Checkbox
            id={`field-dis-${selectedField.SN}`}
            checked={Boolean(selectedField.DISABLED)}
            disabled={disabled}
            onCheckedChange={(val: boolean) => onUpdateField({ DISABLED: Boolean(val) })}
            className="rounded"
          />
          <span className="text-xs text-muted-foreground font-medium">Disabled</span>
        </label>
      </div>

      {/* Enrich Text (Guidance / Tooltip) */}
      <InspectorRow
        label="Enrich Text (Placeholder)"
        description="Contextual guidance shown on scanline or placeholder."
      >
        <Input
          disabled={disabled}
          placeholder="Guidance or placeholder..."
          value={selectedField.ENRICHTEXT || ""}
          onChange={(e) => onUpdateField({ ENRICHTEXT: e.target.value })}
          className="h-7 text-xs bg-background"
        />
      </InspectorRow>

      {/* Default Value */}
      <InspectorRow
        label="Default Value"
        description="Pre-filled value populated when creating new records."
      >
        <Input
          disabled={disabled}
          value={String(selectedField.DEFAULTVALUE || "")}
          onChange={(e) => onUpdateField({ DEFAULTVALUE: e.target.value })}
          className="h-7 text-xs bg-background font-mono"
        />
      </InspectorRow>

      {/* Reactive ON_CHANGE Rule */}
      <InspectorRow
        label="On Change Rule"
        description="Sync or transform another field when this field value changes."
      >
        <div className="space-y-1.5 pt-0.5">
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              disabled={disabled}
              placeholder="Target field (e.g. IDPATTERN)"
              value={selectedField.ON_CHANGE?.target || ""}
              onChange={(e) => {
                const target = e.target.value.trim();
                onUpdateField({
                  ON_CHANGE: target
                    ? {
                        target,
                        action: selectedField.ON_CHANGE?.action || "copy",
                        delimiter: selectedField.ON_CHANGE?.delimiter || "#",
                      }
                    : undefined,
                });
              }}
              className="h-6 text-[11px] bg-background font-mono px-1.5"
            />
            <select
              disabled={disabled || !selectedField.ON_CHANGE?.target}
              value={selectedField.ON_CHANGE?.action || "copy"}
              onChange={(e) => {
                if (selectedField.ON_CHANGE?.target) {
                  onUpdateField({
                    ON_CHANGE: {
                      ...selectedField.ON_CHANGE,
                      action: e.target.value as
                        | "join"
                        | "copy"
                        | "clear"
                        | "uppercase"
                        | "lowercase",
                    },
                  });
                }
              }}
              className="h-6 text-[11px] bg-background border border-input rounded px-1 text-foreground"
            >
              <option value="copy">Copy Value</option>
              <option value="join">Join Array (#)</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="clear">Clear Target</option>
            </select>
          </div>
          {selectedField.ON_CHANGE?.action === "join" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-mono">Delimiter:</span>
              <Input
                disabled={disabled}
                placeholder="#"
                value={selectedField.ON_CHANGE?.delimiter || "#"}
                onChange={(e) => {
                  if (selectedField.ON_CHANGE?.target) {
                    onUpdateField({
                      ON_CHANGE: {
                        ...selectedField.ON_CHANGE,
                        delimiter: e.target.value || "#",
                      },
                    });
                  }
                }}
                className="h-5 w-14 text-[10px] font-mono px-1 bg-background text-center"
              />
            </div>
          )}
        </div>
      </InspectorRow>

      {/* Cross-Field Validation Rule (e.g. Password Confirmation) */}
      <InspectorRow
        label="Validation Match"
        description="Verify this field equals another field (e.g. Confirm Password)."
      >
        <div className="space-y-1.5 pt-0.5">
          <Input
            disabled={disabled}
            placeholder="Field to match (e.g. NEW_PASSWORD)"
            value={selectedField.VALIDATION?.matches || ""}
            onChange={(e) => {
              const matches = e.target.value.trim();
              onUpdateField({
                VALIDATION: matches
                  ? {
                      ...selectedField.VALIDATION,
                      matches,
                      message: selectedField.VALIDATION?.message || "Fields do not match",
                    }
                  : undefined,
              });
            }}
            className="h-6 text-[11px] bg-background font-mono px-1.5"
          />
          {selectedField.VALIDATION?.matches && (
            <Input
              disabled={disabled}
              placeholder="Custom error message"
              value={selectedField.VALIDATION?.message || ""}
              onChange={(e) => {
                onUpdateField({
                  VALIDATION: {
                    ...selectedField.VALIDATION,
                    message: e.target.value,
                  },
                });
              }}
              className="h-6 text-[11px] bg-background px-1.5"
            />
          )}
        </div>
      </InspectorRow>
    </div>
  );
}
