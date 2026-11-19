import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INQUIRY_OPERAND_OPTIONS } from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { FilterCriterion, INQSelectField, SelectionOperand } from "@/lib/data-schemas";

export interface FilterCriterionRowProps {
  field: INQSelectField;
  criterion: FilterCriterion;
  hasError?: boolean;
  onValueChange: (fieldName: string, val: string) => void;
  onOperandChange: (fieldName: string, op: SelectionOperand) => void;
}

export function FilterCriterionRow({
  field,
  criterion,
  hasError = false,
  onValueChange,
  onOperandChange,
}: FilterCriterionRowProps) {
  const isRequired = Boolean(field.selectFieldRequired);

  return (
    <div className="flex items-center gap-2">
      {/* Left Label */}
      <label
        htmlFor={`inq-filter-${field.selectFieldName}`}
        title={field.selectFieldDisplay}
        className="w-40 sm:w-44 shrink-0 text-xs font-medium text-muted-foreground flex items-center gap-1 select-none"
      >
        <span className="truncate">{field.selectFieldDisplay}</span>
        {isRequired && (
          <span className="text-destructive font-bold text-xs shrink-0" title="Required Filter">
            *
          </span>
        )}
      </label>

      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {/* Operand Selector: Compact h-7 font-mono */}
        <Select
          value={criterion.operand || "EQ"}
          disabled={Boolean(field.selectFieldOperatorFixed)}
          onValueChange={(val: string | null) =>
            onOperandChange(field.selectFieldName, (val ?? "EQ") as SelectionOperand)
          }
        >
          <SelectTrigger
            size="sm"
            className="h-7 w-20 text-xs font-mono px-2 py-0 shrink-0 bg-background border-border/80 rounded focus-visible:ring-0 focus-visible:border-foreground/50"
          >
            <SelectValue>{(val: string | null) => val || criterion.operand || "EQ"}</SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            className="text-xs font-mono w-auto min-w-60"
          >
            {INQUIRY_OPERAND_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
                <span className="font-semibold text-primary">{opt.badge}</span>
                <span className="text-muted-foreground">({opt.label})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Input: Config-driven placeholder & input type */}
        <Input
          id={`inq-filter-${field.selectFieldName}`}
          type={
            field.selectFieldType === "number"
              ? "number"
              : field.selectFieldType === "date"
                ? "date"
                : "text"
          }
          placeholder={
            field.selectFieldType === "date"
              ? "YYYY-MM-DD"
              : field.selectFieldValue || `e.g. ${field.selectFieldDisplay}...`
          }
          value={criterion.value}
          required={isRequired}
          onChange={(e) => onValueChange(field.selectFieldName, e.target.value)}
          className={cn(
            "h-7 text-xs font-mono bg-background border-border/80 rounded flex-1 focus-visible:ring-0 focus-visible:border-foreground/50",
            field.selectFieldType === "date" && "scheme-light dark:scheme-dark",
            hasError && "border-destructive focus-visible:border-destructive",
          )}
        />
      </div>
    </div>
  );
}
