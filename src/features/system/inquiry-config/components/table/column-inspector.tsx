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
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground">
        Select a column to inspect its wire definition.
      </div>
    );
  }

  // Decompose fieldLength (e.g. "20,L")
  const [lenPart, alignPart] = (activeCol.fieldLength || "20,L").split(",");
  const currentLen = lenPart?.trim() || "20";
  const currentAlign = alignPart?.trim().toUpperCase() || "L";

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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
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
            variant="ghost"
            size="sm"
            onClick={() => onRemoveColumn(selectedColIdx)}
            className="h-7 px-2 text-destructive hover:bg-destructive/10 text-xs gap-1"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Column</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Field Identity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="col-field-name" className="text-xs">
              Field Name (Key)
            </Label>
            <Input
              id="col-field-name"
              value={activeCol.fieldName}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldName: e.target.value })}
              className="h-8 text-xs font-mono"
              placeholder="e.g. recordId"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="col-field-display" className="text-xs">
              Display Header
            </Label>
            <Input
              id="col-field-display"
              value={activeCol.fieldDisplay}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldDisplay: e.target.value })}
              className="h-8 text-xs"
              placeholder="e.g. Account No"
            />
          </div>
        </div>

        {/* Physical CBS Type & Length */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="col-field-type" className="text-xs">
              Physical Type
            </Label>
            <Select
              value={activeCol.fieldType}
              disabled={disabled}
              onValueChange={(val) => onUpdateColumn(selectedColIdx, { fieldType: val || "CH" })}
            >
              <SelectTrigger id="col-field-type" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CBS_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="col-field-length" className="text-xs">
              Length (Characters)
            </Label>
            <Input
              id="col-field-length"
              value={currentLen}
              disabled={disabled}
              onChange={(e) => handleLengthChange(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="20"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="col-field-align" className="text-xs">
              Text Alignment
            </Label>
            <Select
              value={currentAlign}
              disabled={disabled}
              onValueChange={handleAlignChange}
            >
              <SelectTrigger id="col-field-align" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CBS_ALIGN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid Coordinates & Formula */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="col-field-coord" className="text-xs">
              Row,Col Coordinate
            </Label>
            <Input
              id="col-field-coord"
              value={activeCol.fieldRowCol}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldRowCol: e.target.value })}
              className="h-8 text-xs font-mono"
              placeholder="1,1"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="col-field-func" className="text-xs">
              Aggregation / Formula
            </Label>
            <Input
              id="col-field-func"
              value={activeCol.fieldFunc}
              disabled={disabled}
              onChange={(e) => onUpdateColumn(selectedColIdx, { fieldFunc: e.target.value })}
              className="h-8 text-xs font-mono"
              placeholder="e.g. SUM, COUNT"
            />
          </div>
        </div>

        {/* Drilldown Passable */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Checkbox
              id="col-field-passable"
              checked={Boolean(activeCol.dataPassable)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onUpdateColumn(selectedColIdx, { dataPassable: checked ? true : null })
              }
            />
            <label htmlFor="col-field-passable" className="flex flex-col cursor-pointer">
              <span className="text-xs font-medium">Data Passable</span>
              <span className="text-[11px] text-muted-foreground">
                Permits passing this field value into linked action commands
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
