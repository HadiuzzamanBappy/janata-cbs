"use client";

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
import { INQUIRY_FILTER_FIELD_TYPES, INQUIRY_OPERAND_OPTIONS } from "@/features/inquiry-engine";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";

export interface FilterInspectorProps {
  field: INQSelectField;
  disabled?: boolean;
  onUpdate: (patch: Partial<INQSelectField>) => void;
}

export function FilterInspector({ field, disabled = false, onUpdate }: FilterInspectorProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="space-y-3 text-xs max-w-xl">
        {/* Field Name / Key */}
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Field Name / Key
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <Input
            value={field.selectFieldName}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldName: e.target.value })}
            placeholder="e.g. recordId, branchCode..."
            className="h-7 text-xs font-mono flex-1 bg-background"
          />
        </div>

        {/* Display Header */}
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Display Label
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <Input
            value={field.selectFieldDisplay}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldDisplay: e.target.value })}
            placeholder="e.g. Account Number, Branch Title..."
            className="h-7 text-xs flex-1 bg-background"
          />
        </div>

        {/* Field Type */}
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Field Type
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <Select
            value={field.selectFieldType || "text"}
            disabled={disabled}
            onValueChange={(val) => onUpdate({ selectFieldType: val ?? "text" })}
          >
            <SelectTrigger className="h-7 text-xs flex-1 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INQUIRY_FILTER_FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Operand */}
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Default Operand
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <Select
            value={field.selectFieldOperator || "EQ"}
            disabled={disabled}
            onValueChange={(val) => onUpdate({ selectFieldOperator: val ?? "EQ" })}
          >
            <SelectTrigger className="h-7 text-xs font-mono flex-1 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INQUIRY_OPERAND_OPTIONS.map((op) => (
                <SelectItem key={op.value} value={op.value} className="text-xs font-mono">
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Pre-fill Value */}
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Pre-fill Default Value
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <Input
            value={field.selectFieldValue || ""}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldValue: e.target.value })}
            placeholder="Optional default prefill value..."
            className="h-7 text-xs font-mono flex-1 bg-background"
          />
        </div>

        {/* Mandatory Requirement */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Mandatory Filter
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ic-filter-mandatory"
              checked={field.selectFieldRequired}
              disabled={disabled}
              onCheckedChange={(checked) => onUpdate({ selectFieldRequired: Boolean(checked) })}
            />
            <Label
              htmlFor="ic-filter-mandatory"
              className="text-xs text-muted-foreground font-normal cursor-pointer"
            >
              Require operator to input this criterion before query execution
            </Label>
          </div>
        </div>

        {/* Fixed Operator Lock */}
        <div className="flex items-center gap-2">
          <Label className="w-36 shrink-0 text-xs text-muted-foreground select-none">
            Lock Operator
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ic-filter-locked"
              checked={Boolean(field.selectFieldOperatorFixed)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onUpdate({
                  selectFieldOperatorFixed: checked ? field.selectFieldOperator || "EQ" : "",
                })
              }
            />
            <Label
              htmlFor="ic-filter-locked"
              className="text-xs text-muted-foreground font-normal cursor-pointer"
            >
              Prevent operator from changing the comparison operator in runtime inquiry
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
