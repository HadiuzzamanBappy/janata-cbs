"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import {
  getFieldValue,
  INQUIRY_META_FIELDS,
  META_FIELD_GROUPS,
  type MetaFieldDef,
  setFieldValue,
} from "../fields";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";

export interface IcGeneralTabProps {
  formData: InquiryConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>;
  isReadOnly?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcGeneralTab({
  formData,
  setFormData,
  isReadOnly = false,
  validationErrors = [],
}: IcGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: MetaFieldDef, rawValue: string) => {
      let finalVal: unknown = rawValue;
      if (def.type === "number") {
        finalVal = rawValue ? Number(rawValue) : 0;
      } else if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => setFieldValue(prev, def.path, finalVal));
    },
    [setFormData],
  );

  const handleBooleanChange = React.useCallback(
    (def: MetaFieldDef, checked: boolean) => {
      setFormData((prev) => setFieldValue(prev, def.path, checked));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto select-none pr-1">
      <div className="max-w-3xl space-y-3">
        {META_FIELD_GROUPS.map((group) => {
          const groupFields = INQUIRY_META_FIELDS.filter((f) => f.group === group.id);

          return (
            <div
              key={group.id}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                {group.title}
              </div>

              {/* Data Fields: Aligned scanline controls */}
              <div className="space-y-2 text-xs">
                {groupFields.map((field) => {
                  const rawVal = getFieldValue(formData, field.path);
                  const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";

                  const fieldError = validationErrors.find(
                    (e) => e.tab === "general" && e.fieldKey === field.path,
                  );

                  // Boolean Field
                  if (field.type === "boolean") {
                    const boolId = `inq-bool-${field.path}`;
                    const isChecked = Boolean(rawVal);
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.helperText}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-2 max-w-md flex-1">
                          <label
                            htmlFor={boolId}
                            className={cn(
                              "flex items-center gap-2 select-none",
                              isReadOnly || field.disabled
                                ? "cursor-default opacity-85"
                                : "cursor-pointer",
                            )}
                          >
                            <Checkbox
                              id={boolId}
                              checked={isChecked}
                              disabled={isReadOnly || field.disabled}
                              onCheckedChange={(checked: boolean) =>
                                handleBooleanChange(field, Boolean(checked))
                              }
                              className={cn(
                                "rounded",
                                (isReadOnly || field.disabled) &&
                                  "disabled:opacity-90 disabled:cursor-default",
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

                  // Toggle Group for Select Options (Inquiry Type, Page Orientation)
                  if (field.type === "select") {
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.helperText}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-1.5 max-w-md flex-1">
                          {(field.options || []).map((opt) => {
                            const isSelected = displayVal === opt.value;
                            return (
                              <Button
                                key={opt.value}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                disabled={isReadOnly || field.disabled}
                                onClick={() => handleInputChange(field, opt.value)}
                                className={cn(
                                  "h-7 px-3 text-xs rounded flex-1 transition-all",
                                  isSelected
                                    ? "font-semibold shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {opt.label}
                              </Button>
                            );
                          })}
                        </div>
                      </FieldRow>
                    );
                  }

                  // Number field with quick presets (e.g. perpageItem)
                  if (field.path === "INQInfo.perpageItem") {
                    const presetValues = ["10", "20", "30", "50", "100"];
                    return (
                      <FieldRow
                        key={field.path}
                        label={field.label}
                        required={field.required}
                        enrichText={field.helperText}
                        error={fieldError?.message}
                      >
                        <div className="flex items-center gap-2 max-w-md flex-1">
                          <Input
                            type="number"
                            value={displayVal}
                            disabled={isReadOnly || field.disabled}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={field.placeholder || "30"}
                            className={cn(
                              "h-7 text-xs font-mono bg-background rounded border-border/80 w-24",
                              fieldError && "border-destructive focus-visible:ring-destructive/30",
                            )}
                            min={1}
                            max={500}
                          />
                          <div className="flex items-center gap-1">
                            {presetValues.map((val) => (
                              <Button
                                key={val}
                                type="button"
                                variant={displayVal === val ? "default" : "outline"}
                                size="sm"
                                disabled={isReadOnly || field.disabled}
                                onClick={() => handleInputChange(field, val)}
                                className="h-7 px-2 text-xs rounded font-mono"
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </FieldRow>
                    );
                  }

                  // Standard Text & Number Fields
                  const inputWidthClass =
                    field.width === "compact"
                      ? "w-36"
                      : field.width === "half"
                        ? "w-64"
                        : "w-full max-w-md";

                  return (
                    <FieldRow
                      key={field.path}
                      label={field.label}
                      required={field.required}
                      enrichText={field.helperText}
                      error={fieldError?.message}
                    >
                      <div className="flex-1 max-w-md flex items-center gap-2">
                        <Input
                          type={field.type === "number" ? "number" : "text"}
                          value={displayVal}
                          disabled={isReadOnly || field.disabled}
                          placeholder={field.placeholder}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          className={cn(
                            "h-7 text-xs bg-background rounded border-border/80",
                            inputWidthClass,
                            field.uppercase && "font-mono uppercase",
                            fieldError && "border-destructive",
                          )}
                        />
                      </div>
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
