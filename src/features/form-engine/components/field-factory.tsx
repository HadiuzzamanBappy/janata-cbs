import * as React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cbs } from "@/lib/cbs-client";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import { cn } from "@/lib/core-utils";
import type { FormFieldItem, FormFieldParameter } from "@/lib/data-schemas/form-config-schema";

export interface UnifiedFieldFactoryProps {
  field: FormFieldItem;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  mode?: CbsScreenMode;
}

/**
 * Hook to resolve dynamic model lookup options when parameter.type === 'M'
 */
function useModelLookup(param: FormFieldParameter | undefined) {
  const [modelOptions, setModelOptions] = React.useState<{ code: string; label: string }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (param?.type !== "M" || !param.modelName) {
      setModelOptions([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    cbs
      .send<Record<string, unknown>>(cbs.modelConfig.get(param.modelName), { silent: true })
      .then((res) => {
        if (!isMounted) return;
        const rawProps = (res.data?.properties as Array<Record<string, unknown>>) || [];
        const opts = rawProps
          .map((p) => {
            const codeVal = param.reference ? p[param.reference] : p.name || p.id;
            const labelVal = param.displayField ? p[param.displayField] : p.label || p.name;
            return {
              code: String(codeVal ?? ""),
              label: String(labelVal ?? codeVal ?? ""),
            };
          })
          .filter((o) => Boolean(o.code));
        setModelOptions(opts);
      })
      .catch(() => {
        if (isMounted) setModelOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [param?.type, param?.modelName, param?.reference, param?.displayField]);

  return { modelOptions, loading };
}

export function UnifiedFieldFactory({
  field,
  value,
  onChange,
  error,
  disabled = false,
  mode = "I",
}: UnifiedFieldFactoryProps) {
  const isInputMode = mode === "I";
  const isViewMode = !isInputMode;
  const isReadOnly = disabled || field.readOnly || isViewMode;

  const param = field.parameter as FormFieldParameter | undefined;
  const { modelOptions, loading: modelLoading } = useModelLookup(param);

  // Canonical options resolution:
  // 1. Live Model Lookup (parameter.type === 'M')
  // 2. Structured Static Options with Code & Label (parameter.type === 'O')
  // 3. Fallback to Legacy string array (field.options)
  const resolvedOptions = React.useMemo(() => {
    if (param?.type === "M") {
      return modelOptions;
    }
    if (param?.type === "O" && Array.isArray(param.data) && param.data.length > 0) {
      return param.data.map((d) => ({
        code: d.itemCode,
        label: d.itemLabel || d.itemCode,
      }));
    }
    return (field.options ?? []).map((opt) => ({
      code: opt,
      label: opt,
    }));
  }, [param, modelOptions, field.options]);

  // Number coercion helper for single-choice widgets bound to Numeric model types
  const handleSelectOrRadioChange = (val: string | null) => {
    if (val === null) {
      onChange(field.fieldKey, "");
      return;
    }
    if (field.modelType === "Number") {
      const num = Number(val);
      onChange(field.fieldKey, Number.isNaN(num) ? val : num);
    } else {
      onChange(field.fieldKey, val);
    }
  };

  const parseDateValue = (val: unknown): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const parts = val.split("-");
      if (parts.length === 3) {
        const year = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1;
        const day = Number.parseInt(parts[2], 10);
        if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
          return new Date(year, month, day);
        }
      }
    }
    const d = new Date(val as string | number);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  const handleDateChange = (selectedDate?: Date) => {
    if (!selectedDate) {
      onChange(field.fieldKey, "");
      return;
    }
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    onChange(field.fieldKey, `${year}-${month}-${day}`);
  };

  const widget = field.widget || "text";

  return (
    <div className="space-y-1">
      {/* Scanline row: Label (w-32) + Colon + Input Widget */}
      <div className="flex items-center gap-2">
        <Label
          htmlFor={field.id}
          className={cn(
            "w-32 shrink-0 text-xs select-none",
            error
              ? "text-destructive font-semibold"
              : field.required
                ? "text-foreground font-medium"
                : "text-muted-foreground",
          )}
        >
          {field.label}
          {field.required && !isViewMode && (
            <span className="text-destructive font-bold ml-1">*</span>
          )}
        </Label>

        <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

        {/* View Mode: Read-Only Text Badge */}
        {isViewMode ? (
          <div className="h-7 flex items-center px-2 rounded text-xs bg-muted/15 border border-border/80 font-mono text-foreground font-medium select-text w-full flex-1">
            {value !== undefined && value !== null && value !== "" ? (
              <span>
                {resolvedOptions.find((o) => o.code === String(value))?.label ?? String(value)}
              </span>
            ) : (
              <span className="text-muted-foreground/50 italic text-[11px]">Not specified</span>
            )}
          </div>
        ) : widget === "select" ? (
          /* Select Dropdown */
          <Select
            disabled={isReadOnly || modelLoading}
            value={String(value ?? "")}
            onValueChange={handleSelectOrRadioChange}
          >
            <SelectTrigger
              id={field.id}
              className={cn(
                "h-7 text-xs bg-background rounded border-border/80 w-full flex-1",
                error && "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
              )}
            >
              <SelectValue
                placeholder={modelLoading ? "Loading options..." : `Select ${field.label}`}
              />
            </SelectTrigger>
            <SelectContent className="z-50 text-xs font-sans">
              {resolvedOptions.map((opt) => (
                <SelectItem key={opt.code} value={opt.code} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : widget === "radio-group" ? (
          /* Radio Group Tabs / Segmented Buttons */
          <div className="inline-flex rounded border border-border/80 p-0.5 bg-muted/30 gap-0.5">
            {resolvedOptions.map((opt) => {
              const isSelected = String(value) === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleSelectOrRadioChange(opt.code)}
                  className={cn(
                    "px-2.5 py-0.5 text-xs rounded transition-all cursor-pointer font-medium border-0",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50 bg-transparent",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : widget === "radio" ? (
          /* Standard Radio Buttons */
          <div className="flex items-center gap-3">
            {resolvedOptions.map((opt) => (
              <label
                key={opt.code}
                className="inline-flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.code}
                  disabled={isReadOnly}
                  checked={String(value) === opt.code}
                  onChange={() => handleSelectOrRadioChange(opt.code)}
                  className="size-3.5 text-primary focus:ring-primary/40 border-border"
                />
                <span className="text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        ) : widget === "switch" ? (
          /* Boolean Switch Toggle */
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id={field.id}
              disabled={isReadOnly}
              checked={Boolean(value)}
              onChange={(e) => onChange(field.fieldKey, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary" />
          </label>
        ) : widget === "checkbox-group" ? (
          /* Multi-Select Tag Checkbox Group */
          <div className="flex flex-wrap gap-1.5">
            {resolvedOptions.map((opt) => {
              const currentArr = Array.isArray(value) ? (value as string[]) : [];
              const isChecked = currentArr.includes(opt.code);
              return (
                <label
                  key={opt.code}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors",
                    isChecked
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40",
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={isChecked}
                    onChange={(e) => {
                      const nextArr = e.target.checked
                        ? [...currentArr, opt.code]
                        : currentArr.filter((item) => item !== opt.code);
                      onChange(field.fieldKey, nextArr);
                    }}
                    className="sr-only"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        ) : widget === "textarea" ? (
          /* Textarea */
          <div className="w-full flex-1">
            <Textarea
              rows={2}
              id={field.id}
              disabled={isReadOnly}
              placeholder={field.placeholder}
              value={String(value ?? "")}
              onChange={(e) => onChange(field.fieldKey, e.target.value)}
              className="w-full text-xs bg-background rounded border-border/80 p-2 font-sans focus-visible:ring-1 focus-visible:ring-ring min-h-14 resize-y"
            />
          </div>
        ) : widget === "amount" ? (
          /* Currency Amount */
          <div className="relative flex items-center w-full flex-1">
            {field.currencyPrefix && (
              <span className="absolute left-2 text-[10px] font-mono text-muted-foreground select-none">
                {field.currencyPrefix}
              </span>
            )}
            <Input
              type="text"
              id={field.id}
              disabled={isReadOnly}
              value={String(value ?? "")}
              onChange={(e) => onChange(field.fieldKey, e.target.value)}
              className={cn(
                "h-7 text-xs font-mono bg-background rounded border-border/80",
                field.currencyPrefix && "pl-9",
                error && "border-destructive",
              )}
            />
          </div>
        ) : widget === "date" ? (
          /* Date Picker */
          <div className="w-full flex-1">
            <DatePicker
              disabled={isReadOnly}
              date={parseDateValue(value)}
              onSelect={handleDateChange}
              placeholder={field.placeholder || "Select date"}
            />
          </div>
        ) : (
          /* Standard Input (Text or Number) */
          <div className="w-full flex-1">
            <Input
              type={widget === "number" ? "number" : "text"}
              id={field.id}
              disabled={isReadOnly}
              placeholder={field.placeholder}
              value={String(value ?? "")}
              onChange={(e) =>
                onChange(
                  field.fieldKey,
                  widget === "number" && e.target.value !== ""
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
              className={cn(
                "h-7 text-xs bg-background rounded border-border/80",
                error && "border-destructive",
              )}
            />
          </div>
        )}
      </div>

      {/* Field Error Message */}
      {error && <div className="text-[11px] text-destructive pl-36 font-medium">{error}</div>}
      {field.helperText && !error && (
        <div className="text-[11px] text-muted-foreground/70 pl-36">{field.helperText}</div>
      )}
    </div>
  );
}
