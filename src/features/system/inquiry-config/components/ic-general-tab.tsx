"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                      <div key={field.path} className="min-h-7 flex items-center gap-2">
                        <Label className="w-40 shrink-0 text-xs text-muted-foreground font-normal select-none">
                          {field.label}
                        </Label>
                        <span className="text-muted-foreground/60 font-mono text-xs shrink-0">
                          :
                        </span>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={boolId}
                            checked={isChecked}
                            disabled={isReadOnly || field.disabled}
                            onCheckedChange={(checked: boolean) =>
                              handleBooleanChange(field, Boolean(checked))
                            }
                            className="rounded"
                          />
                          {field.helperText && (
                            <Label
                              htmlFor={boolId}
                              className="text-xs text-muted-foreground font-normal cursor-pointer"
                            >
                              {field.helperText}
                            </Label>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Select Field
                  if (field.type === "select") {
                    return (
                      <div key={field.path} className="flex items-center gap-2">
                        <Label className="w-40 shrink-0 text-xs text-muted-foreground font-normal select-none flex items-center">
                          <span className="truncate">{field.label}</span>
                          {field.required && !isReadOnly && (
                            <span className="text-destructive font-bold ml-1 select-none">*</span>
                          )}
                        </Label>
                        <span className="text-muted-foreground/60 font-mono text-xs shrink-0">
                          :
                        </span>
                        <div className="flex items-center gap-2">
                          <Select
                            value={displayVal}
                            disabled={isReadOnly || field.disabled}
                            onValueChange={(val: string | null) =>
                              handleInputChange(field, val || "")
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-7 text-xs bg-background rounded border-border/80",
                                field.width === "compact" ? "w-52" : "w-64",
                                fieldError && "border-destructive",
                              )}
                            >
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              {(field.options || []).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldError && (
                            <span className="text-[11px] text-destructive font-mono">
                              {fieldError.message}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Text & Number Fields
                  const inputWidthClass =
                    field.width === "compact"
                      ? "w-36"
                      : field.width === "half"
                        ? "w-64"
                        : "w-full max-w-md";

                  return (
                    <div key={field.path} className="flex items-center gap-2">
                      <Label className="w-40 shrink-0 text-xs text-muted-foreground font-normal select-none flex items-center">
                        <span className="truncate">{field.label}</span>
                        {field.required && !isReadOnly && (
                          <span className="text-destructive font-bold ml-1 select-none">*</span>
                        )}
                      </Label>
                      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                      <div className="flex-1 flex items-center gap-2">
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
                        {field.helperText && (
                          <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
                            {field.helperText}
                          </span>
                        )}
                        {fieldError && (
                          <span className="text-[11px] text-destructive font-mono shrink-0">
                            {fieldError.message}
                          </span>
                        )}
                      </div>
                    </div>
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
