"use client";

import { Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

interface McInspectorTypeSpecsProps {
  property: ModelProperty;
  isReadOnly: boolean;
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
}

export function McInspectorTypeSpecs({
  property,
  isReadOnly,
  onUpdate,
}: McInspectorTypeSpecsProps) {
  return (
    <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders className="size-3.5 text-primary" />
          <span>Type-Dependent Specifications</span>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider text-primary border-primary/30"
        >
          {property.type} Mode
        </Badge>
      </div>

      <div className="space-y-2 text-xs">
        {/* Default Value */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            Default Value
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="max-w-md flex-1">
            {property.type === "Boolean" ? (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={property.defaultValue === true ? "default" : "outline"}
                  size="sm"
                  disabled={isReadOnly}
                  onClick={() => onUpdate(property.sn, { defaultValue: true })}
                  className="h-7 px-3 text-xs rounded flex-1"
                >
                  True
                </Button>
                <Button
                  type="button"
                  variant={property.defaultValue === false ? "default" : "outline"}
                  size="sm"
                  disabled={isReadOnly}
                  onClick={() => onUpdate(property.sn, { defaultValue: false })}
                  className="h-7 px-3 text-xs rounded flex-1"
                >
                  False
                </Button>
              </div>
            ) : (
              <Input
                type={
                  property.type === "Number" ? "number" : property.type === "Date" ? "date" : "text"
                }
                value={
                  property.defaultValue !== undefined && property.defaultValue !== null
                    ? String(property.defaultValue)
                    : ""
                }
                disabled={isReadOnly}
                onChange={(e) =>
                  onUpdate(property.sn, {
                    defaultValue:
                      property.type === "Number" ? Number(e.target.value) || 0 : e.target.value,
                  })
                }
                placeholder={
                  property.type === "Date"
                    ? "YYYY-MM-DD"
                    : property.type === "Number"
                      ? "0.00"
                      : "Optional base fallback"
                }
                className="h-7 rounded text-xs bg-background border-border/80 w-full"
              />
            )}
          </div>
        </div>

        {/* Max Length / Digits Precision */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            {property.type === "Number" ? "Max Digits" : "Max Length"}
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="flex items-center gap-2 max-w-md flex-1">
            <Input
              type="number"
              value={
                property.type === "Boolean" ? 1 : property.type === "Date" ? 10 : property.length
              }
              disabled={isReadOnly || property.type === "Boolean" || property.type === "Date"}
              onChange={(e) => onUpdate(property.sn, { length: Number(e.target.value) || 0 })}
              className="h-7 rounded text-xs font-mono w-28 bg-background border-border/80 disabled:opacity-75 disabled:bg-muted/40"
            />
            {property.type === "Boolean" ? (
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground h-5 rounded px-1.5 border-border/60"
              >
                Fixed (1 char / flag)
              </Badge>
            ) : property.type === "Date" ? (
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground h-5 rounded px-1.5 border-border/60"
              >
                Fixed (ISO 10 chars)
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {property.type === "Number" ? "digits precision" : "characters"}
              </span>
            )}
          </div>
        </div>

        {/* Format Mask */}
        {property.type !== "Boolean" && (
          <div className="flex items-center gap-2">
            <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
              Format Mask
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs">:</span>
            <Input
              value={property.mask || ""}
              disabled={isReadOnly}
              onChange={(e) => onUpdate(property.sn, { mask: e.target.value })}
              placeholder={
                property.type === "Date"
                  ? "e.g. YYYY-MM-DD or DD/MM/YYYY"
                  : property.type === "Number"
                    ? "e.g. #,##0.00"
                    : "e.g. ###-##-####"
              }
              className="h-7 rounded text-xs font-mono bg-background border-border/80 max-w-md flex-1"
            />
          </div>
        )}

        {/* Validation Regex Pattern */}
        {(property.type === "Text" || property.type === "Number") && (
          <div className="flex items-center gap-2">
            <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
              Validation Regex
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs">:</span>
            <Input
              value={property.pattern || ""}
              disabled={isReadOnly}
              onChange={(e) => onUpdate(property.sn, { pattern: e.target.value })}
              placeholder={
                property.type === "Number" ? "e.g. ^\\d+(\\.\\d{1,2})?$" : "e.g. ^[A-Z0-9_.]+$"
              }
              className="h-7 rounded text-xs font-mono bg-background border-border/80 max-w-md flex-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
