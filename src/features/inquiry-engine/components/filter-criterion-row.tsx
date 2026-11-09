import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { INQSelectField, SelectionOperand } from "@/lib/data-schemas";
import { INQUIRY_OPERAND_OPTIONS } from "../constants";
import type { FilterCriterion } from "../types";

export interface FilterCriterionRowProps {
  field: INQSelectField;
  criterion: FilterCriterion;
  onValueChange: (fieldName: string, val: string) => void;
  onOperandChange: (fieldName: string, op: SelectionOperand) => void;
}

export function FilterCriterionRow({
  field,
  criterion,
  onValueChange,
  onOperandChange,
}: FilterCriterionRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Left Label (w-40) + fieldName */}
      <label
        htmlFor={`inq-filter-${field.selectFieldName}`}
        className="w-40 shrink-0 text-xs font-medium text-muted-foreground flex items-center justify-between pr-1 select-none"
      >
        <span className="truncate">{field.selectFieldDisplay}</span>
        <span className="text-[9px] font-mono text-muted-foreground/60 hidden sm:inline">
          {field.selectFieldName}
        </span>
      </label>

      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {/* Operand Selector: Compact h-7 font-mono */}
        <Select
          value={criterion.operand}
          disabled={Boolean(field.selectFieldOperatorFixed)}
          onValueChange={(val: string | null) =>
            onOperandChange(field.selectFieldName, (val ?? "EQ") as SelectionOperand)
          }
        >
          <SelectTrigger className="h-7 w-22 text-xs font-mono px-2 shrink-0 bg-background border-border/80 rounded">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs font-mono min-w-28">
            {INQUIRY_OPERAND_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.badge} ({opt.label})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Input: Compact h-7 font-mono */}
        <Input
          id={`inq-filter-${field.selectFieldName}`}
          type={field.selectFieldType === "number" ? "number" : "text"}
          placeholder={`e.g. ${field.selectFieldDisplay}...`}
          value={criterion.value}
          onChange={(e) => onValueChange(field.selectFieldName, e.target.value)}
          className="h-7 text-xs font-mono bg-background border-border/80 rounded flex-1"
        />
      </div>
    </div>
  );
}
