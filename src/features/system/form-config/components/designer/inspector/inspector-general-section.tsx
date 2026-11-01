"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-config-schema";
import { PROPERTY_WIDTHS, type PropertyWidth } from "@/lib/data-schemas/model-config-schema";
import { InspectorRow } from "./inspector-row";

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

      {/* Display Width Semantic Tokens (XS to FULL) */}
      <InspectorRow
        label="Display Width"
        description="Semantic field width token scale: XS, SM, MD, LG, XL, XXL, or FULL."
      >
        <div className="flex items-center gap-1 flex-wrap">
          {PROPERTY_WIDTHS.map((w) => (
            <Button
              key={w}
              type="button"
              variant={
                String(selectedField.WIDTH || "md").toLowerCase() === w ? "default" : "outline"
              }
              size="sm"
              disabled={disabled || selectedField.TYPE === "Date"}
              onClick={() => onUpdateField({ WIDTH: w as PropertyWidth })}
              className="h-6 px-1.5 text-[10px] rounded flex-1 uppercase font-mono"
            >
              {w}
            </Button>
          ))}
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
    </div>
  );
}
