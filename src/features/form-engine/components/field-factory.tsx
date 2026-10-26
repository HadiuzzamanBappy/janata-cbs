import { Minus, Plus, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
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
  labelOverride?: string;
  labelSuffix?: React.ReactNode;
  actionBeforeColon?: React.ReactNode;
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

function getFieldWidthStyle(length?: number, widget?: string): React.CSSProperties | undefined {
  if (
    widget === "switch" ||
    widget === "radio" ||
    widget === "radio-group" ||
    widget === "checkbox-group"
  ) {
    return undefined; // Natural content width
  }
  if (widget === "textarea") {
    return { width: "100%", maxWidth: "600px" };
  }
  if (widget === "date") {
    const ch = typeof length === "number" && length > 0 ? Math.max(length + 5, 16) : 16;
    return { width: `${ch}ch`, maxWidth: "100%" };
  }
  if (typeof length === "number" && length > 0) {
    // 1ch is approx the width of glyph '0'. Length + 4ch allows content + internal padding.
    const ch = Math.max(length + 4, 10);
    return { width: `${ch}ch`, maxWidth: "100%" };
  }
  // Standard compact fallback width when length is unspecified
  return { width: "32ch", maxWidth: "100%" };
}

export function UnifiedFieldFactory({
  field,
  value,
  onChange,
  error,
  disabled = false,
  mode = "I",
  labelOverride,
  labelSuffix,
  actionBeforeColon,
}: UnifiedFieldFactoryProps) {
  const isInputMode = mode === "I";
  const isViewMode = !isInputMode;
  const isReadOnly = disabled || field.readOnly || isViewMode;
  const effectiveLabel = labelOverride ?? field.label;

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

  const widget = field.widget || "text";
  const inputStyle = React.useMemo(() => {
    return getFieldWidthStyle(field.length, widget);
  }, [field.length, widget]);

  const isMulti = field.structure === "M";

  // Support for Multi-Value (M) primitive arrays with stable keys
  const [itemIds, setItemIds] = React.useState<string[]>(() => {
    const count = Array.isArray(value) ? Math.max(value.length, 1) : 1;
    return Array.from({ length: count }, () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    );
  });

  const arrayValues: unknown[] = React.useMemo(() => {
    if (!isMulti) return [];
    if (Array.isArray(value)) return value;
    return value !== undefined && value !== null && value !== "" ? [value] : [""];
  }, [isMulti, value]);

  // Keep itemIds synchronized with array length
  React.useEffect(() => {
    if (!isMulti) return;
    setItemIds((prev) => {
      if (prev.length === arrayValues.length) return prev;
      if (prev.length < arrayValues.length) {
        const addedCount = arrayValues.length - prev.length;
        const newIds = Array.from({ length: addedCount }, () =>
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        );
        return [...prev, ...newIds];
      }
      return prev.slice(0, arrayValues.length);
    });
  }, [isMulti, arrayValues.length]);

  const handleArrayChange = (idx: number, newVal: unknown) => {
    const next = [...arrayValues];
    next[idx] = newVal;
    onChange(field.fieldKey, next);
  };

  const handleAddArrayItem = (afterIdx?: number) => {
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (afterIdx !== undefined && afterIdx >= 0) {
      const nextIds = [...itemIds];
      nextIds.splice(afterIdx + 1, 0, newId);
      setItemIds(nextIds);

      const next = [...arrayValues];
      next.splice(afterIdx + 1, 0, "");
      onChange(field.fieldKey, next);
    } else {
      setItemIds((prev) => [...prev, newId]);
      onChange(field.fieldKey, [...arrayValues, ""]);
    }
  };

  const handleRemoveArrayItem = (idx: number) => {
    setItemIds((prev) => prev.filter((_, i) => i !== idx));
    const next = arrayValues.filter((_, i) => i !== idx);
    onChange(field.fieldKey, next.length > 0 ? next : [""]);
  };

  return (
    <div className="space-y-1">
      {/* View Mode: Read-Only Text Badge */}
      {isViewMode ? (
        <div className="flex items-center gap-2">
          <div className="w-40 shrink-0 flex items-center justify-between gap-1 select-none">
            <div className="flex items-center gap-1 min-w-0">
              <Label
                htmlFor={field.id}
                className="text-xs select-none text-muted-foreground truncate"
              >
                {effectiveLabel}
              </Label>
              {labelSuffix}
            </div>
            {actionBeforeColon}
          </div>
          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
          <div
            style={inputStyle}
            className="h-7 flex items-center px-2 rounded text-xs bg-muted/15 border border-border/80 font-mono text-foreground font-medium select-text"
          >
            {value !== undefined && value !== null && value !== "" ? (
              <span className="truncate">
                {Array.isArray(value)
                  ? value.join(", ")
                  : (resolvedOptions.find((o) => o.code === String(value))?.label ?? String(value))}
              </span>
            ) : (
              <span className="text-muted-foreground/50 italic text-[11px]">Not specified</span>
            )}
          </div>
        </div>
      ) : isMulti ? (
        /* Multi-Value (M) Rows: Label + #Number + Action (+/-) before Colon */
        <div className="space-y-1.5">
          {arrayValues.map((itemVal, itemIdx) => {
            const stableKey = itemIds[itemIdx] || `${field.id}-item-${itemIdx}`;
            const isFirst = itemIdx === 0;

            return (
              <div key={stableKey} className="flex items-center gap-2">
                {/* Left Label column: [Label Name] . [Index] [Action Button (+/-)] */}
                <div className="w-40 shrink-0 flex items-center justify-between gap-1 select-none">
                  <div className="flex items-center gap-1 min-w-0">
                    <Label
                      htmlFor={isFirst ? field.id : undefined}
                      className={cn(
                        "text-xs truncate",
                        error
                          ? "text-destructive font-semibold"
                          : field.required
                            ? "text-foreground font-medium"
                            : "text-muted-foreground",
                      )}
                    >
                      {field.label}
                      {field.required && isFirst && (
                        <span className="text-destructive font-bold ml-0.5">*</span>
                      )}
                    </Label>
                    {/* Number just after field label */}
                    <span className="font-mono text-[11px] text-muted-foreground/75 font-semibold">
                      .{itemIdx + 1}
                    </span>
                  </div>

                  {/* Actions (- and +) placed cleanly before the colon on every row */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Minus button to remove this specific item */}
                      {arrayValues.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveArrayItem(itemIdx)}
                          className="size-5 p-0 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                          title="Remove this item"
                        >
                          <Minus className="size-3.5 stroke-[2.5]" />
                        </Button>
                      )}

                      {/* Plus button to insert/append after this item */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddArrayItem(itemIdx)}
                        className="size-5 p-0 text-primary hover:bg-primary/10 rounded cursor-pointer"
                        title={`Insert another ${field.label} after item .${itemIdx + 1}`}
                      >
                        <Plus className="size-3.5 stroke-[2.5]" />
                      </Button>
                    </div>
                  )}
                </div>

                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                {/* Input Control with Full Widget Support */}
                {widget === "select" ? (
                  <div style={inputStyle} className="min-w-32">
                    <Select
                      disabled={isReadOnly || modelLoading}
                      value={String(itemVal ?? "")}
                      onValueChange={(val) =>
                        handleArrayChange(
                          itemIdx,
                          field.modelType === "Number" && val !== null
                            ? Number.isNaN(Number(val))
                              ? val
                              : Number(val)
                            : (val ?? ""),
                        )
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 text-xs bg-background rounded border-border/80 w-full",
                          error && "border-destructive",
                        )}
                      >
                        <SelectValue
                          placeholder={modelLoading ? "Loading..." : `Select ${field.label}`}
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
                  </div>
                ) : widget === "date" ? (
                  <div className="flex items-center gap-1.5 max-w-xs flex-1">
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={String(itemVal ?? "")}
                      onChange={(e) => handleArrayChange(itemIdx, e.target.value)}
                      className={cn(
                        "h-7 w-36 rounded text-xs bg-background border-border/80 font-mono",
                        error && "border-destructive",
                        isReadOnly &&
                          "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
                      )}
                    />
                    {Boolean(itemVal) && !isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArrayChange(itemIdx, "")}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                        title="Clear date"
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ) : widget === "textarea" ? (
                  <div style={inputStyle}>
                    <Textarea
                      rows={2}
                      disabled={isReadOnly}
                      placeholder={field.placeholder}
                      value={String(itemVal ?? "")}
                      onChange={(e) => handleArrayChange(itemIdx, e.target.value)}
                      className="w-full text-xs bg-background rounded border-border/80 p-2 font-sans focus-visible:ring-1 min-h-14 resize-y"
                    />
                  </div>
                ) : (
                  <div style={inputStyle}>
                    <Input
                      type={widget === "number" ? "number" : "text"}
                      disabled={isReadOnly}
                      placeholder={field.placeholder || `Item #${itemIdx + 1}`}
                      value={String(itemVal ?? "")}
                      onChange={(e) =>
                        handleArrayChange(
                          itemIdx,
                          widget === "number" && e.target.value !== ""
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                      className={cn(
                        "h-7 text-xs bg-background rounded border-border/80 w-full",
                        error && "border-destructive",
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Single-Value Scanline row */
        <div className="flex items-center gap-2">
          <div className="w-40 shrink-0 flex items-center justify-between gap-1 select-none">
            <div className="flex items-center gap-1 min-w-0">
              <Label
                htmlFor={field.id}
                className={cn(
                  "text-xs truncate",
                  error
                    ? "text-destructive font-semibold"
                    : field.required
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                )}
              >
                {effectiveLabel}
                {field.required && !isViewMode && (
                  <span className="text-destructive font-bold ml-1">*</span>
                )}
              </Label>
              {labelSuffix}
            </div>
            {actionBeforeColon}
          </div>

          <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

          {widget === "select" ? (
            /* Select Dropdown */
            <div style={inputStyle} className="min-w-32">
              <Select
                disabled={isReadOnly || modelLoading}
                value={String(value ?? "")}
                onValueChange={handleSelectOrRadioChange}
              >
                <SelectTrigger
                  id={field.id}
                  className={cn(
                    "h-7 text-xs bg-background rounded border-border/80 w-full",
                    error &&
                      "border-destructive focus-visible:ring-destructive/30 bg-destructive/5",
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
            </div>
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
            <div style={inputStyle}>
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
            <div style={inputStyle} className="relative flex items-center min-w-32">
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
                  "h-7 text-xs font-mono bg-background rounded border-border/80 w-full",
                  field.currencyPrefix && "pl-9",
                  error && "border-destructive",
                )}
              />
            </div>
          ) : widget === "date" ? (
            /* Date Input matching General Tab (type="date" with clean CBS styling and clear button) */
            <div className="flex items-center gap-1.5 max-w-xs flex-1">
              <Input
                type="date"
                id={field.id}
                disabled={isReadOnly}
                value={String(value ?? "")}
                onChange={(e) => onChange(field.fieldKey, e.target.value)}
                className={cn(
                  "h-7 w-36 rounded text-xs bg-background border-border/80 font-mono",
                  error && "border-destructive",
                  isReadOnly &&
                    "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
                )}
              />
              {Boolean(value) && !isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(field.fieldKey, "")}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                  title="Clear date"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          ) : (
            /* Standard Input (Text or Number) */
            <div style={inputStyle}>
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
                  "h-7 text-xs bg-background rounded border-border/80 w-full",
                  error && "border-destructive",
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Field Error Message */}
      {error && <div className="text-[11px] text-destructive pl-44 font-medium">{error}</div>}
      {field.helperText && !error && (
        <div className="text-[11px] text-muted-foreground/70 pl-44">{field.helperText}</div>
      )}
    </div>
  );
}
