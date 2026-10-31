"use client";

import { FileText, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";

export interface ColumnInspectorProps {
  activeCol?: INQDef;
  selectedColIdx: number;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
  onRemoveColumn: (index: number) => void;
}

const CBS_FIELD_TYPES = [
  { value: "CH", label: "Character (CH)" },
  { value: "AMT", label: "Amount (AMT)" },
  { value: "NUM", label: "Numeric (NUM)" },
  { value: "D", label: "Date (D)" },
  { value: "T", label: "Time (T)" },
];

const CBS_ALIGNMENTS = [
  { value: "L", label: "Left (L)" },
  { value: "C", label: "Center (C)" },
  { value: "R", label: "Right (R)" },
];

export function ColumnInspector({
  activeCol,
  selectedColIdx,
  disabled = false,
  validationErrors = [],
  onUpdateColumn,
  onRemoveColumn,
}: ColumnInspectorProps) {
  const nameError = validationErrors.find(
    (e) =>
      e.tab === "table" &&
      e.subSegment !== "actions" &&
      e.itemIndex === selectedColIdx &&
      e.fieldKey.endsWith("fieldName"),
  );
  const displayError = validationErrors.find(
    (e) =>
      e.tab === "table" &&
      e.subSegment !== "actions" &&
      e.itemIndex === selectedColIdx &&
      e.fieldKey.endsWith("fieldDisplay"),
  );
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

  const handleAlignChange = (newAlign: string) => {
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
      {/* 1. Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            Col #{selectedColIdx + 1}
          </Badge>
          <span className="text-xs font-bold text-foreground tracking-wide truncate">
            {activeCol.fieldDisplay || activeCol.fieldName || "<UNNAMED_COLUMN>"}
          </span>
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

      {/* 2. Inspector Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {/* Panel 1: Column Identity & Data Format */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Column Identity</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Col #{selectedColIdx + 1}</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Field Key */}
              <FieldRow
                label="Field Key"
                required
                error={nameError?.message}
                enrichText="Underlying database column or model property key returned in query result tuples."
              >
                <Input
                  value={activeCol.fieldName}
                  disabled={disabled}
                  onChange={(e) =>
                    onUpdateColumn(selectedColIdx, {
                      fieldName: e.target.value.replace(/\s+/g, ""),
                    })
                  }
                  className={cn(
                    "h-7 text-xs font-mono bg-background rounded border-border/80 flex-1",
                    nameError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                  placeholder="e.g. recordId, branchTitle"
                />
              </FieldRow>

              {/* Display Header */}
              <FieldRow
                label="Header Label"
                required
                error={displayError?.message}
                enrichText="Column title displayed in the inquiry table header scanline."
              >
                <Input
                  value={activeCol.fieldDisplay}
                  disabled={disabled}
                  onChange={(e) => onUpdateColumn(selectedColIdx, { fieldDisplay: e.target.value })}
                  className={cn(
                    "h-7 text-xs bg-background rounded border-border/80 flex-1",
                    displayError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                  placeholder="e.g. Account Number, Branch Title"
                />
              </FieldRow>

              {/* CBS Field Type Buttons */}
              <FieldRow
                label="Data Type"
                enrichText="Core banking data format: Character (CH), Amount/Currency (AMT), Numeric (NUM), Date (D), or Time (T)."
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CBS_FIELD_TYPES.map((t) => (
                    <Button
                      key={t.value}
                      type="button"
                      variant={activeCol.fieldType === t.value ? "default" : "outline"}
                      size="sm"
                      disabled={disabled}
                      onClick={() => onUpdateColumn(selectedColIdx, { fieldType: t.value })}
                      className="h-7 px-2.5 text-xs rounded flex-1"
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </FieldRow>

              {/* Cell Alignment Buttons */}
              <FieldRow
                label="Alignment"
                enrichText="Cell content alignment: Left (L) for text, Right (R) for amounts/numbers, Center (C) for codes/dates."
              >
                <div className="flex items-center gap-1.5">
                  {CBS_ALIGNMENTS.map((a) => (
                    <Button
                      key={a.value}
                      type="button"
                      variant={currentAlign === a.value ? "default" : "outline"}
                      size="sm"
                      disabled={disabled}
                      onClick={() => handleAlignChange(a.value)}
                      className="h-7 px-3 text-xs rounded flex-1"
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </FieldRow>
            </div>
          </div>

          {/* Panel 2: Storage & Display Constraints */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-primary" />
                <span>Storage & Display Constraints</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Physical Specifications</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Character Length */}
              <FieldRow
                label="Column Width"
                enrichText="Display character width allocation (e.g. 20 characters for account numbers, 35 for titles)."
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={currentLen}
                    disabled={disabled}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    className="h-7 text-xs font-mono bg-background rounded border-border/80 w-28"
                    placeholder="20"
                    min={1}
                    max={500}
                  />
                  <div className="flex items-center gap-1">
                    {["10", "15", "20", "30", "50"].map((w) => (
                      <Button
                        key={w}
                        type="button"
                        variant={currentLen === w ? "default" : "outline"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => handleLengthChange(w)}
                        className="h-7 px-2 text-xs rounded uppercase font-mono"
                      >
                        {w}
                      </Button>
                    ))}
                  </div>
                </div>
              </FieldRow>

              {/* Row & Column Order Coordinates */}
              <FieldRow
                label="Row, Col Order"
                enrichText="Grid placement coordinates for multi-line ledger display (Row, Column position)."
              >
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
              </FieldRow>

              {/* Function / Routine */}
              <FieldRow
                label="Conversion Routine"
                enrichText="Optional CBS core formatting routine (e.g. SUBSTRING, DATE.CONVERT, MASK.ACCOUNT)."
              >
                <Input
                  value={activeCol.fieldFunc || ""}
                  disabled={disabled}
                  onChange={(e) => onUpdateColumn(selectedColIdx, { fieldFunc: e.target.value })}
                  className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
                  placeholder="e.g. SUBSTRING, DATE.CONVERT"
                />
              </FieldRow>

              {/* Data Passable Flag */}
              <FieldRow
                label="Passable"
                enrichText="Permits passing this column's value into drilldown transactions or action commands."
              >
                <label
                  htmlFor={`col-passable-${selectedColIdx}`}
                  className={cn(
                    "flex items-center gap-2 select-none",
                    disabled ? "cursor-default opacity-85" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    id={`col-passable-${selectedColIdx}`}
                    checked={Boolean(activeCol.dataPassable)}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onUpdateColumn(selectedColIdx, { dataPassable: Boolean(checked) })
                    }
                    className="rounded"
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                      activeCol.dataPassable
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-muted text-muted-foreground border-border/40",
                    )}
                  >
                    {activeCol.dataPassable ? "Yes" : "No"}
                  </span>
                </label>
              </FieldRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
