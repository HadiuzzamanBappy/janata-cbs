import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";

export interface ColumnConstraintsSectionProps {
  activeCol: INQDef;
  selectedColIdx: number;
  disabled?: boolean;
  currentLen: string;
  rowPart: string;
  colPart: string;
  onLengthChange: (newLen: string) => void;
  onCoordChange: (rowVal: string, colVal: string) => void;
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
}

export function ColumnConstraintsSection({
  activeCol,
  selectedColIdx,
  disabled,
  currentLen,
  rowPart,
  colPart,
  onLengthChange,
  onCoordChange,
  onUpdateColumn,
}: ColumnConstraintsSectionProps) {
  return (
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
              onChange={(e) => onLengthChange(e.target.value)}
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
                  onClick={() => onLengthChange(w)}
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
              onChange={(e) => onCoordChange(e.target.value, colPart || "1")}
              className="h-7 text-xs font-mono bg-background rounded border-border/80 w-20"
              placeholder="Row"
              min={1}
            />
            <span className="text-muted-foreground/60 font-mono text-xs">,</span>
            <Input
              type="number"
              value={colPart || "1"}
              disabled={disabled}
              onChange={(e) => onCoordChange(rowPart || "1", e.target.value)}
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
  );
}
