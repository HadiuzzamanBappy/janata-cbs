"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core-utils";
import {
  type ModelProperty,
  PROPERTY_TYPES,
  type PropertyType,
  type ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";

interface McInspectorIdentitySectionProps {
  property: ModelProperty;
  isReadOnly: boolean;
  validationErrors?: ValidationErrorItem[];
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
}

export function McInspectorIdentitySection({
  property,
  isReadOnly,
  validationErrors = [],
  onUpdate,
}: McInspectorIdentitySectionProps) {
  const nameError = validationErrors.find(
    (e) => e.sn === property.sn && (e.fieldKey === "name" || e.fieldKey === "NAME"),
  );
  const labelError = validationErrors.find(
    (e) => e.sn === property.sn && (e.fieldKey === "label" || e.fieldKey === "LABEL"),
  );

  const handleTypeChange = (val: string | null) => {
    if (!val) return;
    const nextType = val as PropertyType;
    const patch: Partial<ModelProperty> = { type: nextType };
    if (nextType === "Boolean") {
      patch.length = 1;
      patch.mask = undefined;
      patch.pattern = undefined;
      if (typeof property.defaultValue !== "boolean") {
        patch.defaultValue = false;
      }
    } else if (nextType === "Date") {
      patch.length = 10;
      patch.pattern = undefined;
      if (!property.mask) {
        patch.mask = "YYYY-MM-DD";
      }
    } else if (nextType === "Number") {
      if (property.length === 1 || property.length === 10) {
        patch.length = 15;
      }
    } else if (nextType === "Text") {
      if (property.length === 1) {
        patch.length = 50;
      }
    }
    onUpdate(property.sn, patch);
  };

  return (
    <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" />
          <span>Fixed Base Properties</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-normal">
          Physical Column Specification
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {/* Field Name */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label
              className={cn(
                "w-28 shrink-0 text-xs font-medium select-none",
                nameError ? "text-destructive font-semibold" : "text-foreground",
              )}
            >
              Field Name <span className="text-destructive">*</span>
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs">:</span>
            <Input
              value={property.name}
              disabled={isReadOnly}
              onChange={(e) =>
                onUpdate(property.sn, {
                  name: e.target.value.replace(/\s+/g, ""),
                })
              }
              placeholder="e.g. CUSTOMER_ID"
              className={cn(
                "h-7 rounded text-xs font-mono uppercase bg-background max-w-md flex-1",
                nameError
                  ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                  : "border-border/80",
              )}
            />
          </div>
          {nameError && (
            <div className="pl-31 text-[11px] text-destructive flex items-center gap-1 font-medium">
              <span>• {nameError.message}</span>
            </div>
          )}
        </div>

        {/* Display Label */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label
              className={cn(
                "w-28 shrink-0 text-xs font-medium select-none",
                labelError ? "text-destructive font-semibold" : "text-foreground",
              )}
            >
              Display Label <span className="text-destructive">*</span>
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs">:</span>
            <Input
              value={property.label}
              disabled={isReadOnly}
              onChange={(e) => onUpdate(property.sn, { label: e.target.value })}
              placeholder="e.g. Customer Identifier"
              className={cn(
                "h-7 rounded text-xs bg-background max-w-md flex-1",
                labelError
                  ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                  : "border-border/80",
              )}
            />
          </div>
          {labelError && (
            <div className="pl-31 text-[11px] text-destructive flex items-center gap-1 font-medium">
              <span>• {labelError.message}</span>
            </div>
          )}
        </div>

        {/* Enrich Text / Tooltip Documentation */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            Enrich Text
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <Input
            value={property.enrichText || ""}
            disabled={isReadOnly}
            onChange={(e) => onUpdate(property.sn, { enrichText: e.target.value })}
            placeholder="Tooltip / Field dictionary description"
            className="h-7 rounded text-xs bg-background border-border/80 max-w-md flex-1"
          />
        </div>

        {/* Data Type */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            Data Type
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="max-w-md flex-1">
            <Select value={property.type} disabled={isReadOnly} onValueChange={handleTypeChange}>
              <SelectTrigger
                size="sm"
                className="h-7 text-xs rounded bg-background border-border/80 w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded">
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs rounded">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Structure: Single vs Multi */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            Structure
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="flex items-center gap-1.5 max-w-md flex-1">
            <Button
              type="button"
              variant={property.structure === "S" ? "default" : "outline"}
              size="sm"
              disabled={isReadOnly}
              onClick={() => onUpdate(property.sn, { structure: "S" })}
              className="h-7 px-3 text-xs rounded flex-1"
            >
              Single (S)
            </Button>
            <Button
              type="button"
              variant={property.structure === "M" ? "default" : "outline"}
              size="sm"
              disabled={isReadOnly}
              onClick={() => onUpdate(property.sn, { structure: "M" })}
              className="h-7 px-3 text-xs rounded flex-1"
            >
              Multi-Value (M)
            </Button>
          </div>
        </div>

        {/* Constraints Checkboxes */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            Constraints
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="flex items-center gap-6 max-w-md flex-1">
            <label
              htmlFor={`prop-required-${property.sn}`}
              className={cn(
                "flex items-center gap-1.5 select-none",
                isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
              )}
            >
              <Checkbox
                id={`prop-required-${property.sn}`}
                checked={property.required}
                disabled={isReadOnly}
                onCheckedChange={(val) => onUpdate(property.sn, { required: !!val })}
                className={cn(
                  "rounded",
                  isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                )}
              />
              <span className="text-xs text-foreground font-medium">Required</span>
            </label>

            <label
              htmlFor={`prop-disabled-${property.sn}`}
              className={cn(
                "flex items-center gap-1.5 select-none",
                isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
              )}
            >
              <Checkbox
                id={`prop-disabled-${property.sn}`}
                checked={property.disabled}
                disabled={isReadOnly}
                onCheckedChange={(val) => onUpdate(property.sn, { disabled: !!val })}
                className={cn(
                  "rounded",
                  isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                )}
              />
              <span className="text-xs text-foreground font-medium">Read Only</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
