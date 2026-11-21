import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { operandOptionsFor } from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import {
  type FilterCriterion,
  type INQSelectField,
  isSelectionOperand,
  type SelectionOperand,
} from "@/lib/data-schemas";

export interface FilterCriterionRowProps {
  field: INQSelectField;
  criterion: FilterCriterion;
  hasError: boolean;
  onValueChange: (field: INQSelectField, value: string) => void;
  onOperandChange: (field: INQSelectField, operand: SelectionOperand) => void;
}

const INPUT_TYPES = { number: "number", date: "date", text: "text", select: "text" } as const;

export function FilterCriterionRow({
  field,
  criterion,
  hasError,
  onValueChange,
  onOperandChange,
}: FilterCriterionRowProps) {
  const inputId = `inq-filter-${field.selectFieldName}`;
  const locked = Boolean(field.selectFieldOperatorFixed.trim());
  const operand = locked ? field.selectFieldOperator : criterion.operand;

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={inputId}
        title={field.selectFieldDisplay}
        className="w-40 sm:w-44 shrink-0 text-xs font-medium text-muted-foreground flex items-center gap-1 select-none"
      >
        <span className="truncate">{field.selectFieldDisplay}</span>
        {field.selectFieldRequired && (
          <span className="text-destructive font-bold text-xs shrink-0" title="Required Filter">
            *
          </span>
        )}
      </label>

      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <Select
          value={operand}
          disabled={locked}
          onValueChange={(val: string | null) => {
            if (val && isSelectionOperand(val)) onOperandChange(field, val);
          }}
        >
          <SelectTrigger
            size="sm"
            title={locked ? "The operator is fixed by the inquiry" : undefined}
            className="h-7 w-20 text-xs font-mono px-2 py-0 shrink-0 bg-background border-border/80 rounded focus-visible:ring-0 focus-visible:border-foreground/50"
          >
            <SelectValue>{(val: string | null) => val || operand}</SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            className="text-xs font-mono w-auto min-w-60"
          >
            {operandOptionsFor(field.selectFieldType).map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
                <span className="font-semibold text-primary">{opt.value}</span>
                <span className="text-muted-foreground">({opt.label})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id={inputId}
          type={INPUT_TYPES[field.selectFieldType]}
          placeholder={
            field.selectFieldType === "date"
              ? "YYYY-MM-DD"
              : field.selectFieldValue || `e.g. ${field.selectFieldDisplay}...`
          }
          value={criterion.value}
          aria-required={field.selectFieldRequired}
          aria-invalid={hasError}
          onChange={(e) => onValueChange(field, e.target.value)}
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
