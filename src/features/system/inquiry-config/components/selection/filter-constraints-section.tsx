import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";

export interface FilterConstraintsSectionProps {
  field: INQSelectField;
  disabled?: boolean;
  onUpdate: (patch: Partial<INQSelectField>) => void;
}

const FILTER_OPERATORS = [
  { value: "EQ", label: "Equals (=)" },
  { value: "LK", label: "Contains (LK)" },
  { value: "GT", label: "Greater (>)" },
  { value: "LT", label: "Less (<)" },
  { value: "RG", label: "Range (..)" },
];

export function FilterConstraintsSection({
  field,
  disabled,
  onUpdate,
}: FilterConstraintsSectionProps) {
  return (
    <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Settings2 className="size-3.5 text-primary" />
          <span>Logic & Operator Constraints</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Query Execution Rules</span>
      </div>

      <div className="space-y-2 text-xs">
        {/* Default Operand Buttons */}
        <FieldRow
          label="Default Operand"
          enrichText="Default comparison operator (EQ = Equals, LK = Like / Contains, GT = Greater Than, etc.)."
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPERATORS.map((op) => (
              <Button
                key={op.value}
                type="button"
                variant={(field.selectFieldOperator || "EQ") === op.value ? "default" : "outline"}
                size="sm"
                disabled={disabled}
                onClick={() => onUpdate({ selectFieldOperator: op.value })}
                className="h-7 px-2.5 text-xs rounded flex-1"
              >
                {op.label}
              </Button>
            ))}
          </div>
        </FieldRow>

        {/* Pre-fill Value */}
        <FieldRow
          label="Pre-fill Value"
          enrichText="Optional initial default filter value populated when the inquiry is launched."
        >
          <Input
            value={field.selectFieldValue || ""}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldValue: e.target.value })}
            placeholder="Optional default prefill value..."
            className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
          />
        </FieldRow>

        {/* Mandatory Requirement */}
        <FieldRow
          label="Mandatory"
          enrichText="When enabled, requires the operator to provide this search criterion before executing the query."
        >
          <label
            htmlFor="ic-filter-mandatory"
            className={cn(
              "flex items-center gap-2 select-none",
              disabled ? "cursor-default opacity-85" : "cursor-pointer",
            )}
          >
            <Checkbox
              id="ic-filter-mandatory"
              checked={field.selectFieldRequired}
              disabled={disabled}
              onCheckedChange={(checked) => onUpdate({ selectFieldRequired: Boolean(checked) })}
              className="rounded"
            />
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                field.selectFieldRequired
                  ? "bg-primary/10 text-primary border-primary/25"
                  : "bg-muted text-muted-foreground border-border/40",
              )}
            >
              {field.selectFieldRequired ? "Yes" : "No"}
            </span>
          </label>
        </FieldRow>

        {/* Fixed Operator Lock */}
        <FieldRow
          label="Lock Operator"
          enrichText="Locks the comparison operator so operators cannot switch operands during inquiry."
        >
          <label
            htmlFor="ic-filter-locked"
            className={cn(
              "flex items-center gap-2 select-none",
              disabled ? "cursor-default opacity-85" : "cursor-pointer",
            )}
          >
            <Checkbox
              id="ic-filter-locked"
              checked={Boolean(field.selectFieldOperatorFixed)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onUpdate({
                  selectFieldOperatorFixed: checked ? field.selectFieldOperator || "EQ" : "",
                })
              }
              className="rounded"
            />
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                field.selectFieldOperatorFixed
                  ? "bg-primary/10 text-primary border-primary/25"
                  : "bg-muted text-muted-foreground border-border/40",
              )}
            >
              {field.selectFieldOperatorFixed ? "Yes" : "No"}
            </span>
          </label>
        </FieldRow>
      </div>
    </div>
  );
}
