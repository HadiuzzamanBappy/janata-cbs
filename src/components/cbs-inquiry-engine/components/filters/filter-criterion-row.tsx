import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FilterCriterion,
  INQUIRY_OPERAND_OPTIONS,
  STANDARD_BANKING_STATUS_OPTIONS,
  STANDARD_BOOLEAN_FILTER_OPTIONS,
} from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { INQSelectField, SelectionOperand } from "@/lib/data-schemas";

export interface FilterCriterionRowProps {
  field: INQSelectField;
  criterion: FilterCriterion;
  hasError?: boolean;
  onValueChange: (fieldName: string, val: string) => void;
  onOperandChange: (fieldName: string, op: SelectionOperand) => void;
}

function resolveSelectOptions(fieldName: string): Array<{ value: string; label: string }> {
  const norm = fieldName.toLowerCase();
  if (norm.includes("status")) {
    return STANDARD_BANKING_STATUS_OPTIONS;
  }
  if (norm.includes("flag") || norm.includes("active") || norm.includes("enabled")) {
    return STANDARD_BOOLEAN_FILTER_OPTIONS;
  }
  return STANDARD_BANKING_STATUS_OPTIONS;
}

export function FilterCriterionRow({
  field,
  criterion,
  hasError = false,
  onValueChange,
  onOperandChange,
}: FilterCriterionRowProps) {
  const isRequired = Boolean(field.selectFieldRequired);
  const isSelectType = field.selectFieldType === "select";
  const selectOptions = isSelectType ? resolveSelectOptions(field.selectFieldName) : [];

  return (
    <div className="flex items-center gap-2">
      {/* Left Label (w-40) + fieldName */}
      <label
        htmlFor={`inq-filter-${field.selectFieldName}`}
        className="w-40 shrink-0 text-xs font-medium text-muted-foreground flex items-center justify-between pr-1 select-none"
      >
        <span className="truncate flex items-center gap-0.5">
          <span>{field.selectFieldDisplay}</span>
          {isRequired && (
            <span className="text-destructive font-bold text-xs" title="Required Filter">
              *
            </span>
          )}
        </span>
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

        {/* Value Input: Contextual based on selectFieldType */}
        {isSelectType ? (
          <Select
            value={criterion.value || "ALL"}
            onValueChange={(val: string | null) =>
              onValueChange(field.selectFieldName, val === "ALL" ? "" : (val ?? ""))
            }
          >
            <SelectTrigger
              id={`inq-filter-${field.selectFieldName}`}
              className={cn(
                "h-7 text-xs font-mono bg-background border-border/80 rounded flex-1",
                hasError && "border-destructive focus-visible:ring-destructive/30",
              )}
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="text-xs font-mono">
              <SelectItem value="ALL">All</SelectItem>
              {selectOptions
                .filter((o) => o.value !== "")
                .map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
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
                : `e.g. ${field.selectFieldDisplay}...`
            }
            value={criterion.value}
            required={isRequired}
            onChange={(e) => onValueChange(field.selectFieldName, e.target.value)}
            className={cn(
              "h-7 text-xs font-mono bg-background border-border/80 rounded flex-1",
              hasError && "border-destructive focus-visible:ring-destructive/30",
            )}
          />
        )}
      </div>
    </div>
  );
}
