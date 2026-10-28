"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import { CBS_ALIGN_OPTIONS, CBS_TYPE_OPTIONS } from "./table-constants";

export interface ColumnInspectorProps {
  activeCol?: INQDef;
  selectedColIdx: number;
  disabled?: boolean;
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
  onRemoveColumn: (index: number) => void;
}

export function ColumnInspector({
  activeCol,
  selectedColIdx,
  disabled = false,
  onUpdateColumn,
  onRemoveColumn,
}: ColumnInspectorProps) {
  if (!activeCol) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <p className="text-xs font-mono">
          Select a column from the left to inspect its definition.
        </p>
      </div>
    );
  }

  // Decompose fieldLength (e.g. "20,L")
  const [lenPart, alignPart] = (activeCol.fieldLength || "20,L").split(",");
  const currentLen = lenPart?.trim() || "20";
  const currentAlign = alignPart?.trim().toUpperCase() || "L";

  // Decompose fieldRowCol (e.g. "1,2")
  const [rowPart, colPart] = (activeCol.fieldRowCol || "1,1").split(",");

  const handleLengthChange = (newLen: string) => {
    onUpdateColumn(selectedColIdx, {
      fieldLength: `${newLen || "20"},${currentAlign}`,
    });
  };

  const handleAlignChange = (newAlign: string | null) => {
    onUpdateColumn(selectedColIdx, {
      fieldLength: `${currentLen},${newAlign || "L"}`,
    });
  };

  const handleCoordChange = (rowVal: string, colVal: string) => {
    onUpdateColumn(selectedColIdx, {
      fieldRowCol: `${rowVal || "1"},${colVal || "1"}`,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* Inspector Header */}
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Column Inspector:
          </span>
          <span className="text-xs font-bold text-foreground">
            {activeCol.fieldDisplay || activeCol.fieldName}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase">
            {activeCol.fieldType}
          </Badge>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveColumn(selectedColIdx)}
            className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Column</span>
          </Button>
        )}
      </div>

      {/* Inspector Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3 text-xs max-w-xl">
          {/* Field Name / Key */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Field Key :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Input
              value={activeCol.fieldName}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldName: e.target.value })}
              className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
              placeholder="e.g. recordId, branchTitle"
            />
          </div>

          {/* Display Header */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Header Label :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Input
              value={activeCol.fieldDisplay}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldDisplay: e.target.value })}
              className="h-7 text-xs bg-background rounded border-border/80 flex-1"
              placeholder="e.g. Account Number, Branch Title"
            />
          </div>

          {/* CBS Field Type */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Data Type :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Select
              value={activeCol.fieldType}
              disabled={disabled}
              onValueChange={(val) => onUpdateColumn(selectedColIdx, { fieldType: val ?? "CH" })}
            >
              <SelectTrigger className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CBS_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cell Alignment */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Alignment :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Select value={currentAlign} disabled={disabled} onValueChange={handleAlignChange}>
              <SelectTrigger className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CBS_ALIGN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Character Length */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Char Width / Length :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Input
              type="number"
              value={currentLen}
              disabled={disabled}
              onChange={(e) => handleLengthChange(e.target.value)}
              className="h-7 text-xs font-mono bg-background rounded border-border/80 w-32"
              placeholder="20"
              min={1}
              max={500}
            />
          </div>

          {/* Row & Column Order Coordinates */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Row, Column Order :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={rowPart || "1"}
                disabled={disabled}
                onChange={(e) => handleCoordChange(e.target.value, colPart || "1")}
                className="h-7 text-xs font-mono bg-background rounded border-border/80 w-20"
                placeholder="Row"
                min={1}
              />
              <span className="text-muted-foreground/60 font-mono text-xs">,</span>
              <Input
                type="number"
                value={colPart || "1"}
                disabled={disabled}
                onChange={(e) => handleCoordChange(rowPart || "1", e.target.value)}
                className="h-7 text-xs font-mono bg-background rounded border-border/80 w-20"
                placeholder="Col"
                min={1}
              />
            </div>
          </div>

          {/* Function / Routine */}
          <div className="flex items-center gap-2">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Conversion Function :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Input
              value={activeCol.fieldFunc || ""}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldFunc: e.target.value })}
              className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
              placeholder="e.g. SUBSTRING, DATE.CONVERT"
            />
          </div>

          {/* Data Passable Flag */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            <Label className="w-36 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Passable Flag :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <div className="flex items-center gap-2">
              <Checkbox
                id="col-passable"
                checked={Boolean(activeCol.dataPassable)}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onUpdateColumn(selectedColIdx, { dataPassable: Boolean(checked) })
                }
              />
              <Label
                htmlFor="col-passable"
                className="text-xs text-muted-foreground font-normal cursor-pointer"
              >
                Allow passing this column's value into drilldown or action commands
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
