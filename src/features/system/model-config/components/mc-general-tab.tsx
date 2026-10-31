"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type {
  ModelConfigRecord,
  ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import {
  getFieldValue,
  META_FIELD_GROUPS,
  type MetaFieldDef,
  MODEL_META_FIELDS,
  setFieldValue,
} from "../fields";

interface McGeneralTabProps {
  formData: ModelConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>;
  isReadOnly: boolean;
  validationErrors?: ValidationErrorItem[];
}

export function McGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: McGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: MetaFieldDef, rawValue: string) => {
      let finalVal: unknown = rawValue;
      if (def.type === "number") {
        finalVal = rawValue ? Number(rawValue) : undefined;
      } else if (def.type === "tags") {
        finalVal = rawValue
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
      } else if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => setFieldValue(prev, def.path, finalVal));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl space-y-3">
        {META_FIELD_GROUPS.map((group) => {
          const groupFields = MODEL_META_FIELDS.filter((f) => f.group === group.id);

          return (
            <div
              key={group.id}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                {group.title}
              </div>

              {/* Standard Data Fields: Top-to-Bottom with aligned scanline controls */}
              <div className="space-y-2 text-xs">
                {groupFields.map((field) => {
                  const rawVal = getFieldValue(formData, field.path);
                  const displayVal = Array.isArray(rawVal)
                    ? rawVal.join(", ")
                    : rawVal !== undefined && rawVal !== null
                      ? String(rawVal)
                      : "";

                  const lastSegment = field.path.split(".").pop();
                  const fieldError = validationErrors.find(
                    (e) =>
                      e.tab === "general" &&
                      (e.fieldKey === field.path || e.fieldKey === lastSegment),
                  );

                  // Boolean Field (e.g. Reset Sequence, Authorization)
                  if (field.type === "boolean") {
                    const boolFieldId = `mc-bool-${field.path}`;
                    const isChecked = Boolean(rawVal);
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.description}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-2 max-w-md flex-1">
                          <label
                            htmlFor={boolFieldId}
                            className={cn(
                              "flex items-center gap-2 select-none",
                              isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                            )}
                          >
                            <Checkbox
                              id={boolFieldId}
                              checked={isChecked}
                              disabled={isReadOnly}
                              onCheckedChange={(val: boolean) =>
                                setFormData((prev) => setFieldValue(prev, field.path, !!val))
                              }
                              className={cn(
                                "rounded",
                                isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                              )}
                            />
                            <span
                              className={cn(
                                "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                                isChecked
                                  ? "bg-primary/10 text-primary border-primary/25"
                                  : "bg-muted text-muted-foreground border-border/40",
                              )}
                            >
                              {isChecked ? "Yes" : "No"}
                            </span>
                          </label>
                        </div>
                      </FieldRow>
                    );
                  }

                  // Radio Group (e.g. Table Type - Global / Branch)
                  if (field.type === "radio-group") {
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.description}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-5 max-w-md flex-1">
                          <RadioGroup
                            value={rawVal ? String(rawVal) : ""}
                            onValueChange={(val: string) =>
                              setFormData((prev) =>
                                setFieldValue(prev, field.path, String(val ?? "")),
                              )
                            }
                            disabled={isReadOnly}
                            className="flex items-center gap-5"
                          >
                            {field.options?.map((opt) => {
                              const radioId = `mc-radio-${field.path}-${opt.value}`;
                              const isSelected =
                                String(rawVal || "").toUpperCase() === opt.value.toUpperCase();
                              return (
                                <div key={opt.value} className="flex items-center gap-1.5">
                                  <RadioGroupItem
                                    id={radioId}
                                    value={opt.value}
                                    disabled={isReadOnly}
                                    className="size-3.5"
                                  />
                                  <Label
                                    htmlFor={radioId}
                                    className={cn(
                                      "text-xs font-medium cursor-pointer select-none",
                                      isSelected
                                        ? "text-foreground font-semibold"
                                        : "text-muted-foreground",
                                      isReadOnly && "cursor-default opacity-85",
                                    )}
                                  >
                                    {opt.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </div>
                      </FieldRow>
                    );
                  }

                  // Id Pattern Builder (Select Id Pattern checkboxes)
                  if (field.type === "id-pattern-select") {
                    const selectedValues = Array.isArray(rawVal) ? (rawVal as string[]) : [];
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.description}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-4 flex-wrap max-w-xl flex-1">
                          {field.options?.map((opt) => {
                            const isChecked = selectedValues.includes(opt.value);
                            const optId = `mc-opt-${field.path}-${opt.value}`;
                            return (
                              <label
                                key={opt.value}
                                htmlFor={optId}
                                className={cn(
                                  "flex items-center gap-1.5 select-none",
                                  isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                                )}
                              >
                                <Checkbox
                                  id={optId}
                                  checked={isChecked}
                                  disabled={isReadOnly}
                                  onCheckedChange={(checked: boolean) => {
                                    const next = checked
                                      ? [...selectedValues, opt.value]
                                      : selectedValues.filter((v: string) => v !== opt.value);
                                    setFormData((prev) => setFieldValue(prev, field.path, next));
                                  }}
                                  className={cn(
                                    "rounded",
                                    isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                                  )}
                                />
                                <span className="text-xs font-normal text-foreground">
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </FieldRow>
                    );
                  }

                  // Date Picker (e.g. Developement Date)
                  if (field.type === "date") {
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.description}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-1.5 max-w-xs flex-1">
                          <Input
                            type="date"
                            value={displayVal}
                            disabled={isReadOnly}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className={cn(
                              "h-7 w-36 rounded text-xs bg-background border-border/80 font-mono",
                              isReadOnly &&
                                "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-normal text-foreground",
                            )}
                          />
                          {displayVal && !isReadOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData((prev) => setFieldValue(prev, field.path, ""))
                              }
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded"
                              title="Clear date"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </FieldRow>
                    );
                  }

                  // Checkbox Group (e.g. Other Tables - HIS, UNA, DEL)
                  if (field.type === "checkbox-group") {
                    const selectedValues = Array.isArray(rawVal) ? (rawVal as string[]) : [];
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.description}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-4 max-w-md flex-1">
                          {field.options?.map((opt) => {
                            const isChecked = selectedValues.includes(opt.value);
                            const optId = `mc-opt-${field.path}-${opt.value}`;
                            return (
                              <label
                                key={opt.value}
                                htmlFor={optId}
                                className={cn(
                                  "flex items-center gap-1.5 select-none",
                                  isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                                )}
                              >
                                <Checkbox
                                  id={optId}
                                  checked={isChecked}
                                  disabled={isReadOnly}
                                  onCheckedChange={(checked: boolean) => {
                                    const next = checked
                                      ? [...selectedValues, opt.value]
                                      : selectedValues.filter((v: string) => v !== opt.value);
                                    setFormData((prev) => setFieldValue(prev, field.path, next));
                                  }}
                                  className={cn(
                                    "rounded",
                                    isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                                  )}
                                />
                                <span className="text-xs font-mono font-normal text-foreground">
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </FieldRow>
                    );
                  }

                  // Standard text/number input
                  const inputWidth =
                    field.width === "compact"
                      ? "w-28"
                      : field.width === "half"
                        ? "w-52 sm:w-64"
                        : field.type === "number"
                          ? "w-28"
                          : "max-w-md flex-1";

                  const isFieldDisabled = isReadOnly || field.disabled;

                  return (
                    <FieldRow
                      key={field.path}
                      label={field.label}
                      required={field.required}
                      enrichText={field.description}
                      error={fieldError?.message}
                    >
                      <Input
                        type={field.type === "number" ? "number" : "text"}
                        value={displayVal}
                        disabled={isFieldDisabled}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className={cn(
                          "h-7 rounded text-xs bg-background",
                          fieldError
                            ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                            : "border-border/80",
                          isFieldDisabled &&
                            "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
                          field.uppercase ? "font-mono uppercase" : "",
                          inputWidth,
                        )}
                      />
                    </FieldRow>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
